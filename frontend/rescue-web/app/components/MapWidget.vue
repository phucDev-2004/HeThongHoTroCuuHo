<template>
  <div class="w-full h-full relative z-0 min-h-[500px]">
    <l-map
      ref="mapRef"
      v-model:zoom="currentZoom"
      :center="mapCenter"
      :options="mapOptions"
      @ready="onMapReady"
      @moveend="onMapMoveEnd"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        :max-zoom="19"
      />
      
      <l-marker v-if="isValidUserLocation" :lat-lng="userLatLng" :z-index-offset="1000">
        <l-popup>📍 Vị trí của bạn</l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, shallowRef, type PropType } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapIcons } from '~/composables/useMapIcons';
import type { MapPoint, BackendPoint, MapItem, MapBounds } from '~/types/map';

// --- Props & Emits ---
const props = defineProps({
  points: { type: Array as PropType<MapItem[]>, default: () => [] },
  userLocation: { type: Array as PropType<number[]>, default: () => [0, 0] },
});
const emit = defineEmits<{ (e: 'fetch-new-data', bounds: MapBounds): void }>();

// --- Config ---
const { getIcon } = useMapIcons();
const currentZoom = ref(13);
// preferCanvas: true giúp map mượt hơn khi có nhiều điểm
const mapOptions = { zoomControl: true, attributionControl: false, minZoom: 5, maxZoom: 19, preferCanvas: true };

// --- State ---
const mapInstance = shallowRef<L.Map | null>(null);
const markersLayer = shallowRef<L.LayerGroup | null>(null);
const activeMarkers = new Map<string, L.Marker>(); 
let debounceTimer: ReturnType<typeof setTimeout>;

// --- Computed ---
const isValidUserLocation = computed(() => 
  Array.isArray(props.userLocation) && props.userLocation.length === 2 && props.userLocation[0] !== 0
);
const userLatLng = computed((): [number, number] => 
  isValidUserLocation.value ? [props.userLocation[0]!, props.userLocation[1]!] : [0, 0]
);
const mapCenter = computed((): [number, number] => 
  isValidUserLocation.value ? userLatLng.value : [10.7769, 106.7009]
);

const parseLatLng = (p: MapItem): [number, number] | null => {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  return (isNaN(lat) || isNaN(lng)) ? null : [lat, lng];
};

// --- LOGIC POPUP ---
const createPopupContent = (p: MapPoint) => {
  //  Trường hợp: Cluster 1 điểm (Server chỉ trả về lat/lng, thiếu name/phone...)
   if (!p.name && !p.status) {
       return `<div style="text-align:center; padding:5px; color:#666; font-size:12px;">
                 Zoom lại gần hơn để xem chi tiết
               </div>`;
   }

   // Trường hợp: Point đầy đủ data
   return `
      <div style="font-family: sans-serif; min-width: 220px; color: #1f2937;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <div style="font-weight: 800; font-size: 14px; color: #111827;">${p.code || 'CODE-???'}</div>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 99px; background:#f3f4f6; color:#333">
                ${p.status || 'Mới'}
              </span>
          </div>
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">👤 ${p.name || 'Người dân'}</div>
          <div style="font-size: 12px; color: #4b5563; margin-bottom: 6px;">📍 ${p.address || 'Đang cập nhật...'}</div>
          ${p.contact_phone ? 
            `<a href="tel:${p.contact_phone}" style="display: block; width: 100%; text-align: center; background-color: #3b82f6; color: white; padding: 6px 0; border-radius: 4px; text-decoration: none; font-weight: 600; margin-top: 8px; font-size: 12px;">📞 Gọi ${p.contact_phone}</a>` 
            : ''}
      </div>
   `;
};

// --- CORE LOGIC: VẼ MARKER ---
const updateMarkers = () => {
  const layer = markersLayer.value;
  const map = mapInstance.value;
  if (!layer || !map) return;

  // if (props.points.length > 0) {
  //     console.log("👉 Điểm mới nhất (đầu mảng):", props.points[0]);
  // }

  const currentDataIds = new Set<string>();

  props.points.forEach((rawPoint) => {
    const isCluster = 'total' in rawPoint && (rawPoint.total as number) > 1;

    let uniqueId = '';
    if (isCluster) {
      const cluster = rawPoint as BackendPoint;
      uniqueId = `c_${cluster.latitude}_${cluster.longitude}_${cluster.total}`;
    } else {
      // Nếu là Point (hoặc cluster=1), dùng ID hoặc tọa độ làm key
      const point = rawPoint as MapPoint;
      uniqueId = point.id ? `p_${point.id}` : `p_${point.latitude}_${point.longitude}`;
    }

    currentDataIds.add(uniqueId);
    if (activeMarkers.has(uniqueId)) return;

    const latlng = parseLatLng(rawPoint);
    if (!latlng) return;

    let marker: L.Marker;

    if (isCluster) {
      // --- VẼ CLUSTER (VÒNG TRÒN XANH) ---
      const cluster = rawPoint as BackendPoint;
      const size = cluster.total < 10 ? 30 : (cluster.total < 100 ? 40 : 50);
      
      const clusterIcon = L.divIcon({
        html: `<div style="background-color:rgba(59,130,246,0.9); width:${size}px; height:${size}px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.3);">${cluster.total}</div>`,
        className: '',
        iconSize: [size, size]
      });
      
      marker = L.marker(latlng, { icon: clusterIcon, zIndexOffset: 500 });
      // Click vào cluster thì zoom vào chỗ đó
      marker.on('click', () => {
         map.flyTo(latlng, map.getZoom() + 2);
      });

    } else {
      // --- VẼ POINT (PIN ĐỎ/CAM/XANH) ---
      const point = rawPoint as MapPoint;
      // Nếu thiếu status (do là cluster=1), mặc định là 'default' (màu xám) hoặc 'pending' (màu đỏ)
      const status = point.status || 'default';
      
      marker = L.marker(latlng, { icon: getIcon(status) });
      marker.bindPopup(createPopupContent(point), { minWidth: 220 });
    }

    layer.addLayer(marker);
    activeMarkers.set(uniqueId, marker);
  });

  // Dọn dẹp marker thừa
  for (const [id, marker] of activeMarkers) {
    if (!currentDataIds.has(id)) {
      layer.removeLayer(marker);
      activeMarkers.delete(id);
    }
  }
};

// --- Events ---
const onMapMoveEnd = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const map = mapInstance.value;
    if (!map) return;
    const b = map.getBounds();
    emit('fetch-new-data', {
      min_lat: b.getSouth(), max_lat: b.getNorth(),
      min_lng: b.getWest(), max_lng: b.getEast(),
      zoom: map.getZoom(),
    });
  }, 200); // Debounce nhanh hơn chút (200ms)
};

const onMapReady = (mapObj: L.Map) => {
  mapInstance.value = mapObj;
  // Dùng FeatureGroup để quản lý tốt hơn LayerGroup
  markersLayer.value = L.featureGroup().addTo(mapObj);
  updateMarkers();
  onMapMoveEnd();
};

watch(() => props.points, () => {

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    //  console.log("🎨 Map bắt đầu vẽ lại marker...");
     updateMarkers();
  }, 50);
}, { deep: true });

watch(userLatLng, (newLoc) => {
    if (mapInstance.value && isValidUserLocation.value) mapInstance.value.flyTo(newLoc, 14);
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  markersLayer.value?.clearLayers();
  activeMarkers.clear();
  mapInstance.value = null;
});
</script>
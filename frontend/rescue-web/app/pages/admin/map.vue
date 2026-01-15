<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { LocationFilled } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';

import AdminMapComponent from '~/components/MapWidget.vue'; 
// import { useRealtimeMap } from '~/composables/useRealtimeMap';
import type { MapBounds } from '~/types/map';
import { useRescueStore } from '~/stores/rescueStore';

definePageMeta({ layout: 'admin', hideHeader: true });

const rescueStore = useRescueStore();

// 2. Sử dụng Composable
const { points, socketStatus } = storeToRefs(rescueStore);

// 3. Geolocation
const userLocation = ref<[number, number]>([0, 0]);

const getUserLocation = () => {
  if (typeof window === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = [pos.coords.latitude, pos.coords.longitude];
      console.log("📍 My Location:", userLocation.value);
    },
    (err) => console.warn("⚠️ GPS Error:", err.message)
  );
};

const handleLocationClick = () => getUserLocation();

const onMapBoundsChange = (bounds: MapBounds) => {
  rescueStore.fetchPoints(bounds);
};

onMounted(async () => {
  await nextTick();
  getUserLocation();
  rescueStore.connectWebSocket();
});
</script>

<template>
  <div class="h-screen w-full relative flex flex-col bg-slate-900">
    
    <ClientOnly>
      <AdminMapComponent 
        :points="points" 
        :user-location="userLocation"
        @fetch-new-data="onMapBoundsChange"
      />
    </ClientOnly>

    <div class="absolute top-4 right-4 z-[1000] shadow-md transition-all duration-300">
        <div v-if="socketStatus === 'OPEN'" class="flex items-center gap-2 bg-green-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-green-400">
             <span class="relative flex h-2 w-2">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
             </span>
             Live Realtime
        </div>
        <div v-else-if="socketStatus === 'CONNECTING'" class="bg-yellow-500/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
             ⏳ Connecting...
        </div>
        <div v-else class="bg-red-600/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
             ⚠️ Offline
        </div>
    </div>

    <button 
        @click="handleLocationClick"
        class="absolute bottom-8 right-4 z-[1000] bg-white text-slate-700 p-3 rounded-full shadow-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 border border-slate-200"
        title="Vị trí của tôi"
    >
        <el-icon :size="24"><LocationFilled /></el-icon>
    </button>
            
  </div>
</template>
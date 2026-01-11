// composables/useRealtimeMap.ts
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue';
import type { MapPoint, MapBounds, BackendPoint } from '~/types/map';

export const useRealtimeMap = () => {
  const config = useRuntimeConfig();
  // Lấy giá trị cấu hình, có thể là undefined, '/api', hoặc 'http://...'
  const API_BASE = config.public.apiBase as string | undefined; 
  
  const { apiFetch } = useApiClient();
  const tokenCookie = useCookie('access_token');

  const points = shallowRef<BackendPoint[]>([]);
  const socketStatus = ref<'CONNECTING' | 'OPEN' | 'CLOSED'>('CLOSED');
  
  let socket: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  // ... (giữ nguyên hàm fetchPoints) ...
  const fetchPoints = async (bounds?: MapBounds) => {
    try {
      const res = await apiFetch<BackendPoint[]>('api/requests/map-points', {
        params: {
          min_lat: bounds?.min_lat ?? 8.0,
          max_lat: bounds?.max_lat ?? 12.0,
          min_lng: bounds?.min_lng ?? 104.0,
          max_lng: bounds?.max_lng ?? 108.0,
          zoom: bounds?.zoom ?? 10
        }
      });
      if (Array.isArray(res)) points.value = res;
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // --- LOGIC WEBSOCKET MỚI ---
  const connectWebSocket = () => {
    if (!tokenCookie.value) {
      console.warn('⚠️ WS: Missing Token');
      return;
    }

    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    
    socketStatus.value = 'CONNECTING';

    try {
      // 1. Xác định Host và Protocol
      let wsHost = '127.0.0.1:8000'; // Mặc định Backend Port
      let wsProtocol = 'ws:';

      if (API_BASE && (API_BASE.startsWith('http://') || API_BASE.startsWith('https://'))) {
        // Trường hợp API_BASE là URL tuyệt đối (ví dụ cấu hình Production)
        const urlObj = new URL(API_BASE);
        wsHost = urlObj.host;
        wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      } else {
        // Trường hợp API_BASE là '/api' hoặc undefined (Development/Proxy)
        // Lưu ý: WebSocket KHÔNG đi qua Nuxt Proxy (routeRules) được dễ dàng
        // Nên ta trỏ thẳng về Backend Port 8000
        wsHost = '127.0.0.1:8000'; 
        
        // Nếu trang web đang chạy https (production deploy), buộc dùng wss
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            wsProtocol = 'wss:';
        }
      }

      // 2. Tạo URL (Đảm bảo không có /api ở path)
      // URL chuẩn: ws://127.0.0.1:8000/ws/map/?token=...
      const wsUrl = `${wsProtocol}//${wsHost}/ws/map/?token=${tokenCookie.value}`;

      console.log('🔗 WS Target:', wsUrl);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('🟢 WS Connected');
        socketStatus.value = 'OPEN';
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };

      socket.onclose = (event) => {
        console.warn(`🔴 WS Closed: ${event.code}`);
        socketStatus.value = 'CLOSED';
        socket = null;
        if (event.code !== 1000) reconnectTimer = setTimeout(connectWebSocket, 5000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSocketMessage(data);
        } catch (e) { console.error('WS JSON Error', e); }
      };

    } catch (err) {
      console.error('🔥 WS Connection Failed:', err);
      socketStatus.value = 'CLOSED';
    }
  };

  // ... (Giữ nguyên handleSocketMessage, watch, onMounted, onBeforeUnmount) ...
  const handleSocketMessage = (data: any) => { /* ...code cũ... */ };
  
  watch(tokenCookie, (newToken) => { if(newToken) { socket?.close(); connectWebSocket(); } });
  
  onMounted(() => { if (tokenCookie.value) connectWebSocket(); });
  
  onBeforeUnmount(() => { 
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close(1000); 
  });

  return { points, socketStatus, fetchPoints };
};
import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue';
import type { MapBounds, BackendPoint } from '~/types/map';

export const useRealtimeMap = () => {
  // Config & State
  const { apiFetch } = useApiClient(); // Đảm bảo bạn có composable này
  const tokenCookie = useCookie('access_token');

  const points = shallowRef<BackendPoint[]>([]);
  const socketStatus = ref<'CONNECTING' | 'OPEN' | 'CLOSED'>('CLOSED');
  
  let socket: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  // 1. Fetch điểm từ API
  const fetchPoints = async (bounds?: MapBounds) => {
    try {
      const res = await apiFetch<BackendPoint[]>('/api/requests/map-points', { 
        params: {
          min_lat: bounds?.min_lat ?? 8.0,
          max_lat: bounds?.max_lat ?? 12.0,
          min_lng: bounds?.min_lng ?? 104.0,
          max_lng: bounds?.max_lng ?? 108.0,
          zoom: bounds?.zoom ?? 10
        }
      });
      if (Array.isArray(res)) {
        points.value = res;
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // 2. Kết nối WebSocket (Đã fix logic Port)
  const connectWebSocket = () => {
    if (typeof window === 'undefined') return; // Chỉ chạy ở Client

    if (!tokenCookie.value) {
      console.warn('⚠️ WS: Chưa có Token');
      return;
    }

    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    
    socketStatus.value = 'CONNECTING';

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname; 
      let port = '';

      // --- LOGIC QUAN TRỌNG ---
      // 1. Nếu chạy Localhost -> Thêm port :8000
      if (host === 'localhost' || host === '127.0.0.1') {
         port = ':8000'; 
      } 
      // 2. Nếu chạy VPS (IP thật) -> Tạm thời cũng thêm :8000 (trừ khi bạn đã cấu hình Nginx proxy /ws/)
      // Nếu bạn đã cấu hình Nginx thì xóa dòng else if này đi
      else {
        //  port = ':8000'; 
      }

      // Endpoint: /ws/rescue/ (Khớp với routing.py của Backend)
      const wsUrl = `${protocol}//${host}${port}/ws/map/?token=${tokenCookie.value}`;

      console.log('🔗 Connecting WS:', wsUrl);

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
        if (event.code !== 1000) {
            reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleSocketMessage(payload);
        } catch (e) { console.error('WS JSON Error', e); }
      };

    } catch (err) {
      console.error('🔥 WS Error:', err);
      socketStatus.value = 'CLOSED';
    }
  };

  // 3. Xử lý tin nhắn đến
  const handleSocketMessage = (payload: any) => {
    const eventName = payload.data?.event;
    const data = payload.data?.data;

    if (eventName === 'NEW_REQUEST') {
        // Hiện thông báo (Alert)
        if (typeof window !== 'undefined') {
            alert(`🆘 CÓ YÊU CẦU MỚI!\nTại: ${data.address}\nSĐT: ${data.contact_phone}`);
        }
        // Load lại map
        fetchPoints();
    }
  };
  
  // 4. Lifecycle
  watch(tokenCookie, (newToken) => { 
      if (!newToken) socket?.close(1000);
      else connectWebSocket();
  });
  
  onMounted(() => { 
      if (tokenCookie.value) connectWebSocket(); 
  });
  
  onBeforeUnmount(() => { 
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close(1000); 
  });

  return { points, socketStatus, fetchPoints };
};
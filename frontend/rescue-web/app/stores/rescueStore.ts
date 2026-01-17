import { defineStore } from 'pinia';
import { useNuxtApp, useCookie } from '#app';
import type { MapItem, MapBounds, MapPoint } from '~/types/map';
import type { AppNotification, NotificationEventType } from '~/types/notification';

export const useRescueStore = defineStore('rescue', {
  state: () => ({
    points: [] as MapItem[],
    notifications: [] as AppNotification[],
    socketStatus: 'CLOSED' as 'CONNECTING' | 'OPEN' | 'CLOSED',
    socket: null as WebSocket | null,
    reconnectTimer: null as NodeJS.Timeout | null,
  }),

  getters: {
    // Đếm số thông báo chưa đọc
    unreadCount: (state) => state.notifications.filter(n => !n.isRead).length,
  },

  actions: {
    // --- 1. LẤY MAP POINTS ---
    async fetchPoints(bounds?: MapBounds) {
      const { apiFetch } = useApiClient();
      try {
        const res = await apiFetch<MapItem[]>('/api/requests/map-points', {
          params: { ...bounds },
        });
        if (Array.isArray(res)) {
          this.points = res;
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    },

    // --- 2. LẤY LỊCH SỬ THÔNG BÁO (FETCH API) ---
    async fetchNotifications() {
      const { apiFetch } = useApiClient(); 
      try {
        const res = await apiFetch<{ items: any[] }>('/api/notification', {
          method: 'GET',
          params: { limit: 20 },
        });

        if (res && res.items) {
          this.notifications = res.items.map((item: any) => {
            
            // LOGIC MỚI: Xử lý subStatus chuẩn xác hơn dựa trên payload của Backend
            let subStatus: AppNotification['subStatus'] = undefined;
            const meta = item.meta || {}; // Phòng trường hợp meta null
            
            // Ưu tiên check type trước
            if (item.type === 'new_task') {
                subStatus = 'ASSIGNED';
            } else if (item.type === 'complete') {
                subStatus = 'COMPLETED';
            } else if (item.type === 'task_update' || item.type === 'update') {
                // Nếu là update, check status trong meta
                if (meta.status === 'IN_PROGRESS') subStatus = 'IN_PROGRESS';
                else if (meta.status === 'ARRIVED') subStatus = 'ARRIVED';
            }

            return {
              id: item.id,
              type: item.type as NotificationEventType,
              title: item.title,
              message: item.message,
              time: new Date(item.created_at),
              isRead: item.is_read,
              // Map các ID liên quan
              relatedId: meta.id || meta.request_id || meta.task_id,
              subStatus: subStatus, // Đã fix logic ở trên
              lat: meta.latitude ? parseFloat(meta.latitude) : undefined,
              lng: meta.longitude ? parseFloat(meta.longitude) : undefined,
            } as AppNotification;
          });
        }
      } catch (error) {
        console.error('Lỗi tải thông báo:', error);
      }
    },

    // --- 3. KẾT NỐI WEBSOCKET ---
    connectWebSocket() {
      if (typeof window === 'undefined') return;

      const token = useCookie('access_token').value;
      if (!token || this.socketStatus === 'OPEN') return;

      this.socketStatus = 'CONNECTING';

      // Tự động detect wss/ws và host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = '127.0.0.1:8000'; // Hardcode hoặc dùng window.location.hostname
      const wsUrl = `${protocol}//${host}/ws/map/?token=${token}`;

      console.log('📡 WS Connecting:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('🟢 WS Connected');
        this.socketStatus = 'OPEN';
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
        
        // Gọi lại API khi mạng nối lại để sync dữ liệu
        this.fetchNotifications();
      };

      this.socket.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            this.handleEvent(payload);
        } catch (e) { console.error('WS Parse Error', e); }
      };

      this.socket.onclose = (e) => {
        this.socketStatus = 'CLOSED';
        this.socket = null;
        if (e.code !== 1000) {
           this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
        }
      };
    },

    // --- 4. XỬ LÝ SỰ KIỆN REALTIME ---
    handleEvent(payload: any) {
      const eventName = payload.event as NotificationEventType; 
      const data = payload.data?.data || payload.data; 

      if (!data) return;
      console.log('⚡ WS Received:', eventName, data);

      const reqId = data.request_id || data.id;

      // A. CẬP NHẬT MAP
      // 1. Thêm mới
      if (eventName === 'new_request') {
         const exists = this.points.some((p) => 'id' in p && p.id === reqId);
         if (!exists) {
            this.points.unshift({
              id: reqId,
              latitude: parseFloat(data.latitude || 0),
              longitude: parseFloat(data.longitude || 0),
              code: data.code,
              name: data.name,
              contact_phone: data.contact_phone,
              address: data.address,
              status: 'PENDING',
              total: 1,
            } as MapPoint);
         }
      }

      // 2. Update trạng thái Map
      if (eventName === 'new_task' || eventName === 'task_update') {
          const idx = this.points.findIndex((p) => 'id' in p && p.id === reqId);
          if (idx !== -1) {
            const point = this.points[idx] as MapPoint;
            if (data.status) point.status = data.status; 
            // Update toạ độ xe nếu có
            if(data.latitude && data.longitude) {
                point.latitude = parseFloat(data.latitude);
                point.longitude = parseFloat(data.longitude);
            }
          }
      }

      // 3. Xóa khi xong
      if (eventName === 'complete') {
          this.points = this.points.filter((p) => !('id' in p) || p.id !== reqId);
      }

      // B. TẠO THÔNG BÁO MỚI
      let title = 'Thông báo';
      let message = data.msg || data.message || '';
      let subStatus: AppNotification['subStatus'] = undefined;

      switch (eventName) {
        case 'new_request':
          title = '🆘 Yêu cầu cứu hộ mới';
          message = `${data.name} tại ${data.address}`;
          break;
        case 'new_task':
          title = 'Phân công nhiệm vụ';
          message = data.msg || 'Đội cứu hộ đã nhận nhiệm vụ.';
          subStatus = 'ASSIGNED';
          break;
        case 'task_update':
          if (data.status === 'IN_PROGRESS') { title = '🚑 Đội đang di chuyển'; subStatus = 'IN_PROGRESS'; }
          else if (data.status === 'ARRIVED') { title = '📍 Đã đến hiện trường'; subStatus = 'ARRIVED'; }
          else title = 'Cập nhật trạng thái';
          break;
        case 'complete':
          title = '✅ Nhiệm vụ hoàn thành';
          subStatus = 'COMPLETED';
          break;
      }

      const newNoti: AppNotification = {
        id: Date.now().toString(),
        type: eventName, 
        title: title,
        message: message,
        time: new Date(),
        isRead: false,
        relatedId: reqId,
        subStatus: subStatus,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined
      };

      this.notifications.unshift(newNoti);

      // Toast
      const { $toast } = useNuxtApp();
      if ($toast) {
         if (eventName === 'new_request') $toast.error(message);
         else if (eventName === 'complete') $toast.success(message);
         else $toast.info(message);
      }
    },

    // --- Helper ---
    markAsRead(notiId: string) {
      const noti = this.notifications.find((n) => n.id === notiId);
      if (noti) noti.isRead = true;
    },
    markAllAsRead() {
      this.notifications.forEach((n) => (n.isRead = true));
    },
    disconnect() {
      if (this.socket) {
        this.socket.close(1000);
        this.socket = null;
      }
    },
  },
});
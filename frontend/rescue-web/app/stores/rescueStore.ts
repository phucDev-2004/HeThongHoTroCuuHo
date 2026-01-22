import { defineStore } from 'pinia';
import { useNuxtApp, useCookie } from '#app';
import type { MapItem, MapBounds, MapPoint } from '~/types/map';
import type { AppNotification, NotificationEventType } from '~/types/notification';

export const useRescueStore = defineStore('rescue', {
  state: () => ({
    points: [] as MapItem[],
    notifications: [] as AppNotification[],

    nextCursor: null as string | null,
    hasMore: false,
    isLoadingNoti: false,

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
    async fetchNotifications(isLoadMore = false) {
      const { apiFetch } = useApiClient(); 
      if (this.isLoadingNoti) return;
      if (isLoadMore && !this.hasMore) return;

      this.isLoadingNoti = true;

      try {
        const params: any = { limit: 10 };
        if (isLoadMore && this.nextCursor) {
            params.cursor = this.nextCursor;
        }

        const res = await apiFetch<any>('/api/notification', {
          method: 'GET',
          params: params,
        });

        // Mapping dữ liệu (Logic map giữ nguyên như cũ)
        const mappedItems = (res.items || []).map((item: any) => {
           const meta = item.meta || {};
           let subStatus: AppNotification['subStatus'] = undefined;
           
           if (item.type === 'new_task') subStatus = 'ASSIGNED';
           else if (item.type === 'complete') subStatus = 'COMPLETED';
           else if (['task_update', 'update'].includes(item.type)) {
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
             relatedId: meta.id || meta.request_id || meta.task_id,
             subStatus: subStatus,
             lat: meta.latitude ? parseFloat(meta.latitude) : undefined,
             lng: meta.longitude ? parseFloat(meta.longitude) : undefined,
           } as AppNotification;
        });

        // XỬ LÝ STATE SAU KHI CÓ DỮ LIỆU
        if (isLoadMore) {
            // Nối thêm vào danh sách cũ
            this.notifications.push(...mappedItems);
        } else {
            // Làm mới hoàn toàn (khi F5 hoặc mới vào)
            this.notifications = mappedItems;
        }

        // Cập nhật Cursor cho lần load sau
        this.hasMore = res.has_more;
        this.nextCursor = res.next_cursor;

      } catch (error) {
        console.error('Lỗi tải thông báo:', error);
      } finally {
        this.isLoadingNoti = false;
      }
    },

    // --- 3. KẾT NỐI WEBSOCKET ---
    connectWebSocket() {
      if (typeof window === 'undefined') return;

      const token = useCookie('access_token').value;
      if (!token || this.socketStatus === 'OPEN') return;

      this.socketStatus = 'CONNECTING';

      const config = useRuntimeConfig();
      const apiBase = config.public.wsBase; 

      // Tự động thay đổi http->ws, https->wss
      // và bỏ phần đuôi dư thừa nếu có
      const wsBase = apiBase
          .replace('http://', 'ws://')
          .replace('https://', 'wss://')
          .replace(/\/$/, '');
          
      const wsUrl = `${wsBase}/ws/map/?token=${token}`;

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

    async markAsRead(notiId: string) {
      const noti = this.notifications.find((n) => n.id === notiId);
      if (!noti || noti.isRead) return;

      const { apiFetch } = useApiClient();
      try {
        noti.isRead = true;

        // 2. Gọi API background
        await apiFetch(`/api/notification/read-one/${notiId}`, { method: 'PATCH' });
        
      } catch (error) {
        console.error('Lỗi API markAsRead:', error);
        // Revert lại nếu lỗi mạng
        noti.isRead = false; 
      }
    },

    // Đọc tất cả
    async markAllAsRead() {
      if (this.unreadCount === 0) return;

      const { apiFetch } = useApiClient();

      try {
        this.notifications.forEach((n) => (n.isRead = true));

        // 2. Gọi API
        await apiFetch('/api/notification/read-all', { method: 'PATCH' });

        // (Optional) Toast thông báo
        // ElMessage.success('Đã đánh dấu tất cả là đã đọc');

      } catch (error) {
        console.error('Lỗi API markAllAsRead:', error);
        
        // Nếu lỗi, cách tốt nhất là tải lại danh sách từ server để đồng bộ đúng trạng thái
        await this.fetchNotifications();
      }
    },
    disconnect() {
      if (this.socket) {
        this.socket.close(1000);
        this.socket = null;
      }
    },
  },
});
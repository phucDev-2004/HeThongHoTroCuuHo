import { defineStore } from 'pinia';
import type { MapPoint, MapItem, MapBounds } from '~/types/map';
// import type { AppNotification } from '~/types/notification';

export const useRescueStore = defineStore('rescue', {
  state: () => ({
    points: [] as MapItem[],
    // notifications: [] as AppNotification[],
    socketStatus: 'CLOSED' as 'CONNECTING' | 'OPEN' | 'CLOSED',
    socket: null as WebSocket | null,
    reconnectTimer: null as NodeJS.Timeout | null,
  }),

  // getters: {
  //   // 2. Đếm số thông báo chưa đọc (để hiện số đỏ trên quả chuông)
  //   unreadCount: (state) => state.notifications.filter(n => !n.isRead).length,
  // },

  actions: {
    // 1. Fetch điểm (Chỉ dùng khi mới vào trang hoặc di chuyển map xa)
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

    // 2. Kết nối WebSocket
    connectWebSocket() {
      if (typeof window === 'undefined') return;
      const token = useCookie('access_token').value;
      if (!token || this.socketStatus === 'OPEN') return;

      this.socketStatus = 'CONNECTING';

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = (host === 'localhost' || host === '127.0.0.1') ? ':8000' : '';
      const wsUrl = `${protocol}//${host}${port}/ws/map/?token=${token}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('🟢 WS Connected');
        this.socketStatus = 'OPEN';
      };

      this.socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        this.handleEvent(payload);
      };

      this.socket.onclose = (e) => {
        this.socketStatus = 'CLOSED';
        this.socket = null;
        if (e.code !== 1000) {
          // Reconnect sau 3s
          setTimeout(() => this.connectWebSocket(), 3000);
        }
      };
    },

    // 3. Xử lý sự kiện (Realtime Update)
    handleEvent(payload: any) {
      // Sửa logic lấy data để tránh undefined
      const eventName = payload.event || payload.data?.event;
      const data = (payload.data?.data || payload.data) as any;

      console.log('⚡ Event:', eventName, data);

      if (!data) return;

      // --- PHẦN 1: CẬP NHẬT MAP & TOAST ---
      switch (eventName) {
        case 'NEW_TASK':
        case 'NEW_REQUEST':
          this.points.unshift({
            id: data.request_id || data.id,
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            code: data.code || 'NEW',
            name: data.name || 'Người dân',
            contact_phone: data.contact_phone,
            address: data.address,
            status: 'PENDING',
            total: 1,
            adults: null,
            children: null,
            elderly: null,
            conditions: null,
          } as MapPoint);

          // Toast thông báo ngay
          if (useNuxtApp().$toast) {
            useNuxtApp().$toast.error(`🆘 CỨU HỘ MỚI: ${data.msg || data.address}`);
          }
          break;

        case 'TASK_UPDATE':
        case 'NEW_TASK_ASSIGNED':
          const idx = this.points.findIndex((p) => {
            return 'id' in p && p.id === data.request_id;
          });

          if (idx !== -1) {
            const foundPoint = this.points[idx] as MapPoint;
            foundPoint.status = data.status;

            if (data.latitude && data.longitude) {
              foundPoint.latitude = data.latitude;
              foundPoint.longitude = data.longitude;
            }

            if (useNuxtApp().$toast) {
              useNuxtApp().$toast.info(`🔔 Cập nhật: ${data.msg}`);
            }
          }
          break;

        case 'TASK_COMPLETED':
          this.points = this.points.filter((p) => {
            if (!('id' in p)) return true; // Giữ lại Cluster
            return p.id !== data.request_id; // Xóa Point đã xong
          });

          if (useNuxtApp().$toast) {
            useNuxtApp().$toast.success(`✅ Hoàn thành: ${data.msg}`);
          }
          break;
      }

      // --- PHẦN 2: THÊM VÀO DANH SÁCH THÔNG BÁO ---
    //   const notiObj: AppNotification = {
    //     id: Date.now().toString(),
    //     time: new Date(),
    //     isRead: false,
    //     relatedId: data.request_id || data.id,
    //     lat: data.latitude,
    //     lng: data.longitude,
    //     type: 'UPDATE',
    //     title: 'Thông báo',
    //     message: data.msg || '',
    //   };

    //   if (eventName === 'NEW_TASK' || eventName === 'NEW_REQUEST') {
    //     notiObj.type = 'NEW_TASK';
    //     notiObj.title = '🆘 Yêu cầu cứu hộ mới';
    //     notiObj.message = `Tại: ${data.address}`;
    //   } else if (eventName && eventName.includes('UPDATE')) {
    //     notiObj.title = '🔔 Cập nhật trạng thái';
    //     notiObj.message = `${data.status}: ${data.msg}`;
    //   } else if (eventName && eventName.includes('COMPLETED')) {
    //     notiObj.type = 'COMPLETE';
    //     notiObj.title = '✅ Nhiệm vụ hoàn thành';
    //     notiObj.message = data.msg;
    //   }

    //   this.notifications.unshift(notiObj);
    // },

    // // 4. Các hàm thao tác với thông báo
    // markAsRead(notiId: string) {
    //   const noti = this.notifications.find((n) => n.id === notiId);
    //   if (noti) noti.isRead = true;
    // },

    // markAllAsRead() {
    //   this.notifications.forEach((n) => (n.isRead = true));
    // },

    // disconnect() {
    //   if (this.socket) {
    //     this.socket.close(1000);
    //     this.socket = null;
    //   }
    },
  },
});
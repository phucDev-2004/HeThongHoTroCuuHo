// types/notification.ts
export interface AppNotification {
  id: string;
  type: 'NEW_TASK' | 'UPDATE' | 'COMPLETE';
  title: string;
  message: string;
  time: Date;
  isRead: boolean; // Đã xem hay chưa
  relatedId: string; // ID của task để click vào thì nhảy tới
  lat?: number; // Tọa độ để map bay tới
  lng?: number;
}
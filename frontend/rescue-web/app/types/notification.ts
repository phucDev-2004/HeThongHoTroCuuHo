// types/notification.ts

export type NotificationEventType = 
  | 'new_request'  // Yêu cầu cứu hộ mới
  | 'new_task'     // Phân công nhiệm vụ
  | 'task_update'  // Cập nhật (Di chuyển / Đến nơi)
  | 'complete';    // Hoàn thành

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
  taskId?: string;
  relatedId: string;
  subStatus?: 'IN_PROGRESS' | 'ARRIVED' | 'COMPLETED' | 'ASSIGNED'; 

  latitude?: number;
  longitude?: number;
}
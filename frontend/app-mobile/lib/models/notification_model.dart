class NotificationModel {
  final String id;       // Sửa thành String để chứa UUID
  final String title;
  final String message;
  final String time;
  final String type;
  bool isRead;
  final Map<String, dynamic>? meta; // Lưu thêm meta nếu cần dùng sau này

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    this.type = 'info',
    this.isRead = false,
    this.meta,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      // JSON trả về id dạng "07ec86df-..."
      id: json['id']?.toString() ?? '',

      title: json['title'] ?? 'Thông báo mới',

      message: json['message'] ?? '',

      // JSON trả về "created_at": "2026-01-17T12:43:53.773Z"
      time: json['created_at'] ?? '',

      type: json['type'] ?? 'info',

      // JSON trả về "is_read": false
      isRead: json['is_read'] ?? false,

      // Lưu lại meta data (địa chỉ, tọa độ...) để khi click vào có thể điều hướng map
      meta: json['meta'],
    );
  }
}
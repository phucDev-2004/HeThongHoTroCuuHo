import 'dart:convert';
import 'package:http/http.dart' as http;
import '../configs/api_config.dart';
import '../models/notification_model.dart';
import 'auth_service.dart';

class NotificationService {

  static Future<List<NotificationModel>> getNotifications() async {
    final token = await AuthService.getToken();
    if (token == null) return [];

    try {
      final response = await http.get(
        // API của bạn dùng số ít "notification" hay số nhiều "notifications"?
        // Dựa vào code bạn gửi là "notification". Nếu lỗi 404 hãy thử thêm 's'
        Uri.parse('${ApiConfig.baseUrl}/api/notification?limit=10'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      if (response.statusCode == 200) {
        // 1. Decode ra Map trước (vì JSON bọc ngoài là {})
        final Map<String, dynamic> body = jsonDecode(utf8.decode(response.bodyBytes));

        // 2. Lấy danh sách từ key 'items'
        if (body['items'] != null) {
          final List<dynamic> items = body['items'];
          return items.map((e) => NotificationModel.fromJson(e)).toList();
        }
      } else {
        print("Lỗi tải thông báo: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching notifications: $e");
    }
    return [];
  }
}
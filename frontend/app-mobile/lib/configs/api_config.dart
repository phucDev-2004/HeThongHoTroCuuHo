// File: lib/configs/api_config.dart
import 'package:flutter/foundation.dart'; // Để dùng kReleaseMode, kIsWeb

class ApiConfig {
  // Constructor private để chặn việc khởi tạo class này (chỉ dùng static)
  ApiConfig._();

  static String get baseUrl {
    // 1. Khi Build ra file APK/IPA (Production) -> Dùng IP VPS
    if (kReleaseMode) {
      // Lưu ý: VPS chạy Nginx cổng 80 nên không cần :8000
      return 'http://14.225.198.75';
    }

    // 2. Khi chạy Local (Debug)
    if (kIsWeb) {
      return 'http://localhost:8000'; // Web Local
    } else {
      // Android Emulator mặc định
      return 'http://10.0.2.2:8000';
    }
  }

  // Bạn có thể thêm các hằng số khác ở đây nếu cần
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
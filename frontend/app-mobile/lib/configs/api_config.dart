// File: lib/configs/api_config.dart
import 'package:flutter/foundation.dart'; // Chứa kReleaseMode, kIsWeb, defaultTargetPlatform

class ApiConfig {
  ApiConfig._();

  // ==================== CẤU HÌNH IP ====================

  // 1. Production: Domain thật (Khi build Release)
  static const String _prodUrl = 'https://cuuho.vpone.site';

  // 2. Local Dev (Máy thật Android):
  // Nếu test trên điện thoại thật, hãy thay IP LAN của bạn vào đây (VD: 192.168.1.x)
  static const String _localWifiIP = '192.168.1.5';


  // ==================== LOGIC LẤY BASE URL (API) ====================
  static String get baseUrl {
    // 1. MÔI TRƯỜNG PRODUCTION (Ưu tiên số 1)
    if (kReleaseMode) {
      return _prodUrl;
    }

    // 2. MÔI TRƯỜNG DEV

    // A. Chạy trên WEB (Chrome/Edge/Safari)
    // Lưu ý: Web chạy localhost là chuẩn.
    if (kIsWeb) {
      return 'http://localhost:8000';
    }

    // B. Chạy trên ANDROID
    // Dùng defaultTargetPlatform thay vì Platform.isAndroid để tránh lỗi trên Web
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Cách 1: Emulator (Giả lập)
      return 'http://10.0.2.2:8000';

      // Cách 2: Máy thật (Bỏ comment dòng dưới nếu dùng máy thật)
      // return 'http://$_localWifiIP:8000';
    }

    // C. Chạy trên iOS (Simulator) hoặc macOS
    return 'http://127.0.0.1:8000';
  }

  // ==================== LOGIC LẤY SOCKET URL (REALTIME) ====================
  static String get socketUrl {
    final String base = baseUrl;

    // Tự động đổi http -> ws và https -> wss
    if (base.startsWith('https')) {
      return base.replaceAll('https://', 'wss://');
    } else {
      return base.replaceAll('http://', 'ws://');
    }
  }

  // Timeout settings
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
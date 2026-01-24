import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../configs/api_config.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  Function(Map<String, dynamic>)? onMessageReceived;

  bool _isConnected = false;

  // LƯU Ý: Đổi thành "/ws/map/" nếu backend bạn bắn thông báo qua kênh map
  final String _endpoint = "/ws/map/";

  Future<void> connect() async {
    print("🚀 [DEBUG] Bắt đầu hàm connect()...");

    try {
      final prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString('access_token');

      // 1. KIỂM TRA TOKEN
      print("🔑 [DEBUG] Token hiện tại: '$token'");

      if (token == null || token.isEmpty) {
        print("❌ [LỖI] Token bị null hoặc rỗng. Dừng kết nối ngay!");
        return;
      }

      // 2. KIỂM TRA URL
      String wsUrl = "${ApiConfig.socketUrl}$_endpoint";
      print("🔗 [DEBUG] URL Gốc: $wsUrl");

      if (kIsWeb) {
        wsUrl = "$wsUrl?token=$token";
        print("🌍 [DEBUG] URL Web (có token): $wsUrl");
      }

      print("🔄 [DEBUG] Đang gọi WebSocketChannel.connect...");

      // 3. THỰC HIỆN KẾT NỐI
      if (kIsWeb) {
        _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      } else {
        _channel = IOWebSocketChannel.connect(
          Uri.parse(wsUrl),
          headers: {
            'Authorization': 'Bearer $token',
            'Origin': ApiConfig.baseUrl.replaceFirst('http', 'https'),
          },
          pingInterval: const Duration(seconds: 10),
        );
      }

      _isConnected = true;
      print("✅ [DEBUG] Đã khởi tạo socket xong. Đang lắng nghe...");

      _subscription = _channel!.stream.listen(
            (message) {
          print("📩 [SOCKET DATA]: $message"); // <--- In tin nhắn ra console
          if (onMessageReceived != null) {
            final data = jsonDecode(message);
            onMessageReceived!(data);
          }
        },
        onError: (error) {
          print("🔴 [SOCKET ERROR]: $error");
          _handleDisconnect();
        },
        onDone: () {
          print("🟠 [SOCKET DONE]: Kết nối đã đóng");
          _handleDisconnect();
        },
      );
    } catch (e) {
      print("☠️ [EXCEPTION]: $e");
      _handleDisconnect();
    }
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _subscription?.cancel();
    if (_channel != null) {
      _channel!.sink.close();
      _isConnected = false;
    }
  }

  void _handleDisconnect() {
    _isConnected = false;
    if (_reconnectTimer != null && _reconnectTimer!.isActive) return;

    log("⏳ WS: Reconnecting in 5s...");
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      connect();
    });
  }
}
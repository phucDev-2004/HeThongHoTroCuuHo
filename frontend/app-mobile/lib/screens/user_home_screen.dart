import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../services/auth_service.dart';
import '../services/websocket_service.dart';
import 'user_profile_screen.dart';
import 'sos_form_screen.dart';
import 'notification_screen.dart';

class UserHomeScreen extends StatefulWidget {
  const UserHomeScreen({super.key});

  @override
  State<UserHomeScreen> createState() => _UserHomeScreenState();
}

class _UserHomeScreenState extends State<UserHomeScreen> with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isPressed = false;
  double _pressProgress = 0.0;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  final WebSocketService _wsService = WebSocketService();
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  String? _rescueStatusMessage;
  String? _rescuerName;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: false);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    _initNotifications();
    _connectWebSocket();
  }

  Future<void> _initNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(android: androidSettings, iOS: iosSettings);
    await _notificationsPlugin.initialize(settings);
  }

  Future<void> _showNotification(String title, String body) async {
    const androidDetails = AndroidNotificationDetails(
        'rescue_channel', 'Cập nhật cứu hộ',
        importance: Importance.max, priority: Priority.high, playSound: true
    );
    const details = NotificationDetails(android: androidDetails);
    await _notificationsPlugin.show(0, title, body, details);
  }

  void _connectWebSocket() {
    _wsService.onMessageReceived = (data) {
      String message = data['message'] ?? "Có cập nhật mới";
      String status = data['status'] ?? "";

      if (mounted) {
        setState(() {
          _rescueStatusMessage = message;
          if (data['rescuer_name'] != null) {
            _rescuerName = data['rescuer_name'];
          }
          if (status == 'COMPLETED') {
            Future.delayed(const Duration(seconds: 10), () {
              if(mounted) setState(() => _rescueStatusMessage = null);
            });
          }
        });
      }
      _showNotification("Thông báo cứu hộ", message);
    };
    _wsService.connect();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _wsService.disconnect();
    super.dispose();
  }

  Future<void> _callHotline(String number) async {
    final Uri launchUri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(launchUri)) await launchUrl(launchUri);
  }

  void _onSOSPressed() {
    setState(() { _isPressed = false; _pressProgress = 0.0; });
    Navigator.push(context, MaterialPageRoute(builder: (context) => const SOSFormScreen()));
  }

  void _startHolding() async {
    setState(() => _isPressed = true);
    for (int i = 0; i <= 30; i++) {
      if (!_isPressed) return;
      await Future.delayed(const Duration(milliseconds: 100));
      if (mounted) setState(() => _pressProgress = i / 30);
      if (i == 30 && _isPressed) _onSOSPressed();
    }
  }

  void _stopHolding() {
    if (_pressProgress < 1.0) setState(() { _isPressed = false; _pressProgress = 0.0; });
  }

  void _logout() {
    _wsService.disconnect();
    AuthService.logout();
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.getCurrentUser();
    final primaryRed = const Color(0xFFE53935);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          _buildModernHeader(user),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // --- HIỂN THỊ TRẠNG THÁI CỨU HỘ LIVE ---
                  if (_rescueStatusMessage != null)
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.notifications_active, color: Colors.blue, size: 30),
                            const SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("CẬP NHẬT TỪ ĐỘI CỨU HỘ", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blue)),
                                  const SizedBox(height: 4),
                                  Text(_rescueStatusMessage!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.black87)),
                                  if (_rescuerName != null)
                                    Text("Cán bộ: $_rescuerName", style: const TextStyle(fontSize: 13, color: Colors.grey)),
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 20),
                  SizedBox(
                    width: 300, height: 300,
                    child: GestureDetector(
                      onLongPressStart: (_) => _startHolding(),
                      onLongPressEnd: (_) => _stopHolding(),
                      onLongPressCancel: () => _stopHolding(),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: _pulseAnimation,
                            builder: (context, child) => Container(
                              width: 220 * _pulseAnimation.value,
                              height: 220 * _pulseAnimation.value,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: primaryRed.withOpacity(0.05 * (1.3 - _pulseAnimation.value)),
                              ),
                            ),
                          ),
                          SizedBox(
                            width: 230, height: 230,
                            child: CircularProgressIndicator(
                              value: _pressProgress, strokeWidth: 8,
                              backgroundColor: Colors.grey[100],
                              valueColor: AlwaysStoppedAnimation<Color>(primaryRed),
                            ),
                          ),
                          Container(
                            width: 200, height: 200,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: _isPressed
                                    ? [const Color(0xFFB71C1C), const Color(0xFFD32F2F)]
                                    : [const Color(0xFFE53935), const Color(0xFFEF5350)],
                                begin: Alignment.topLeft, end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: primaryRed.withOpacity(0.4), blurRadius: 20, spreadRadius: 5, offset: const Offset(0, 10)),
                              ],
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.touch_app_rounded, size: 50, color: Colors.white),
                                const SizedBox(height: 8),
                                Text(
                                  _isPressed ? 'ĐANG GỬI...' : 'NHẤN GIỮ\n3 GIÂY',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18, height: 1.2),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text("Gửi tín hiệu SOS kèm vị trí đến đội cứu hộ", style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                  const SizedBox(height: 40),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("GỌI KHẨN CẤP QUỐC GIA", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 1.0)),
                        const SizedBox(height: 15),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildHotlineButton("113", "Cảnh sát", Colors.brown, Icons.local_police),
                            _buildHotlineButton("114", "Cứu hỏa", Colors.orange, Icons.local_fire_department),
                            _buildHotlineButton("115", "Cấp cứu", Colors.blue, Icons.medical_services),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        backgroundColor: Colors.white,
        indicatorColor: Colors.red.withOpacity(0.1),
        onDestinationSelected: (index) {
          if (index == 1) {
            Navigator.pushNamed(context, '/user-history');
          } else if (index == 2) {
            Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const UserProfileScreen())
            ).then((_) {
              setState(() => _currentIndex = 0);
            });
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFFE53935)),
            label: 'Trang chủ',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: Color(0xFFE53935)),
            label: 'Lịch sử',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFFE53935)),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }

  Widget _buildModernHeader(Map<String, dynamic>? user) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 25),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade900, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [BoxShadow(color: Colors.red.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(2),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: CircleAvatar(radius: 22, backgroundColor: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Xin chào, ${user?['full_name'] ?? 'Bạn'}!', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                const Row(
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.white70),
                    SizedBox(width: 4),
                    Expanded(child: Text('Vị trí: Đang cập nhật...', style: TextStyle(fontSize: 12, color: Colors.white70), overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const NotificationScreen())
                  );
                },
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                  child: const Icon(Icons.notifications_none, color: Colors.white, size: 20),
                ),
              ),
              const SizedBox(width: 4),
              IconButton(
                onPressed: _logout,
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                  child: const Icon(Icons.logout, color: Colors.white, size: 20),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildHotlineButton(String number, String label, Color color, IconData icon) {
    return InkWell(
      onTap: () => _callHotline(number),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 100,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withOpacity(0.2), blurRadius: 5)]), child: Icon(icon, color: color, size: 28)),
            const SizedBox(height: 10),
            Text(number, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey[600])),
          ],
        ),
      ),
    );
  }
}
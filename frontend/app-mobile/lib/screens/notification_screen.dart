import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await NotificationService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    }
  }

  // Chọn icon và màu sắc dựa theo loại thông báo
  Map<String, dynamic> _getStyle(String type) {
    switch (type) {
      case 'success':
        return {'color': Colors.green, 'icon': Icons.check_circle, 'bg': Colors.green.shade50};
      case 'warning':
        return {'color': Colors.orange, 'icon': Icons.warning_amber_rounded, 'bg': Colors.orange.shade50};
      case 'error':
        return {'color': Colors.red, 'icon': Icons.error_outline, 'bg': Colors.red.shade50};
      default:
        return {'color': Colors.blue, 'icon': Icons.info_outline, 'bg': Colors.blue.shade50};
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text("Thông báo", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
        actions: [
          IconButton(
            icon: const Icon(Icons.check_circle_outline),
            tooltip: "Đánh dấu đã đọc tất cả",
            onPressed: () {}, // TODO: Gọi API đánh dấu đã đọc
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
        onRefresh: _loadData,
        child: _notifications.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _notifications.length,
          itemBuilder: (context, index) {
            final item = _notifications[index];
            final style = _getStyle(item.type);

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
                border: item.isRead
                    ? Border.all(color: Colors.transparent)
                    : Border.all(color: style['color'].withOpacity(0.3), width: 1),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: style['bg'],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(style['icon'], color: style['color']),
                ),
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: item.isRead ? Colors.grey[600] : Colors.black87,
                        ),
                      ),
                    ),
                    Text(
                      item.time,
                      style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                    ),
                  ],
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    item.message,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                ),
                onTap: () {
                  // Click vào xem chi tiết hoặc đánh dấu đã đọc
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_off_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text("Chưa có thông báo nào", style: TextStyle(fontSize: 16, color: Colors.grey[500])),
        ],
      ),
    );
  }
}
// services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../configs/api_config.dart';

class AuthService {
  static Map<String, dynamic>? _currentUser;

  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    // ID này của bạn, giữ nguyên
    clientId: '456997668692-6o22fr9o1gg6rhl3qrcn8i7f49te90b7.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  // --- API ĐĂNG KÝ ---
  static Future<bool> register(String name, String phone, String password) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/api/auth/register');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "full_name": name,
          "phone": phone,
          "password": password
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print("Lỗi đăng ký: $e");
      return false;
    }
  }

  // --- API ĐĂNG NHẬP THƯỜNG ---
  static Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return await _saveUserData(response.body);
      } else {
        return false;
      }
    } catch (e) {
      print('Lỗi kết nối Login: $e');
      return false;
    }
  }

  // --- API ĐĂNG NHẬP GOOGLE ---
  static Future<bool> loginWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return false;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? tokenToSend = googleAuth.idToken ?? googleAuth.accessToken;

      if (tokenToSend == null) return false;

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': tokenToSend}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return await _saveUserData(response.body);
      } else {
        return false;
      }
    } catch (e) {
      print("Lỗi Google Login: $e");
      return false;
    }
  }

  // --- HÀM LƯU DỮ LIỆU (ĐÃ SỬA KEY CHO KHỚP WS) ---
  static Future<bool> _saveUserData(String responseBody) async {
    try {
      final Map<String, dynamic> data = jsonDecode(responseBody);

      // API trả về cấu trúc nào thì lấy đúng key đó
      // Nếu API trả về { "token": { "access_token": "..." } }
      final accessToken = data['token']['access_token'];

      if (accessToken == null) return false;

      Map<String, dynamic> decodedToken = JwtDecoder.decode(accessToken);
      String role = decodedToken['role_account'] ?? 'USER';

      final prefs = await SharedPreferences.getInstance();

      // ⚠️ SỬA QUAN TRỌNG: Đổi 'auth_token' thành 'access_token'
      await prefs.setString('access_token', accessToken);

      String displayName = 'Người dùng';
      if (data['full_name'] != null && data['full_name'].toString().isNotEmpty) {
        displayName = data['full_name'];
      } else if (data['email'] != null) {
        displayName = data['email'].toString().split('@')[0];
      }

      final userInfoToSave = {
        'id': data['id'],
        'full_name': displayName,
        'email': data['email'] ?? '',
        'phone': data['phone'] ?? '',
        'role': role
      };

      await prefs.setString('user_info', jsonEncode(userInfoToSave));
      _currentUser = userInfoToSave;
      return true;
    } catch (e) {
      print("Lỗi lưu user: $e");
      return false;
    }
  }

  // --- ĐĂNG XUẤT (SỬA KEY) ---
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    // ⚠️ Xóa đúng key
    await prefs.remove('access_token');
    await prefs.remove('user_info');

    await _googleSignIn.signOut();
    _currentUser = null;
  }

  // --- LẤY TOKEN (SỬA KEY) ---
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    // ⚠️ Lấy đúng key
    return prefs.getString('access_token');
  }

  static Map<String, dynamic>? getCurrentUser() {
    return _currentUser;
  }

  static Future<void> loadUserFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final userInfo = prefs.getString('user_info');

    // ⚠️ Lấy đúng key
    final token = prefs.getString('access_token');

    if (token != null && userInfo != null) {
      if (JwtDecoder.isExpired(token)) {
        await logout();
      } else {
        _currentUser = jsonDecode(userInfo);
      }
    }
  }
}
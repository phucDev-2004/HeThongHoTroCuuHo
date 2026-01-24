# 🚑 RescueVN - Hệ Thống Quản Lý Cứu Hộ Khẩn Cấp

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

Nền tảng tích hợp để quản lý và điều phối các yêu cầu cứu hộ khẩn cấp một cách hiệu quả, kết nối người gặp nạn với đội cứu hộ theo thời gian thực.

---

## 🔗 Liên Kết & Tải Xuống

| Nền tảng | Trạng thái | Link |
| :--- | :--- | :--- |
| **🌍 Live Demo** | Online | [cuuho.vpone.site](https://cuuho.vpone.site) |
| **📱 Android App** | v1.2.0 | [**Tải xuống APK**](https://github.com/phucDev-2004/HeThongHoTroCuuHo/releases) |
| **📄 API Docs** | Swagger | [Xem tài liệu API](https://cuuho.vpone.site/api/docs) |

---

## 📌 Tổng Quan

**RescueVN** bao gồm ba thành phần chính hoạt động đồng bộ:

- **📱 Mobile App (Flutter):** Ứng dụng dành cho người dân gửi yêu cầu và đội cứu hộ nhận nhiệm vụ.
- **🖥️ Web Admin (Nuxt 3):** Dashboard quản lý trung tâm dành cho điều phối viên.
- **⚙️ Backend API (Django Ninja):** Hệ thống xử lý logic

### ✨ Tính Năng Chính

- ✅ **Tiếp nhận & Xử lý tin báo:** Quản lý vòng đời yêu cầu cứu hộ từ lúc khởi tạo đến khi hoàn tất.
- ✅ **Điều phối thời gian thực:** Đồng bộ trạng thái tức thì giữa Nạn nhân - Admin - Đội cứu hộ (qua WebSocket).
- ✅ **Định vị thông minh:** Tự động lấy tọa độ GPS và chuyển đổi sang địa chỉ cụ thể.
- ✅ **Báo cáo đa phương tiện:** Gửi hình ảnh/video hiện trường để đánh giá mức độ nghiêm trọng.
- ✅ **Truy cập nhanh (OAuth):** Đăng nhập siêu tốc qua Google để giảm thời gian thao tác.
- ✅ **Bản đồ tác nghiệp số:** Trực quan hóa vị trí nạn nhân và đội cứu hộ trên bản đồ tương tác.

---

## 🏗️ Kiến Trúc

```
RescueVN/
├── backend/                    # Django + Django Ninja
│   ├── app/
│   │   ├── models/            # Database models
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── schemas/           # Validation
│   │   └── socket/            # WebSocket
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app-mobile/            # Flutter app
│   └── rescue-web/            # Nuxt 3 web admin
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer                 | Technology                                     |
| --------------------- | ---------------------------------------------- |
| **Backend**           | Django 4.2, Django Ninja, PostgreSQL + PostGIS |
| **Frontend (Web)**    | Nuxt 3, Vue 3, Element Plus, Leaflet Maps      |
| **Frontend (Mobile)** | Flutter (Dart), Provider                       |
| **Real-time**         | Django Channels, Redis, WebSocket              |
| **Auth**              | JWT, Google OAuth 2.0                          |
| **Deployment**        | Docker, Nginx                                  |

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend

cp .env.example .env

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver 0.0.0.0:8000
```

✅ **Backend**: `http://127.0.0.1:8000`  
📚 **API Docs**: `http://127.0.0.1:8000/api/docs`

### Web Admin Setup

```bash
cd frontend/rescue-web

cp .env.example .env

npm install

npm run dev
```

✅ **Frontend**: `http://localhost:3000`

### Mobile App Setup

```bash
cd frontend/app-mobile

flutter pub get

flutter run
```

---

## 📋 API Endpoints

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
GET    /api/auth/refresh
```

### Rescue Requests

```
GET    /api/requests
POST   /api/requests
GET    /api/requests/{id}
PATCH  /api/requests/{id}/status
DELETE /api/requests/{id}
```

### Teams

```
GET    /api/rescue-team
PATCH  /api/rescue-team/{id}
POST   /api/rescue-teams/assign
```

### Dashboard

```
GET    /api/dashboard/status
```

Xem đầy đủ tại: `https://cuuho.vpone.site/api/docs`

---

## 🔐 Environment Variables

### Backend (`.env`)

```env
ENV=production
DB_NAME=rescue_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

REDIS_HOST=localhost
REDIS_PORT=6379

ALLOWED_HOSTS=cuuho.vpone.site,localhost
CORS_ALLOWED_ORIGINS=https://cuuho.vpone.site,http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (`.env`)

```env
NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api
NUXT_PUBLIC_WS_BASE=ws://127.0.0.1:8000
```

---

## 🐳 Docker Deployment

```bash
docker compose build

docker compose up -d

docker compose logs -f
```

**Services**: Backend, Frontend, PostgreSQL, Redis, Nginx

---

## 📞 Support

- **Website**: https://cuuho.vpone.site
- **Issues**: [Report Bugs](https://github.com/phucDev-2004/HeThongHoTroCuuHo/issues)
- **Email**: phucvan2704@gmail.com

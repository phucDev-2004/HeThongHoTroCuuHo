# HeThongHoTroCuuHo

# 🚑 RescueVN - Hệ Thống Quản Lý Cứu Hộ Khẩn Cấp

Nền tảng tích hợp để quản lý và điều phối các yêu cầu cứu hộ khẩn cấp một cách hiệu quả.

**📱 Live Demo**: https://cuuho.vpone.site

---

## 📌 Tổng Quan

**RescueVN** bao gồm ba thành phần chính:

- **📱 Mobile App (Flutter)** - Ứng dụng di động yêu cầu cứu hộ
- **🖥️ Web Admin (Nuxt 3)** - Dashboard quản lý cho admin
- **⚙️ Backend API (Django Ninja)** - API REST + WebSocket

### ✨ Tính Năng Chính

- ✅ Quản lý yêu cầu cứu hộ
- ✅ Cập nhật real-time qua WebSocket
- ✅ Định vị GPS và địa chỉ tự động
- ✅ Gửi hình ảnh/media
- ✅ Đăng nhập Google OAuth
- ✅ Phân công đội cứu hộ
- ✅ Bản đồ tương tác hiển thị vị trí

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
GET    /api/rescue_team
PATCH  /api/rescue_team/{id}
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
CORS_ALLOWED_ORIGINS=https://cuuho.vpone.site
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

## 🧪 Testing

```bash
# Backend
cd backend && python manage.py test

# Web Frontend
cd frontend/rescue-web && npm run test

# Mobile
cd frontend/app-mobile && flutter test
```

---

## 📞 Support

- **Website**: https://cuuho.vpone.site
- **Issues**: [Report Bugs](https://github.com/phucDev-2004/HeThongHoTroCuuHo/issues)
- **Email**: phucvan2704@gmail.com

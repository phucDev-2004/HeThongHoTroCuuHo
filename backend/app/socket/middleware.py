# app/socket/middleware.py
from django.db import close_old_connections
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from urllib.parse import parse_qs
from http.cookies import SimpleCookie
import jwt
from app.models import Account

@database_sync_to_async
def get_user(token_key):
    try:
        payload = jwt.decode(
            token_key, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = payload.get("user_id")
        if not user_id:
            return AnonymousUser()

        close_old_connections() 
        return Account.objects.select_related('role').get(id=user_id) 

    except Exception as e:
        print(f"Socket Auth Error: {e}")
        return AnonymousUser()

class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        token = None
        
        # --- CÁCH 1: Lấy từ Header  ---
        if b"authorization" in headers:
            try:
                auth_header = headers[b"authorization"].decode("utf-8")
                # Logic an toàn: Tự động xóa chữ Bearer bất kể viết hoa/thường
                # Thay vì split() cứng nhắc, ta dùng replace
                token = auth_header.replace("Bearer", "").replace("bearer", "").strip()
            except ValueError:
                pass
        
        # --- CÁCH 2: Lấy từ Cookie ---
        if not token and b"cookie" in headers:
            try:
                cookie_header = headers[b"cookie"].decode("utf-8")
                cookies = SimpleCookie(cookie_header)
                if "access_token" in cookies:
                    token = cookies["access_token"].value
            except:
                pass

        # --- CÁCH 3: Lấy từ Query Params ---
        if not token:
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            
            # parse_qs trả về dict có value là list: {'token': ['xyz']}
            if "token" in query_params:
                token = query_params["token"][0]

        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
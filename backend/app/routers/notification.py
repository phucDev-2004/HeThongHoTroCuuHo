from typing import List
from ninja import Router
from ..middleware.auth import JWTBearer
from ..schemas.notification_schema import PaginatedNotificationResponse
from ..services.notification_service import NotificationService


router = Router(tags=["Notification"])

auth_bearer = JWTBearer()


@router.get("", auth= auth_bearer, response=PaginatedNotificationResponse)
def get_notifications(request, limit: int = 10, cursor: str = None):
    """
    API lấy danh sách thông báo có phân trang theo cursor.
    - limit: số lượng bản ghi (mặc định 10)
    - cursor: mốc thời gian của trang trước
    """
    
    # request.auth thường là object Account/User được trả về từ JWTBearer
    owner = request.auth 

    # Gọi static method bạn đã viết trước đó
    # Giả sử method đó nằm trong class NotificationService
    result = NotificationService.get_notifications(
        owner=owner,
        limit=limit,
        cursor=cursor
    )

    return result 
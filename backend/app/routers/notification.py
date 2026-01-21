from typing import List
from ninja import Router
from ..middleware.auth import JWTBearer
from ..schemas.notification_schema import PaginatedNotificationResponse
from ..services.notification_service import NotificationService


router = Router(tags=["Notification"])

auth_bearer = JWTBearer()

@router.patch("/read-one/{id}", auth=auth_bearer)
def mark_one_as_read(request, id: str):
    owner = request.auth
    NotificationService.mark_one_notif(owner=owner, notif_id=id)
    return{
        "success": True,
        "message": "Đã đánh dấu đọc noti",
    }

@router.patch("/read-all", auth=auth_bearer)
def mark_all_as_read(request):
    owner = request.auth
    NotificationService.mark_all_notif(owner=owner)
    return{
        "success": True,
        "message": "Đã đánh dấu đọc tất cả noti",
    }

@router.get("", auth= auth_bearer, response=PaginatedNotificationResponse)
def get_notifications(request, limit: int = 10, cursor: str = None):
    """
    API lấy danh sách thông báo có phân trang theo cursor.
    - limit: số lượng bản ghi (mặc định 10)
    - cursor: mốc thời gian của trang trước
    """
    
    owner = request.auth 

    result = NotificationService.get_notifications(
        owner=owner,
        limit=limit,
        cursor=cursor
    )

    return result 
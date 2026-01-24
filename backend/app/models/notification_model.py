import uuid
from django.db import models
from django.utils import timezone
from .account_model import Account
from .unmanaged_meta import UnmanagedMeta

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', 'Hệ thống'
        NEW_REQUEST = 'new_request', 'Yêu cầu cứu hộ mới'
        NEW_TASK = 'new_task', 'Nhiệm vụ mới'
        TASK_UPDATE = 'task_update', 'Cập nhật trạng thái'
        COMPLETE = 'complete', 'Hoàn thành'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, related_name="notifications",null=True, blank=True)

    title = models.CharField(max_length=255)
    message = models.TextField()

    type = models.CharField(
        max_length=50, 
        choices=NotificationType.choices, 
        default=NotificationType.SYSTEM
    )
    
    meta = models.JSONField(default=dict, blank=True, null=True) 
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta(UnmanagedMeta):
        db_table = 'notifications'
from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from ..models import RescueRequest
from django.utils import timezone

@receiver(post_save, sender=RescueRequest)
def broadcast_new_request(sender, instance, created, **kwargs):
    print(f"DEBUG SIGNAL: Signal đã bắt được event save của ID {instance.id}") # <--- Check 1

    if not created:
        print("DEBUG SIGNAL: Không phải tạo mới -> Bỏ qua")
        return 
    def send_realtime_notification():
        print("DEBUG SIGNAL: Bắt đầu gửi vào Group rescue_admin")
        channel_layer = get_channel_layer()

        data_payload = {
            "id": instance.id,
            "code": instance.code,
            "name": instance.name,
            "latitude": instance.latitude,
            "longitude": instance.longitude,
            "status": instance.status,
            "address": instance.address,
            "contact_phone": instance.contact_phone,
            "time": instance.created_at.isoformat() if instance.created_at else str(timezone.now()),
        }

        # Gửi vào group 'rescue_admin' (Đã đồng bộ)
        async_to_sync(channel_layer.group_send)(
            "rescue_admin", 
            {
                "type": "send_update",
                "data": {
                    "event": "NEW_REQUEST", # Khớp với switch case ở Frontend
                    "data": data_payload    # Khớp với destructuring { data }
                }
            }
        )
        print("DEBUG SIGNAL: Đã gửi lệnh group_send xong") # <--- Check 3
    transaction.on_commit(send_realtime_notification)
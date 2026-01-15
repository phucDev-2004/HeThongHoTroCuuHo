from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task(name = "broadcast_event")
def broadcast_event(target_groups: list, event_name: str, payload_data: dict):
    """
    Task này nhận danh sách group và bắn tin nhắn cho từng group.
    Task này sẽ được Celery Worker thực hiện.
    Nhiệm vụ: Nhận data -> Đẩy vào Redis Channel Layer -> Group nhận được.
    """

    channel_layer = get_channel_layer()

    message = {
        "type": "send_update",
        "data":{
            "event": event_name,
            "data": payload_data
        } 
    }

    try:
        count = 0
        for group in target_groups:
            if group:
                async_to_sync(channel_layer.group_send)(
                    group,
                    message
                )
                count += 1
        return f"Broadcasted '{event_name}' to {count} groups."
    except Exception as e:
        return f"Broadcast Error: {str(e)}"
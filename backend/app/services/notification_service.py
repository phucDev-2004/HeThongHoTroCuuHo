from django.db import transaction
from ..socket.task import broadcast_event

class NotificationService:
    @staticmethod
    def send_async(groups: list, event: str, data: dict):
        """
        Hàm chung để bắn socket qua Celery
        """
        transaction.on_commit(
            lambda: broadcast_event.delay(groups, event, data)
        )
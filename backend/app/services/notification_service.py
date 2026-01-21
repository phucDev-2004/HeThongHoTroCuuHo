from typing import List, Optional
from django.db import transaction
from ..socket.task import broadcast_event

from ..models import Notification, Account
from ..enum.role_enum import RoleCode
from ..exception import ResourceNotFound

from django.utils.dateparse import parse_datetime

class NotificationService:
    @staticmethod
    def send_async(groups: list, event: str, data: dict):
        """
        Hàm chung để bắn socket qua Celery
        """
        transaction.on_commit(
            lambda: broadcast_event.delay(groups, event, data)
        )

    @staticmethod
    def send_notify(*, groups: list[str], event: str, title: str, 
                    message: str, data: dict, account_ids: Optional[List[str]] = None
                    ):
        """
        Hàm lưu thông báo DB sau đó để bắn socket qua Celery
        QUY ƯỚC:
        - account_id = NULL  -> ADMIN notification
        - account_id != NULL -> User / Team notification
        """

        notifications = []

        # ADMIN notification (account_id = NULL)
        if "rescue_admin" in groups:
            notifications.append(
                Notification(
                    account_id=None,
                    title=title,
                    message=message,
                    type=event,
                    meta=data
                )
            )

        # USER / TEAM notification
        if account_ids:
            notifications.extend([
                Notification(
                    account_id=account_id,
                    title=title,
                    message=message,
                    type=event,
                    meta=data
                )
                for account_id in account_ids
                if account_id
            ])

        # SAVE DB (SYNC)
        if notifications:
            Notification.objects.bulk_create(notifications)

        # DELIVERY ASYNC
        transaction.on_commit(
            lambda: broadcast_event.delay(groups, event, data)
        )

    @staticmethod
    def get_notifications(*, owner: Account,  limit: int, cursor= Optional[str]):

        qs = Notification.objects.only(
            "id", "title", "message", "type",
            "meta", "is_read", "created_at"
        )
        if owner.role.code == RoleCode.ADMIN:
            qs = qs.filter(account__isnull=True)
        else:
            qs = qs.filter(account_id=owner.id)
        
        if cursor:
            qs = qs.filter(created_at__lt=parse_datetime(cursor))

        # lấy dư 1 record để biết còn data hay không
        records = list(
            qs.order_by("-created_at")[: limit + 1]
        )

        has_more = len(records) > limit
        records = records[:limit]

        last_record = records[-1] if records else None

        next_cursor = None
        if last_record:
            next_cursor = last_record.created_at.isoformat()
            
        return {
            "items": records,
            "next_cursor": next_cursor,
            "has_more": has_more,
        }
    
    @staticmethod
    def mark_all_notif(*, owner: Account):
        qs = Notification.objects.filter(is_read=False)
        if owner.role.code == RoleCode.ADMIN:
            qs = qs.filter(account__isnull=True)
        else:
            qs = qs.filter(account_id=owner.id)

        qs.update(is_read=True)
    

    @staticmethod
    def mark_one_notif(*, owner: Account, notif_id: int):
        qs = Notification.objects.filter(id=notif_id)
        if owner.role.code == RoleCode.ADMIN:
            qs = qs.filter(account__isnull=True)
        else:
            qs = qs.filter(account_id=owner.id)
        
        notif = qs.first()
        if not notif:
            raise ResourceNotFound("Không tìm thấy thông báo")

        if not notif.is_read:
            notif.is_read = True
            notif.save(update_fields=["is_read"])

        return notif
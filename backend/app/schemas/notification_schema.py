from ninja import Schema
from datetime import datetime
from typing import List, Optional, Dict
from uuid import UUID

class NotificationRespones(Schema):
    id: UUID
    title: str
    message: str
    type: str
    meta: Optional[Dict] = None
    is_read: bool
    created_at: datetime


class PaginatedNotificationResponse(Schema):
    items: List[NotificationRespones]
    next_cursor: Optional[str] = None
    has_more: bool
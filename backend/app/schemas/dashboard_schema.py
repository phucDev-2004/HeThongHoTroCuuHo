from ninja import Schema

class DashboardStatResponse(Schema):
    pending_count: int      # Sự cố đang chờ
    ready_teams_count: int  # Lực lượng sẵn sàng
    processed_today_count: int # Đã xử lý hôm nay
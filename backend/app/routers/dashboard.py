from ninja import Router
from django.utils import timezone
from django.db.models import Q
from ..schemas.dashboard_schema import DashboardStatResponse
from ..models import RescueRequest, RescueTeam 

router = Router()

@router.get("/status", response=DashboardStatResponse)
def get_dashboard_stats(request):
    # Lấy thời gian hiện tại (ngày hôm nay)
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    pending_count = RescueRequest.objects.filter(
        status='Chờ xử lý'
    ).count()

    ready_teams_count = RescueTeam.objects.filter(
        status='Sẵn sàng'
    ).count()

    processed_today_count = RescueRequest.objects.filter(
        status__in=['Hoàn thành'],
        updated_at__gte=today_start 
    ).count()

    return {
        "pending_count": pending_count,
        "ready_teams_count": ready_teams_count,
        "processed_today_count": processed_today_count
    }
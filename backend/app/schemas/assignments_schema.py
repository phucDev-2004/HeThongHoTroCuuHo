from ninja import Schema
import uuid
from typing import Optional
from datetime import datetime
from .rescue_schema import RescueRequestSchema

class AssignTaskIn(Schema):
    request_id: str
    rescue_team_id: str

class ConfirmStartIn(Schema):
    assignment_id: str
    latitude: float
    longitude: float

class CompleteTaskIn(Schema):
    assignment_id: str
    outcome_note: Optional[str] = None
    latitude: float
    longitude: float

class FindNearest(Schema):
    latitude: float
    longitude: float
    radius_km: float = 20.0

class NearestTeam(Schema):
    id: uuid.UUID
    name: str
    contact_phone: Optional[str] = None
    distance: float

class RescueTeamOut(Schema):
    team_id: uuid.UUID
    team_name: str
    leader_name: str
    team_latitude: Optional[float]
    team_longitude: Optional[float]
    team_phone: Optional[str]

class AssignmentOut(Schema):
    id: uuid.UUID
    status: str
    assigned_at: datetime
    rescue_request: RescueRequestSchema
    rescue_team: RescueTeamOut

class LocationUpdateIn(Schema):
    latitude: float
    longitude: float
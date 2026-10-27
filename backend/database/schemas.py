from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, computed_field
from library.incident_sla import calculate_deadline, is_overdue
from datetime import datetime, timezone

def utc_now() -> datetime:
    #keep clock access in one place so tests can replace it temporarily
    return datetime.now(timezone.utc)

## Pydantic is used to validade data submitted to the DB.
class IncidentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    priority: Literal["low", "medium", "high", "critical"] = "medium"

#inheritance- IncidentUpdate class inherits attributes from IncidentCreate class.
class IncidentUpdate(IncidentCreate):
    priority: Literal['low', 'medium', 'high', 'critical']
    status: Literal["open", "investigating", "resolved"]

class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    priority: Literal["low", "medium", "high", "critical"]
    status: Literal["open", "investigating", "resolved"]
    created_at: datetime
    # Return the responsible user's ID, or null when nobody is assigned.
    assignee_id: str | None

    #@property lets us access the calculation as incident.deadline.
    #@computed_field tells Pydantic to include that property in its output.
    @computed_field
    @property
    def deadline(self) -> datetime:
        #making use of our own library method to calculate the deadline
        return calculate_deadline(
            created_at=self.created_at,
            priority=self.priority
        )

    @computed_field
    @property
    def overdue(self) -> bool:
        #use a timezone-aware current time when comparing timestamps.
        now = utc_now()
        #let our library decide whether this incident is currently overdue
        return is_overdue(
            deadline=self.deadline,
            status=self.status,
            now=now
        )


class IncidentAssignemnt(BaseModel):
    assignee_id: str | None
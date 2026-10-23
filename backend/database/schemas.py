from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

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

#defines registration input and safe account output
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class UserCreate(BaseModel):
    # Reject unexpected fields, such as someone trying to submit an admin role.
    model_config = ConfigDict(extra="forbid")

    username: str = Field(
        min_length=3,
        max_length=30,
        pattern=r"^[a-z0-9_]+$"
    )
    password: str = Field(
        min_length=12,
        max_length=128,
        repr=False
    )

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    #attributes returned by the caller
    id: str
    username: str
    role: Literal["responder", "admin"]
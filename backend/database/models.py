from sqlalchemy import DateTime,String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime

#Base is the shared parent for our database models.
#SQLAlchemy uses it to collect information about their tables.
class Base(DeclarativeBase):
    pass

class Incident(Base):
    __tablename__ = "incidents"

    id:Mapped[str] = mapped_column(String(36), primary_key=True)
    title:Mapped[str] = mapped_column(String(100))
    description:Mapped[str] = mapped_column(Text)
    priority:Mapped[str] = mapped_column(String(10))
    status:Mapped[str] = mapped_column(String(20))

    #keep the incident creation time so we can calculate this incident's deadline
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

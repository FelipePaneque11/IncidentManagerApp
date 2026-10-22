from sqlalchemy import String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

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
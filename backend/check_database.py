from sqlalchemy import select
from sqlalchemy.orm import Session

from database import engine
from models import Incident

#obtains a database connection
with Session(engine) as session:
    incidents = session.scalars(select(Incident)).all()

    print(f"Incidents stored in PostgreSQL: {len(incidents)}")
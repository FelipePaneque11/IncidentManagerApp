from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Incident
from schemas import IncidentCreate, IncidentUpdate, IncidentRead

app = FastAPI(title = "Incident Manager API")


@app.get("/health")
def health_check():
    return {"status":"ok"}

#add an incident
@app.post("/incidents", status_code=201, response_model=IncidentRead)
def get_incidents(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        id=str(uuid4()),
        title=incident.title,
        description=incident.description,
        priority=incident.priority,
        status="open"
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    return new_incident

#get all incidents
@app.get("/incidents", response_model=list[IncidentRead])
def get_incidents(db: Session = Depends(get_db)):
    return db.scalars(select(Incident)).all()

#get incident by ID
@app.get("/incidents/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

#Update an incident
@app.put("/incidents/{incident_id}", response_model=IncidentRead)
def update_incident(
    incident_id:str, 
    update: IncidentUpdate,
    db: Session = Depends(get_db)
):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.title= update.title
    incident.description= update.description
    incident.priority= update.priority
    incident.status= update.status

    db.commit()
    db.refresh(incident)

    return incident

#delete an incident
@app.delete("/incidents/{incident_id}", status_code=204)
def delete_incident(
    incident_id:str,
    db: Session = Depends(get_db)
):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    db.delete(incident)
    db.commit()

    return Response(status_code=204)

    
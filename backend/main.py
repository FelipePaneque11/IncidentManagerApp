import os
from pathlib import Path

from uuid import uuid4

from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Response, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Incident, User
from database.schemas import IncidentCreate, IncidentUpdate, IncidentRead, IncidentAssignemnt

from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware

from auth.router import router as auth_router
from auth.dependencies import get_current_user

#load configuration from the project root
env_file = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_file)

app = FastAPI(title = "Incident Manager API")

#read and write signed session cookies for incoming requests
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ["SESSION_SECRET"],
    max_age=60*60*8, #remember session for 8hours
    same_site="lax",
    https_only=os.getenv("COOKIE_SECURE", "false").lower() == "true"
)

# Register the authentication endpoints with our application
app.include_router(auth_router) 


@app.get("/health")
def health_check():
    return {"status":"ok"}

#add an incident
@app.post("/incidents", status_code=201, response_model=IncidentRead, dependencies=[Depends(get_current_user)])
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
@app.get("/incidents", response_model=list[IncidentRead], dependencies=[Depends(get_current_user)])
def get_incidents(
    status: Literal["open", "investigating", "resolved"] | None = None,   # |None = None makes each filter optional.
    priority: Literal["low", "medium", "high", "critical"] | None = None,
    limit: int = Query(default=20, ge=1, le=100), #le means "less than or equal to".
    offset: int = Query(default=0, ge=0), #ge means "greater than or equal to".
    db: Session = Depends(get_db)
):
    #start by selecting incidents
    query = select(Incident)

    #add a condition only when the caller supplies this filter
    if status is not None:
        query = query.where(Incident.status == status)

    if priority is not None:
        query = query.where(Incident.priority == priority)

    #show newest incidents first. ID breaks ties between equal timestamps
    query = query.order_by(
        Incident.created_at.desc(),
        Incident.id
    )

    #apply pagination after filtering and sorting
    query = query.offset(offset).limit(limit) #skips ten matches and returns up to the next ten.

    #execute the query and return the incidents
    return db.scalars(query).all()
    
#get incident by ID
@app.get("/incidents/{incident_id}", response_model=IncidentRead, dependencies=[Depends(get_current_user)])
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

#Update an incident
@app.put("/incidents/{incident_id}", response_model=IncidentRead, dependencies=[Depends(get_current_user)])
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
@app.delete("/incidents/{incident_id}", status_code=204, dependencies=[Depends(get_current_user)])
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

#assign an incident to someone
@app.patch("/incidents/{incident_id}/assignee", response_model=IncidentRead, dependencies=[Depends(get_current_user)])
def assign_incident(incident_id:str, assignment: IncidentAssignemnt, db:Session = Depends(get_db)):
    incident = db.get(Incident, incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    #check that the selected user exists before assigning it to them
    if assignment.assignee_id is not None:
        assignee =  db.get(User, assignment.assignee_id)

        if assignee is None:
            raise HTTPException(status_code=404, detail="Assignee not found")

    #None clears the assignment. A user ID sets or replaces it
    incident.assignee_id = assignment.assignee_id

    db.commit()
    db.refresh(incident)

    return incident
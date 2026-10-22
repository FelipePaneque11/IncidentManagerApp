from fastapi import FastAPI, HTTPException
from uuid import uuid4
from schemas import IncidentCreate, IncidentUpdate

app = FastAPI(title = "Incident Manager API")

##temporary storage list
incidents = []

@app.get("/health")
def health_check():
    return {"status":"ok"}

@app.get("/incidents", status_code=200)
def get_incidents():
    return incidents


@app.post("/incidents", status_code=201)
def create_incident(incident: IncidentCreate):
    new_incident={
        ##uuid generates a unique ID for the incident
        ##str converts it to text
        "id":str(uuid4()),
        "title":incident.title,
        "description":incident.description,
        "priority":incident.priority,
        "status":"open"
    }

    incidents.append(new_incident)

    return new_incident

@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    for incident in incidents:
        if incident["id"] == incident_id:
            return incident

    raise HTTPException(
        status_code=404,
        detail= "Incident not found"
    )

@app.put("/incidents/{incident_id}")
def update_incident(incident_id:str, update: IncidentUpdate):
    for incident in incidents:
        if incident["id"] == incident_id:
            incident["title"] = update.title
            incident["description"] = update.description
            incident["priority"] = update.priority
            incident["status"] = update.status

            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )


from fastapi import FastAPI
from uuid import uuid4
from schemas import IncidentCreate

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
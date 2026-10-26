import pytest
from pydantic import ValidationError
from database.schemas import IncidentCreate, utc_now
import database.schemas as schemas
from datetime import datetime, timedelta


#1
def test_valid_incident():
    incident = IncidentCreate(
        title= " Payment API unavailable   ",
        description = "Customers cant complete their payments."
    )

    assert incident.title == "Payment API unavailable"
    assert incident.priority == "medium"

#2
def test_blank_title_is_rejected():
    with pytest.raises(ValidationError):
        IncidentCreate(
            title = "     ",
            description="Customers cant complete their payments."
        )

#3
@pytest.mark.parametrize(
        "priority",
        ["low", "medium", "high", "critical"]
)
def test_create_incident(authenticated_client, priority):
    #payload holds the data we want to submit
    payload = {
        "title":"Payment API unavailable",
        "description":"Customers cant complete their payment",
        "priority": priority
    }

    #sends the data as a JSON request body
    response = authenticated_client.post("/incidents", json=payload)

    assert response.status_code == 201

    incident = response.json()

    assert incident["title"] == payload["title"]
    assert incident["priority"] == priority
    assert incident["status"] == "open"
    assert incident["id"]

    #read the timestamp returned as json string
    created_at = datetime.fromisoformat(incident["created_at"])
    assert created_at.utcoffset() is not None
    #a newly created incident should still be within its deadline
    assert incident["overdue"] is False

#4
def test_list_incidents(authenticated_client):
      payload = {
        "title": "Database backup failed",
        "description": "The scheduled database backup did not complete.",
        "priority": "high"
    }

      create_response = authenticated_client.post("/incidents", json=payload)
      assert create_response.status_code == 201

      created_incident = create_response.json()

      response = authenticated_client.get("/incidents")

      assert response.status_code == 200
      assert created_incident in response.json()

#5
def test_get_incident_by_id(authenticated_client):
    payload = {
        "title": "Database backup failed",
        "description": "The scheduled database backup did not complete.",
        "priority": "high"
    }

    create_response = authenticated_client.post("/incidents", json=payload)
    assert create_response.status_code == 201

    created_incident = create_response.json()
    incident_id = created_incident["id"]

    response = authenticated_client.get(f"/incidents/{incident_id}")

    assert response.status_code == 200
    assert response.json() == created_incident

#6
def test_get_missing_incident(authenticated_client):
    response = authenticated_client.get("/incidents/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#7
def test_update_incident(authenticated_client):
    create_response = authenticated_client.post("/incidents", json ={
        "title": "Payment API unavailable",
        "description": "Customers cant complete their payments.",
        "priority":"high"
    })
    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    #updating our incident. 
    response = authenticated_client.put(f"/incidents/{incident_id}" , json={
        "title": "Payment outage under investigation",
        "description": "The team is investigating the payment service.",
        "priority": "critical",
        "status": "investigating"
    })

    assert response.status_code == 200

    updated = response.json()

    #checking if incident was updated correctly
    assert updated["id"] == incident_id
    assert updated["title"] == "Payment outage under investigation"
    assert updated["description"] == "The team is investigating the payment service."
    assert updated["priority"] == "critical"
    assert updated["status"] == "investigating"

    #clients.get checks if changed the stored incident, rather than merely returning different data.
    #8
    read_response = authenticated_client.get(f"/incidents/{incident_id}")
    assert read_response.status_code == 200
    assert read_response.json() == updated

#9
def test_update_missing_incident(authenticated_client):
    response = authenticated_client.put("/incidents/missing_id", json={
        "title": "Updated incident",
        "description": "This incident does not exist.",
        "priority": "low",
        "status": "investigating"
    })

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#10
def test_delete_incident(authenticated_client):
    create_response = authenticated_client.post("/incidents", json={
        "title": "Duplicate incident report",
        "description": "This incident was accidentally reported twice.",
        "priority": "low"
    })

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    response = authenticated_client.delete(f"/incidents/{incident_id}")

    assert response.status_code == 204
    assert response.content == b"" #checks if response body is empty
    #checks if incident was actually removed and returns a 404
    read_response = authenticated_client.get(f"/incidents/{incident_id}")

    assert read_response.status_code == 404
    assert read_response.json() == {"detail":"Incident not found"}

#11
def test_delete_missing_incident(authenticated_client):
    response = authenticated_client.delete("/incidents/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#12
#if a user tries to set a priority outside our list [low,medium,high,critical]
#the system will validadate and fail the request
@pytest.mark.parametrize(
    "priority",
    ["urgent", "HIGH", ""]
)
def test_invalid_priority_is_rejected(authenticated_client, priority):
    response = authenticated_client.post("/incidents", json={
        "title":"Payment API unavailable",
        "description":"Customers cant complete their payments",
        "priority":priority
    })

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "priority"]

#13
#This test is to verify if our deadline changes if we change the incident priority
#if an incident is critical with deadline of 1h, and we change it to high,
#its deadline should then be 5h
def test_incident_response_includes_sla_deadline(authenticated_client):
    response = authenticated_client.post("/incidents", json={
        "title": "Database backup failed",
        "description":"the scheduled database backup did not complete."
    })

    assert response.status_code == 201

    incident = response.json()

    #Omitting priority should select our default "medium"
    assert incident["priority"] == "medium"

    #convert json timestamp strings into python datetime object
    created_at = datetime.fromisoformat(incident["created_at"])
    deadline = datetime.fromisoformat(incident["deadline"])

    #our policde gives medium-priority incidents 24h
    assert deadline == created_at + timedelta(hours=24)

#14
def test_api_marks_incident_overdue(authenticated_client, monkeypatch):
    create_response = authenticated_client.post("/incidents", json={
        "title": "Payment API unavailable",
        "description": "Customers cannot complete their payments.",
        "priority": "high"
    })

    assert create_response.status_code == 201

    incident = create_response.json()
    incident_id = incident["id"]
    deadline = datetime.fromisoformat(incident["deadline"])

    #supply a time one minute after this incident's deadline
    def fixed_now() -> datetime:
        return deadline + timedelta(minutes=1)

    #temporarily replace the repsonse code's clock for this test
    monkeypatch.setattr(schemas, "utc_now", fixed_now)

    response = authenticated_client.get(f"/incidents/{incident_id}")

    assert response.status_code == 200
    assert response.json()["overdue"] is True

#15
@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/incidents"),
        ("POST", "/incidents"),
        ("GET", "/incidents/missing-id"),
        ("PUT", "/incidents/missing-id"),
        ("DELETE", "/incidents/missing-id")
    ]
)
def test_incident_endpoints_require_login(client,method, path):
    payload = None

    #supply valid incident data for operations that accept a request body
    if method in ("POST", "PUT"):
        payload = {
            "title": "Database backup failed",
            "description": "The scheduled backup did not complete.",
            "priority": "high"
        }

        if method == "PUT":
            payload["status"] = "investigating"

    #request() lets each test case choose its HTTP method
    response = client.request(method, path, json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Please log in"
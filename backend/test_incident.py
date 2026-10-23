import pytest
from pydantic import ValidationError
from schemas import IncidentCreate

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
def test_create_incident(client, priority):
    #payload holds the data we want to submit
    payload = {
        "title":"Payment API unavailable",
        "description":"Customers cant complete their payment",
        "priority": priority
    }

    #sends the data as a JSON request body
    response = client.post("/incidents", json=payload)

    assert response.status_code == 201

    incident = response.json()

    assert incident["title"] == payload["title"]
    assert incident["priority"] == priority
    assert incident["status"] == "open"
    assert incident["id"]

#4
def test_list_incidents(client):
      payload = {
        "title": "Database backup failed",
        "description": "The scheduled database backup did not complete.",
        "priority": "high"
    }

      create_response = client.post("/incidents", json=payload)
      assert create_response.status_code == 201

      created_incident = create_response.json()

      response = client.get("/incidents")

      assert response.status_code == 200
      assert created_incident in response.json()

#5
def test_get_incident_by_id(client):
    payload = {
        "title": "Database backup failed",
        "description": "The scheduled database backup did not complete.",
        "priority": "high"
    }

    create_response = client.post("/incidents", json=payload)
    assert create_response.status_code == 201

    created_incident = create_response.json()
    incident_id = created_incident["id"]

    response = client.get(f"/incidents/{incident_id}")

    assert response.status_code == 200
    assert response.json() == created_incident

#6
def test_get_missing_incident(client):
    response = client.get("/incidents/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#7
def test_update_incident(client):
    create_response = client.post("/incidents", json ={
        "title": "Payment API unavailable",
        "description": "Customers cant complete their payments.",
        "priority":"high"
    })
    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    #updating our incident. 
    response = client.put(f"/incidents/{incident_id}" , json={
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
    read_response = client.get(f"/incidents/{incident_id}")
    assert read_response.status_code == 200
    assert read_response.json() == updated

#9
def test_update_missing_incident(client):
    response = client.put("/incidents/missing_id", json={
        "title": "Updated incident",
        "description": "This incident does not exist.",
        "priority": "low",
        "status": "investigating"
    })

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#10
def test_delete_incident(client):
    create_response = client.post("/incidents", json={
        "title": "Duplicate incident report",
        "description": "This incident was accidentally reported twice.",
        "priority": "low"
    })

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    response = client.delete(f"/incidents/{incident_id}")

    assert response.status_code == 204
    assert response.content == b"" #checks if response body is empty
    #checks if incident was actually removed and returns a 404
    read_response = client.get(f"/incidents/{incident_id}")

    assert read_response.status_code == 404
    assert read_response.json() == {"detail":"Incident not found"}

#11
def test_delete_missing_incident(client):
    response = client.delete("/incidents/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}

#12
#if a user tries to set a priority outside our list [low,medium,high,critical]
#the system will validadate and fail the request
@pytest.mark.parametrize(
    "priority",
    ["urgent", "HIGH", ""]
)
def test_invalid_priority_is_rejected(client, priority):
    response = client.post("/incidents", json={
        "title":"Payment API unavailable",
        "description":"Customers cant complete their payments",
        "priority":priority
    })

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "priority"]
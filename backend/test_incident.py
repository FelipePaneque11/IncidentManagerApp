import pytest
from pydantic import ValidationError
from schemas import IncidentCreate
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_valid_incident():
    incident = IncidentCreate(
        title= " Payment API unavailable   ",
        description = "Customers cant complete their payments."
    )

    assert incident.title == "Payment API unavailable"
    assert incident.priority == "medium"

def test_blank_title_is_rejected():
    with pytest.raises(ValidationError):
        IncidentCreate(
            title = "     ",
            description="Customers cant complete their payments."
        )

def test_create_incident():
    #payload holds the data we want to submit
    payload = {
        "title":"Payment API unavailable",
        "description":"Customers cant complete their payment",
        "priority":"high"
    }

    #sends the data as a JSON request body
    response = client.post("/incidents", json=payload)

    assert response.status_code == 201

    incident = response.json()

    assert incident["title"] == payload["title"]
    assert incident["priority"] == "high"
    assert incident["status"] == "open"
    assert incident["id"]

def test_list_incidents():
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

def test_get_incident_by_id():
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

def test_get_missing_incident():
    response = client.get("/incidents/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail":"Incident not found"}
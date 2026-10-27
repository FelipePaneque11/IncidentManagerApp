import pytest

@pytest.fixture
def incident(authenticated_client):
    #prepare an incident for tests that need an existing record
    response = authenticated_client.post("/incidents", json={
        "title": "Payment API unavailable",
        "description": "Customers cant complete their payments.",
        "priority": "high"
    })

    assert response.status_code == 201
    return response.json()

def test_assignee_and_unassign_incident(authenticated_client, incident):
    user_response = authenticated_client.post("/auth/register", json={
        "username":"second_responder",
        "password":"ExamplePassword12!"
    })

    assert user_response.status_code == 201
    user = user_response.json()

    #the frontend must be able to find this user in its dropdown data
    user_response = authenticated_client.get("/auth/users")
    assert user_response.status_code == 200
    assert user in user_response.json()

    path = f"/incidents/{incident["id"]}/assignee"

    assign_response = authenticated_client.patch(path, json={
        "assignee_id": user["id"]
    })

    assert assign_response.status_code == 200
    assert assign_response.json()["assignee_id"] == user["id"]

    #reading again checks that the assignment was store
    read_response = authenticated_client.get(f"/incidents/{incident["id"]}")
    assert read_response.status_code == 200
    assert read_response.json()["assignee_id"] == user["id"]

    clear_response = authenticated_client.patch(path, json={
        "assignee_id": None
    })

    assert clear_response.status_code == 200
    assert clear_response.json()["assignee_id"] is None


def test_assignment_rejects_unknown_user(authenticated_client, incident):
    response = authenticated_client.patch(
        f"/incidents/{incident["id"]}/assignee", json={
            "assignee_id": "00000000-0000-0000-0000-000000000000"
        }
     )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assignee not found"

    #a rejected assignment must leave the incident unassigned
    read_response = authenticated_client.get(f"/incidents/{incident["id"]}")
    assert read_response.status_code == 200
    assert read_response.json()["assignee_id"] is None

def test_assignment_rejects_missing_incident(authenticated_client):
    response = authenticated_client.patch(
        "/incidents/missing-id/assignee",
        json={"assignee_id": None}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Incident not found"

@pytest.mark.parametrize(
    "method, path",
    [
        ("GET", "/auth/users"),
        ("PATCH", "/incidents/missing-id/assignee"),
    ]
)
def test_assignment_endpoints_require_login(client, method, path):
    response = client.request(method, path, json={"assignee_id":None})
    assert response.status_code == 401

    
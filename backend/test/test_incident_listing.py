import pytest

@pytest.fixture
def listing_incidents(authenticated_client):
    examples = [
        ("Payment service outage", "high", "open"),
        ("Database backup failed", "low", "open"),
        ("Email delivery delayed", "high", "resolved"),
    ]

    incidents = []

    for title, priority, status in examples:
        payload = {
            "title": title,
            "description": "This incident was created for listing tests.",
            "priority": priority
        }

        response = authenticated_client.post("/incidents", json=payload)
        assert response.status_code == 201

        incident = response.json()

        #New incidents start open
        if status != "open":
            payload["status"] = status

            response = authenticated_client.put(f"/incidents/{incident["id"]}", json=payload)
            assert response.status_code == 200

            incident = response.json()

        incidents.append(incident)

    return incidents

@pytest.mark.parametrize(
    "params, expected_indexes",
    [
        ({"status":"open"}, [0,1]),
        ({"priority":"high"}, [0,2]),
        ({"status":"open", "priority":"high"}, [0]),
    ]
)
def test_incident_filters(authenticated_client,listing_incidents, params, expected_indexes):
    #params adds the supllied values to the request's query string
    response = authenticated_client.get("/incidents", params=params)
    assert response.status_code == 200

    #compare IDs so this test checks membership independently of ordering
    actual_ids = set()
    for incident in response.json():
        actual_ids.add(incident["id"])

    expected_ids = set()
    for index in expected_indexes:
        expected_ids.add(listing_incidents[index]["id"])

    assert actual_ids == expected_ids

def test_incident_pagination(authenticated_client, listing_incidents):
    #fetch the complete sample in the endpoint's defined order
    all_response = authenticated_client.get("/incidents", params={"limit":100})
    assert all_response.status_code == 200

    all_incidents = all_response.json()
    assert len(all_incidents) == len(listing_incidents)

    first_response = authenticated_client.get("/incidents", params={"limit":2, "offset":0})
    second_response = authenticated_client.get("/incidents", params={"limit":2, "offset":2})

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert len(first_response.json()) == 2
    assert len(second_response.json()) == 1

    # [:2] means the first two items; [2:] means everything after them.
    assert first_response.json() == all_incidents[:2]
    assert second_response.json() == all_incidents[2:]

    #skipping beyond the available records should return an empty list
    empty_response = authenticated_client.get("/incidents", params={"limit":2, "offset":3})
    assert empty_response.status_code == 200
    assert empty_response.json() == []

@pytest.mark.parametrize(
    "params",
    [
        {"limit": 0},
        {"limit": 101},
        {"offset": -1},
        {"status": "closed"},
        {"priority": "urgent"},
    ]
)
def test_invalid_listing_parameters(authenticated_client, params):
    response = authenticated_client.get("/incidents", params=params)
    assert response.status_code == 422
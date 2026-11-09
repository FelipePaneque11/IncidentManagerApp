import json
import requests
from getpass import getpass
from pathlib import Path


def import_incidents():
    json_file = (Path(__file__).resolve().parent.parent/"sample_data"/"MOCK_DATA.json")

    with json_file.open(encoding="utf-8-sig") as file:
        #Reads the json into a list of dictionaries
        incidents = json.load(file)

    # Session remembers our login cookie between requests.
    with requests.Session() as session:
        login_response = session.post(
            "http://127.0.0.1:8000/auth/login",
            json={
                "username": input("App username: ").strip(),
                "password": getpass("App password: "),
            },
            timeout=10,
        )
        login_response.raise_for_status()

        for row in incidents:
            # Send the fields accepted by our creation endpoint.
            payload = {
                "title": row["title"],
                "description": row["description"],
                "priority": row["priority"],
            }

            response = session.post(
                "http://127.0.0.1:8000/incidents",
                json=payload,
                timeout=10,
            )
            response.raise_for_status() #stops the script if a request return an HTTP error

            # Creation defaults to open. Apply a different status if needed.
            if row["status"] != "open":
                incident_id = response.json()["id"]
                payload["status"] = row["status"]

                response = session.put(
                    f"http://127.0.0.1:8000/incidents/{incident_id}",
                    json=payload,
                    timeout=10,
                )
                response.raise_for_status()

            print("Imported:", row["title"])


if __name__ == "__main__":
    import_incidents()
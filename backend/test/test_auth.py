from auth.security import hash_password, verify_password
import pytest

def test_password_hashing():
    password = "ExamplePassword123!"
    stored_hash = hash_password(password)

    #check both sucessfull and unsuccessful password verification
    assert stored_hash != password
    assert verify_password(password, stored_hash)
    assert not verify_password("AnotherPassword123!", stored_hash)

def test_register_user(client):
    response = client.post("/auth/register", json={
        "username":"felipe",
        "password":"ExamplePassword123!"
    })

    assert response.status_code == 201

    user = response.json()

    assert user["id"]
    assert user["username"] == "felipe"
    assert user["role"] == "responder"

    #account responses should not include passwords
    assert "password" not in user
    assert "hashed_password" not in user

def test_duplicate_username_is_rejected(client):
    payload = {
        "username":"felipe",
        "password":"ExamplePassword123!"
    }

    first_response = client.post("/auth/register", json=payload)
    second_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409

def test_login_logout_flow(client):
    account = {
        "username":"session_user",
        "password":"ExamplePassword123!"
    }

    #protected account information is unavailable before login
    assert client.get("/auth/me").status_code == 401

    register_response = client.post("/auth/register", json=account)
    assert register_response.status_code == 201

    login_response = client.post("auth/login", json=account)
    assert login_response.status_code == 200

    #TestClient remembers the cookie
    me_response = client.get("auth/me")
    assert me_response.status_code == 200
    assert me_response.json() == login_response.json()

    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 204

    #Loggin out removes access to the protected endpoint
    assert client.get("/auth/me").status_code == 401

@pytest.mark.parametrize(
    "username, password",
    [
        ("session_user", "WrongUsername12!"),
        ("unknown_user", "ExamplePassword123!")
    ]
)
def test_invalid_login_is_rejected(client,username,password):
    register_response = client.post("/auth/register", json={
        "username": "session_user",
        "password": "ExamplePassword123!"
    })

    assert register_response.status_code == 201

    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"
    assert client.get("/auth/me").status_code == 401


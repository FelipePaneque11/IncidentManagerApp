from auth.security import hash_password, verify_password

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
        "password":"ExemplePassword123!"
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
        "password":"ExemplePassword123!"
    }

    first_response = client.post("/auth/register", json=payload)
    second_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409
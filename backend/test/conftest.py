import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database.connection import database_url, get_db
from main import app

# Use the same connection settings, but choose the test database.
test_database_url = database_url.set(database="incident_manager_test")
test_engine = create_engine(test_database_url)

#register client as reusable test setup
@pytest.fixture
def client():
        with test_engine.connect() as connection:
            #starts an outer transaction for this test
            transaction = connection.begin()

            try:
                with Session(
                    #make the session use this connection
                    bind=connection,
                    join_transaction_mode="create_savepoint"
                ) as session:
                    #Supplies our test session
                    def override_get_db():
                        yield session
                    #Tells FastAPI to use this function instead of the normal get_db()
                    app.dependency_overrides[get_db] = override_get_db

                    try:
                        with TestClient(app) as test_client:
                            #hands the prepared client to the test
                            yield test_client
                    finally:
                        app.dependency_overrides.pop(get_db, None)
            finally:
                #Rollback: undo the database changes after the test finishes.
                transaction.rollback()

@pytest.fixture
def authenticated_client(client):
    account = {
        "username":"incident_tester",
        "password":"TestPassword12!"
    }

    #create an account incide this test's isolated database transaction
    register_response = client.post("/auth/register", json=account)
    assert register_response.status_code == 201, register_response.text

    #the client remembers the session cookie returned by login
    login_response = client.post("/auth/login", json=account)
    assert login_response.status_code == 200, login_response.text

    #the existing client fixture already handles cleanup
    return client
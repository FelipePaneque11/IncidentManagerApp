import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database import database_url, get_db
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
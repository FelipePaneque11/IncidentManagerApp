# Backend

```text
backend/
    database/
        __init__.py
        connection.py
        models.py
        schemas.py
        check_database.py
        alembic.ini
        migrations/
    library/
    test/
        __init__.py
        conftest.py
        test_main.py
        test_incident.py
    main.py
    pytest.ini
    requirements.txt
```

`database/` holds the PostgreSQL connection, SQLAlchemy models, Pydantic validation
schemas, database check, and Alembic migrations. `library/` is empty and ready
for future library development. `test/` holds tests and their
shared fixtures. `main.py` remains the FastAPI entry point.

Run the following commands from `backend/`, with the project virtual environment
activated. Database settings still come from `IncidentManagerApp/.env`.

Start the API:

```powershell
python -m uvicorn main:app --reload
```

Run the tests (PostgreSQL must be running and the `incident_manager_test`
database must already exist with its migrations applied):

```powershell
python -m pytest
```

Check the current migration:

```powershell
python -m alembic -c database/alembic.ini current
```

`-c` selects the configuration in `database/`. Without it, Alembic looks for
`alembic.ini` in the current directory. Inside this configuration, `%(here)s`
means `backend/database/`, so `script_location = %(here)s/migrations` points
to the migration folder.

Apply database migrations:

```powershell
python -m alembic -c database/alembic.ini upgrade head
```

Apply migrations to the existing test database:

```powershell
python -m alembic -c database/alembic.ini -x database=incident_manager_test upgrade head
```

Create a migration after changing the models:

```powershell
python -m alembic -c database/alembic.ini revision --autogenerate -m "Describe the change"
```

Check the number of stored incidents:

```powershell
python -m database.check_database
```

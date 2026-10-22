from sqlalchemy import text
from database import engine

#obtains a database connection
with engine.connect() as connection:
    result = connection.execute(
        text("SELECT current_database(), current_user")
    )

    print(result.one())
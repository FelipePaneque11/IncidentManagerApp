import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine

#finds the full path of database.py | locates .env in the project root
env_file = Path(__file__).resolve().parent.parent / ".env"
#loads the settings from env file
load_dotenv(env_file)

database_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.environ["POSTGRES_USER"],
    password=os.environ["POSTGRES_PASSWORD"],
    host="127.0.0.1",
    port=5432,
    database=os.environ["POSTGRES_DB"]
)

#Creates SQLAlchemy’s connection manager
engine = create_engine(database_url)
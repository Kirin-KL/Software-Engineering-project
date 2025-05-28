from os import getenv
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

def load_env_file():
    environment = getenv("ENVIRONMENT", "development")
    if environment == "development":
        load_dotenv(".env.dev")
    else:
        load_dotenv(".env.prod")

load_env_file()

DB_HOST = getenv("DB_HOST")
DB_PORT = getenv("DB_PORT")
DB_USER = getenv("DB_USER")
DB_PASS = getenv("DB_PASS")
DB_NAME = getenv("DB_NAME")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL) # Движок - связка для взаимодействия с БД

async_session_maker = sessionmaker(engine, class_= AsyncSession, expire_on_commit=False) # Генератор сессий

Base = declarative_base()
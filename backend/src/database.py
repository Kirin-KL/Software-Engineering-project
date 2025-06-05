from os import getenv
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from contextlib import contextmanager
from typing import Generator

def load_env_file():
    environment = getenv("ENVIRONMENT", "development")
    if environment == "development":
        load_dotenv(".env.dev")
    else:
        load_dotenv(".env.prod")

load_env_file()

DB_HOST = getenv("DB_HOST", "dev-postgres")
DB_PORT = getenv("DB_PORT", "5432")
DB_USER = getenv("DB_USER", "postgres")
DB_PASS = getenv("DB_PASS", "admin")
DB_NAME = getenv("DB_NAME", "postgres")

# Асинхронный URL для SQLAlchemy 2.0
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Создаем асинхронный движок
engine = create_async_engine(DATABASE_URL)

# Создаем фабрику асинхронных сессий
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Базовый класс для моделей
Base = declarative_base()

# Синхронный URL для обратной совместимости
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Создаем синхронный движок
sync_engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

async def get_db() -> AsyncSession:
    """Получение асинхронной сессии базы данных."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

@contextmanager
def get_db_context():
    """Контекстный менеджер для работы с синхронной сессией базы данных."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
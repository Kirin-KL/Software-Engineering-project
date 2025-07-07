from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from . import models, schemas
from src.service.base import BaseService
from src.database import async_session_maker

class BookService(BaseService):
    model = models.Book

    @classmethod
    async def create(cls, book_data: schemas.BookCreate) -> models.Book:
        """Создать новую книгу."""
        async with async_session_maker() as session:
            try:
                db_book = models.Book(**book_data.model_dump())
                session.add(db_book)
                await session.commit()
                await session.refresh(db_book)
                # Загружаем связанные данные перед закрытием сессии
                await session.refresh(db_book, ['category'])
                return db_book
            except IntegrityError as e:
                await session.rollback()
                if "ix_books_isbn" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Книга с таким ISBN уже существует"
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

    @classmethod
    async def get_all(cls, skip: int = 0, limit: int = 100) -> List[models.Book]:
        """Получить список всех книг."""
        async with async_session_maker() as session:
            query = select(cls.model).options(selectinload(cls.model.category)).offset(skip).limit(limit)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def get_by_id(cls, book_id: int) -> Optional[models.Book]:
        """Получить книгу по ID."""
        async with async_session_maker() as session:
            query = select(cls.model).options(selectinload(cls.model.category)).where(cls.model.id == book_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @classmethod
    async def update(cls, book_id: int, book_data: schemas.BookUpdate) -> Optional[models.Book]:
        """Обновить информацию о книге."""
        async with async_session_maker() as session:
            db_book = await cls.get_by_id(book_id)
            if not db_book:
                return None
                
            update_data = book_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_book, field, value)
                
            if "total_copies" in update_data:
                copies_diff = update_data["total_copies"] - db_book.total_copies
                db_book.available_copies += copies_diff

            try:
                await session.commit()
                await session.refresh(db_book)
                # Загружаем связанные данные перед закрытием сессии
                await session.refresh(db_book, ['category'])
                return db_book
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

    @classmethod
    async def delete(cls, book_id: int) -> bool:
        """Удалить книгу."""
        async with async_session_maker() as session:
            db_book = await cls.get_by_id(book_id)
            if not db_book:
                return False
                
            await session.delete(db_book)
            await session.commit()
            return True

    @classmethod
    async def update_available_copies(cls, book_id: int, change: int) -> Optional[models.Book]:
        async with async_session_maker() as session:
            db_book = await cls.find_by_id(book_id)
            if not db_book:
                return None

            db_book.available_copies += change
            if db_book.available_copies < 0 or db_book.available_copies > db_book.total_copies:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid number of available copies"
                )

            await session.commit()
            await session.refresh(db_book)
            return db_book

    @classmethod
    async def update_image_url(cls, book_id: int, image_url: str) -> Optional[models.Book]:
        """Обновить URL изображения книги."""
        async with async_session_maker() as session:
            query = select(cls.model).options(selectinload(cls.model.category)).where(cls.model.id == book_id)
            result = await session.execute(query)
            db_book = result.scalar_one_or_none()
            
            if not db_book:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Книга не найдена"
                )

            try:
                db_book.image_url = image_url
                await session.commit()
                await session.refresh(db_book)
                return db_book
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

    @classmethod
    async def remove_image_url(cls, book_id: int) -> Optional[models.Book]:
        """Удалить URL изображения книги."""
        async with async_session_maker() as session:
            query = select(cls.model).options(selectinload(cls.model.category)).where(cls.model.id == book_id)
            result = await session.execute(query)
            db_book = result.scalar_one_or_none()
            
            if not db_book:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Книга не найдена"
                )

            try:
                db_book.image_url = None
                await session.commit()
                await session.refresh(db_book)
                return db_book
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                ) 
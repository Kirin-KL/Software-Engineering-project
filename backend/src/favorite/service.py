from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from src.favorite.models import Favorites
from src.books.models import Book
from src.auth.models import User
from src.favorite.schemas import FavoritesCreate, FavoritesResponse, FavoritesUpdate
from src.service.base import BaseService

class FavoritesService(BaseService):
    """Сервис для работы с избранными книгами."""
    
    model = Favorites
    
    async def add_to_favorites(self, user_id: int, book_id: int) -> FavoritesResponse:
        """Добавить книгу в избранное."""
        async with await self._get_session() as session:
            # Проверяем существование книги с загрузкой категории
            stmt = select(Book).options(
                selectinload(Book.category)
            ).where(Book.id == book_id)
            result = await session.execute(stmt)
            book = result.scalar_one_or_none()
            if not book:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Книга не найдена"
                )

            # Проверяем, не добавлена ли уже книга в избранное
            stmt = select(Favorites).where(
                and_(
                    Favorites.user_id == user_id,
                    Favorites.book_id == book_id
                )
            )
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Книга уже в избранном"
                )

            # Создаем новую запись в избранном
            favorite = Favorites(
                user_id=user_id,
                book_id=book_id
            )
            session.add(favorite)
            await session.commit()
            await session.refresh(favorite)

            # Загружаем связанные данные с книгой и её категорией
            stmt = select(Favorites).options(
                selectinload(Favorites.book).selectinload(Book.category)
            ).where(Favorites.id == favorite.id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def remove_from_favorites(self, user_id: int, book_id: int) -> bool:
        """Удалить книгу из избранного."""
        async with await self._get_session() as session:
            stmt = select(Favorites).where(
                and_(
                    Favorites.user_id == user_id,
                    Favorites.book_id == book_id
                )
            )
            result = await session.execute(stmt)
            favorite = result.scalar_one_or_none()
            
            if not favorite:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Книга не найдена в избранном"
                )
                
            await session.delete(favorite)
            await session.commit()
            return True

    async def get_user_favorites(self, user_id: int) -> List[FavoritesResponse]:
        """Получить все избранные книги пользователя."""
        async with await self._get_session() as session:
            stmt = select(Favorites).options(
                selectinload(Favorites.book).selectinload(Book.category)
            ).where(Favorites.user_id == user_id)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def is_book_favorited(self, user_id: int, book_id: int) -> bool:
        """Проверить, находится ли книга в избранном."""
        async with await self._get_session() as session:
            stmt = select(Favorites).where(
                and_(
                    Favorites.user_id == user_id,
                    Favorites.book_id == book_id
                )
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None 
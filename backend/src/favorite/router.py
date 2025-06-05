from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.favorite.service import FavoritesService
from src.favorite.schemas import FavoritesResponse, FavoritesCreate

router = APIRouter(
    tags=["favorites"]
)

@router.post("/{book_id}", response_model=FavoritesResponse)
async def add_to_favorites(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавить книгу в избранное"""
    service = FavoritesService(db)
    return await service.add_to_favorites(current_user.id, book_id)

@router.delete("/{book_id}")
async def remove_from_favorites(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить книгу из избранного"""
    service = FavoritesService(db)
    await service.remove_from_favorites(current_user.id, book_id)
    return {"message": "Книга успешно удалена из избранного"}

@router.get("/", response_model=List[FavoritesResponse])
async def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все избранные книги пользователя"""
    service = FavoritesService(db)
    return await service.get_user_favorites(current_user.id)

@router.get("/check/{book_id}")
async def check_favorite_status(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Проверить, находится ли книга в избранном"""
    service = FavoritesService(db)
    is_favorited = await service.is_book_favorited(current_user.id, book_id)
    return {"is_favorited": is_favorited} 
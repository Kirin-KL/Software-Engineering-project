from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.database import get_db
from . import schemas, service

router = APIRouter(
    tags=["reviews"]
)

@router.post("/", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: schemas.ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новый отзыв."""
    return await service.ReviewService.create(review_data, current_user.id)

@router.get("/", response_model=List[schemas.ReviewResponse])
async def get_reviews(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Получить список всех отзывов."""
    return await service.ReviewService.get_all(skip=skip, limit=limit)

@router.get("/{review_id}", response_model=schemas.ReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить отзыв по ID."""
    review = await service.ReviewService.get_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    return review

@router.put("/{review_id}", response_model=schemas.ReviewResponse)
async def update_review(
    review_id: int,
    review_data: schemas.ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить отзыв."""
    updated_review = await service.ReviewService.update(review_id, review_data, current_user.id)
    if not updated_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )
    return updated_review

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить отзыв."""
    if not await service.ReviewService.delete(review_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден"
        )

@router.get("/book/{book_id}", response_model=List[schemas.ReviewResponse])
async def get_book_reviews(
    book_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Получить отзывы на книгу."""
    return await service.ReviewService.get_book_reviews(book_id, skip=skip, limit=limit)

@router.get("/user/{user_id}", response_model=List[schemas.ReviewResponse])
async def get_user_reviews(
    user_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Получить отзывы пользователя."""
    return await service.ReviewService.get_user_reviews(user_id, skip=skip, limit=limit)

@router.post("/{review_id}/comments", response_model=schemas.ReviewCommentResponse)
async def create_comment(
    review_id: int,
    comment_data: schemas.ReviewCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать комментарий к отзыву."""
    return await service.ReviewService.create_comment(current_user.id, review_id, comment_data)

@router.put("/comments/{comment_id}", response_model=schemas.ReviewCommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: schemas.ReviewCommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить комментарий."""
    return await service.ReviewService.update_comment(comment_id, current_user.id, comment_data)

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить комментарий."""
    if not await service.ReviewService.delete_comment(comment_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Комментарий не найден"
        ) 
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.database import get_db
from . import schemas, service

router = APIRouter(
    tags=["books"]
)

@router.post("/", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book: schemas.BookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новую книгу."""
    return await service.BookService.create(book)

@router.get("/", response_model=List[schemas.BookResponse])
async def get_books(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Получить список всех книг."""
    return await service.BookService.get_all(skip=skip, limit=limit)

@router.get("/{book_id}", response_model=schemas.BookResponse)
async def get_book(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить информацию о конкретной книге."""
    book = await service.BookService.get_by_id(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return book

@router.put("/{book_id}", response_model=schemas.BookResponse)
async def update_book(
    book_id: int,
    book: schemas.BookUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить информацию о книге."""
    updated_book = await service.BookService.update(book_id, book)
    if not updated_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return updated_book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить книгу."""
    if not await service.BookService.delete(book_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )

@router.patch("/{book_id}/image", response_model=schemas.BookImageResponse)
async def update_book_image(
    book_id: int,
    image_data: schemas.BookImageUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Обновить изображение книги.
    Требуется аутентификация.
    """
    updated_book = await service.BookService.update_image_url(book_id, image_data.image_url)
    if not updated_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    return schemas.BookImageResponse(
        id=updated_book.id,
        image_url=updated_book.image_url,
        updated_at=updated_book.updated_at
    )

@router.delete("/{book_id}/image", response_model=schemas.BookImageResponse)
async def remove_book_image(
    book_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Удалить изображение книги.
    Требуется аутентификация.
    """
    updated_book = await service.BookService.remove_image_url(book_id)
    if not updated_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    return schemas.BookImageResponse(
        id=updated_book.id,
        image_url=updated_book.image_url,
        updated_at=updated_book.updated_at
    ) 
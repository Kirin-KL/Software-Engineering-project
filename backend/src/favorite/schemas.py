from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from src.books.schemas import BookResponse

class FavoritesBase(BaseModel):
    """Базовая схема для избранного."""
    book_id: int

class FavoritesCreate(FavoritesBase):
    """Схема для создания записи в избранном."""
    pass

class FavoritesUpdate(FavoritesBase):
    """Схема для обновления записи в избранном."""
    pass

class FavoritesResponse(FavoritesBase):
    """Схема для ответа с информацией об избранном."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    book: Optional[BookResponse] = None

    class Config:
        from_attributes = True 
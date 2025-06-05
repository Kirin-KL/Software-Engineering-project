from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from src.categories.schemas import CategoryResponse

class BookBase(BaseModel):
    """Базовая схема для книги."""
    title: str
    author: str
    description: Optional[str] = None
    isbn: str
    publication_year: Optional[int] = None
    category_id: Optional[int] = None
    total_copies: int = 1
    available_copies: int = 1

class BookCreate(BookBase):
    """Схема для создания книги."""
    pass

class BookUpdate(BookBase):
    """Схема для обновления книги."""
    pass

class BookResponse(BookBase):
    """Схема для ответа с информацией о книге."""
    id: int
    is_available: bool
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    average_rating: float = 0.0  # Средний рейтинг книги
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True 
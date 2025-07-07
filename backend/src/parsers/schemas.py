from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List

class BookPriceBase(BaseModel):
    """Базовая схема для цены книги."""
    platform: str
    price: float
    url: str

class BookPriceCreate(BookPriceBase):
    """Схема для создания записи о цене книги."""
    book_id: int

class BookPriceUpdate(BookPriceBase):
    """Схема для обновления записи о цене книги."""
    pass

class BookPriceResponse(BookPriceBase):
    """Схема для ответа с информацией о цене книги."""
    id: int
    book_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookPricesResponse(BaseModel):
    """Схема для ответа с информацией о ценах книги на разных площадках."""
    book_id: int
    prices: List[BookPriceResponse]
    min_price: float
    max_price: float
    average_price: float 
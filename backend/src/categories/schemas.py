from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CategoryBase(BaseModel):
    """Базовая схема для категории."""
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    """Схема для создания категории."""
    pass

class CategoryUpdate(CategoryBase):
    """Схема для обновления категории."""
    pass

class CategoryResponse(CategoryBase):
    """Схема для ответа с информацией о категории."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
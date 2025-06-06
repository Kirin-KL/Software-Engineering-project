from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class SUserBase(BaseModel):
    """Базовая схема пользователя"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class SUserCreate(SUserBase):
    """Схема для создания пользователя"""
    password: str = Field(..., min_length=6)

class SUserUpdate(BaseModel):
    """Схема для обновления пользователя"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)

class SUserAuth(BaseModel):
    """Схема для аутентификации"""
    email: EmailStr
    password: str

class SUserResponse(SUserBase):
    """Схема для ответа с данными пользователя"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
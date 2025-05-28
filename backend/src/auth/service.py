from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from os import getenv
from dotenv import load_dotenv

from src.auth.models import User
from src.service.base import BaseService
from src.database import async_session_maker

load_dotenv()
JWT_KEY = getenv("JWT_KEY")
if not JWT_KEY:
    raise RuntimeError("JWT_KEY environment variable is not set")

class UserService(BaseService):
    model = User
    
    @classmethod
    async def get_user_by_id(cls, user_id: int) -> Optional[User]:
        """
        Получение пользователя по ID.
        
        Args:
            user_id (int): ID пользователя
            
        Returns:
            Optional[User]: Объект пользователя или None, если пользователь не найден
        """
        async with async_session_maker() as session:
            query = select(cls.model).where(cls.model.id == user_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()
    
    @classmethod
    async def get_user_by_id_or_404(cls, user_id: int) -> User:
        """
        Получение пользователя по ID с проверкой на существование.
        
        Args:
            user_id (int): ID пользователя
            
        Returns:
            User: Объект пользователя
            
        Raises:
            HTTPException: Если пользователь не найден
        """
        user = await cls.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Пользователь не найден"
            )
        return user
    
    @classmethod
    async def get_user_by_email(cls, email: str) -> Optional[User]:
        """
        Получение пользователя по email.
        
        Args:
            email (str): Email пользователя
            
        Returns:
            Optional[User]: Объект пользователя или None, если пользователь не найден
        """
        async with async_session_maker() as session:
            query = select(cls.model).where(cls.model.email == email)
            result = await session.execute(query)
            return result.scalar_one_or_none()
    
    @classmethod
    async def get_user_by_email_or_404(cls, email: str) -> User:
        """
        Получение пользователя по email с проверкой на существование.
        
        Args:
            email (str): Email пользователя
            
        Returns:
            User: Объект пользователя
            
        Raises:
            HTTPException: Если пользователь не найден
        """
        user = await cls.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Пользователь не найден"
            )
        return user
    
    
    @classmethod
    async def verify_token(cls, token: str) -> User:
        """
        Проверка JWT токена и получение пользователя.
        
        Args:
            token (str): JWT токен
            
        Returns:
            User: Объект пользователя
            
        Raises:
            HTTPException: Если токен недействителен или пользователь не найден
        """
        credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # Декодируем JWT токен
            payload = jwt.decode(token, JWT_KEY, algorithms=["HS256"])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            # Преобразуем строковый ID в целое число
            user_id = int(user_id)
        except (JWTError, ValueError):
            raise credentials_exception
            
        user = await cls.get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
            
        return user
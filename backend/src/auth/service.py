from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

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
    
    async def create(self, email: str, username: str, hashed_password: str) -> User:
        """
        Создание нового пользователя.
        
        Args:
            email (str): Email пользователя
            username (str): Username пользователя
            hashed_password (str): Хешированный пароль
            
        Returns:
            User: Созданный пользователь
            
        Raises:
            HTTPException: Если пользователь с таким email или username уже существует
        """
        try:
            user = User(
                email=email,
                username=username,
                hashed_password=hashed_password
            )
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)
            return user
        except IntegrityError as e:
            await self.session.rollback()
            if "ix_users_username" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким именем пользователя уже существует"
                )
            elif "ix_users_email" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким email уже существует"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка при создании пользователя"
            )

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

    async def get_all(self) -> List[User]:
        """
        Получение списка всех пользователей.
        
        Returns:
            List[User]: Список всех пользователей
        """
        query = select(self.model)
        result = await self.session.execute(query)
        return result.scalars().all()
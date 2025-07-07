from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas
from src.service.base import BaseService
from src.database import async_session_maker

class CategoryService(BaseService):
    model = models.Category

    @classmethod
    async def create_category(cls, category: schemas.CategoryCreate) -> models.Category:
        async with async_session_maker() as session:
            try:
                db_category = models.Category(
                    name=category.name,
                    description=category.description
                )
                session.add(db_category)
                await session.commit()
                await session.refresh(db_category)
                return db_category
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )

    @classmethod
    async def get_categories(
        cls,
        skip: int = 0,
        limit: int = 100,
        name: Optional[str] = None
    ) -> List[models.Category]:
        async with async_session_maker() as session:
            query = select(cls.model)
            
            if name:
                query = query.filter(cls.model.name.ilike(f"%{name}%"))
                
            query = query.offset(skip).limit(limit)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def update_category(cls, category_id: int, category_update: schemas.CategoryUpdate) -> Optional[models.Category]:
        async with async_session_maker() as session:
            db_category = await cls.find_by_id(category_id)
            if not db_category:
                return None

            update_data = category_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_category, field, value)

            try:
                await session.commit()
                await session.refresh(db_category)
                return db_category
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )

    @classmethod
    async def delete_category(cls, category_id: int) -> bool:
        async with async_session_maker() as session:
            db_category = await cls.find_by_id(category_id)
            if not db_category:
                return False

            # Check if category has books
            if db_category.books:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete category with associated books"
                )

            await session.delete(db_category)
            await session.commit()
            return True 
from src.database import async_session_maker
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

class BaseService:
    model = None
    
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session
    
    async def _get_session(self):
        if self.session:
            return self.session
        return async_session_maker()
    
    async def find_all(self, **filter_by):
        async with await self._get_session() as session:
            query = select(self.model).filter_by(**filter_by)
            result = await session.execute(query)
            return result.scalars().all()
        
    async def find_one_or_none(self, **filter_by):
        async with await self._get_session() as session:
            query = select(self.model).filter_by(**filter_by)
            result = await session.execute(query)
            return result.scalar_one_or_none()
    
    async def find_by_id(self, id: int):
        async with await self._get_session() as session:
            query = select(self.model).filter_by(id=id)
            result = await session.execute(query)
            return result.scalar_one_or_none()
        
    async def add(self, **data):
        async with await self._get_session() as session:
            try:
                query = insert(self.model).values(**data)
                result = await session.execute(query)
                await session.commit()
                return result
            except Exception as e:
                await session.rollback()
                raise e
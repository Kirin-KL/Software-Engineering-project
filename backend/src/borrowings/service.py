from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas
from src.service.base import BaseService
from src.database import async_session_maker
from src.books.service import BookService

class BorrowingService(BaseService):
    model = models.Borrowing

    @classmethod
    async def create_borrowing(cls, user_id: int, borrowing: schemas.BorrowingCreate) -> models.Borrowing:
        async with async_session_maker() as session:
            # Check if book is available
            book = await BookService.find_by_id(borrowing.book_id)
            if not book:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Book not found"
                )
            
            if book.available_copies <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Book is not available for borrowing"
                )

            # Create borrowing record
            db_borrowing = models.Borrowing(
                user_id=user_id,
                book_id=borrowing.book_id,
                due_date=borrowing.due_date
            )

            try:
                session.add(db_borrowing)
                # Update book available copies
                await BookService.update_available_copies(borrowing.book_id, -1)
                await session.commit()
                await session.refresh(db_borrowing)
                return db_borrowing
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error creating borrowing record"
                )

    @classmethod
    async def get_user_borrowings(
        cls,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[models.BorrowingStatus] = None
    ) -> List[models.Borrowing]:
        async with async_session_maker() as session:
            query = select(cls.model).filter(cls.model.user_id == user_id)
            
            if status:
                query = query.filter(cls.model.status == status)
                
            query = query.offset(skip).limit(limit)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def get_book_borrowings(
        cls,
        book_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[models.BorrowingStatus] = None
    ) -> List[models.Borrowing]:
        async with async_session_maker() as session:
            query = select(cls.model).filter(cls.model.book_id == book_id)
            
            if status:
                query = query.filter(cls.model.status == status)
                
            query = query.offset(skip).limit(limit)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def return_book(cls, borrowing_id: int) -> Optional[models.Borrowing]:
        async with async_session_maker() as session:
            db_borrowing = await cls.find_by_id(borrowing_id)
            if not db_borrowing:
                return None

            if db_borrowing.status == models.BorrowingStatus.RETURNED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Book is already returned"
                )

            # Update borrowing record
            db_borrowing.status = models.BorrowingStatus.RETURNED
            db_borrowing.returned_at = datetime.utcnow()

            # Update book available copies
            await BookService.update_available_copies(db_borrowing.book_id, 1)

            await session.commit()
            await session.refresh(db_borrowing)
            return db_borrowing

    @classmethod
    async def check_overdue_borrowings(cls):
        """Check and update status of overdue borrowings"""
        async with async_session_maker() as session:
            current_time = datetime.utcnow()
            query = select(cls.model).filter(
                cls.model.status == models.BorrowingStatus.BORROWED,
                cls.model.due_date < current_time
            )
            result = await session.execute(query)
            overdue_borrowings = result.scalars().all()

            for borrowing in overdue_borrowings:
                borrowing.status = models.BorrowingStatus.OVERDUE

            await session.commit()
            return overdue_borrowings 
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError

from src.database import async_session_maker
from src.service.base import BaseService
from .models import Review, ReviewComment
from .schemas import ReviewCreate, ReviewUpdate, ReviewCommentCreate, ReviewCommentUpdate
from src.books.models import Book

class ReviewService(BaseService):
    model = Review

    @classmethod
    async def _update_book_rating(cls, session: AsyncSession, book_id: int):
        """Обновляет средний рейтинг книги."""
        # Получаем средний рейтинг всех отзывов книги
        stmt = select(func.avg(Review.rating)).where(Review.book_id == book_id)
        result = await session.execute(stmt)
        avg_rating = result.scalar() or 0.0

        # Обновляем средний рейтинг книги
        book = await session.get(Book, book_id)
        if book:
            book.average_rating = round(avg_rating, 1)
            await session.flush()

    @classmethod
    async def create(cls, review_data: ReviewCreate, user_id: int) -> Review:
        """Создать новый отзыв."""
        async with async_session_maker() as session:
            try:
                # Проверяем существование книги
                book = await session.get(Book, review_data.book_id)
                if not book:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Книга не найдена"
                    )

                # Проверяем, не оставил ли пользователь уже отзыв на эту книгу
                stmt = select(Review).where(
                    and_(
                        Review.user_id == user_id,
                        Review.book_id == review_data.book_id
                    )
                )
                result = await session.execute(stmt)
                if result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Вы уже оставили отзыв на эту книгу"
                    )

                db_review = Review(
                    **review_data.model_dump(),
                    user_id=user_id
                )
                session.add(db_review)
                await session.flush()

                # Обновляем средний рейтинг книги
                await cls._update_book_rating(session, review_data.book_id)

                await session.commit()
                await session.refresh(db_review)
                # Загружаем связанные данные перед закрытием сессии
                await session.refresh(db_review, ['user', 'book', 'comments'])
                return db_review
            except IntegrityError as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ошибка при создании отзыва"
                )
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

    @classmethod
    async def get_all(cls, skip: int = 0, limit: int = 100) -> List[Review]:
        """Получить список всех отзывов."""
        async with async_session_maker() as session:
            query = select(cls.model).options(
                selectinload(cls.model.user),
                selectinload(cls.model.book),
                selectinload(cls.model.comments)
            ).offset(skip).limit(limit)
            result = await session.execute(query)
            return result.scalars().all()

    @classmethod
    async def get_by_id(cls, review_id: int) -> Optional[Review]:
        """Получить отзыв по ID."""
        async with async_session_maker() as session:
            query = select(cls.model).options(
                selectinload(cls.model.user),
                selectinload(cls.model.book),
                selectinload(cls.model.comments)
            ).where(cls.model.id == review_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @classmethod
    async def update(cls, review_id: int, review_data: ReviewUpdate, user_id: int) -> Optional[Review]:
        """Обновить отзыв."""
        async with async_session_maker() as session:
            # Получаем отзыв в текущей сессии
            query = select(cls.model).options(
                selectinload(cls.model.user),
                selectinload(cls.model.book),
                selectinload(cls.model.comments)
            ).where(cls.model.id == review_id)
            result = await session.execute(query)
            db_review = result.scalar_one_or_none()
            
            if not db_review:
                return None

            if db_review.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Нет прав на редактирование этого отзыва"
                )

            update_data = review_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_review, field, value)

            try:
                await session.commit()
                await session.refresh(db_review)
                return db_review
            except Exception as e:
                await session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

    @classmethod
    async def delete(cls, review_id: int, user_id: int) -> bool:
        """Удалить отзыв."""
        async with async_session_maker() as session:
            db_review = await cls.get_by_id(review_id)
            if not db_review:
                return False

            if db_review.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Нет прав на удаление этого отзыва"
                )

            await session.delete(db_review)
            await session.commit()
            return True

    @classmethod
    async def get_book_reviews(
        cls,
        book_id: int,
        skip: int = 0,
        limit: int = 10
    ) -> List[Review]:
        async with async_session_maker() as session:
            stmt = (
                select(Review)
                .options(
                    selectinload(Review.comments).selectinload(ReviewComment.user),
                    selectinload(Review.user),
                    selectinload(Review.book)
                )
                .where(Review.book_id == book_id)
                .offset(skip)
                .limit(limit)
            )
            result = await session.execute(stmt)
            return result.scalars().all()

    @classmethod
    async def get_user_reviews(
        cls,
        user_id: int,
        skip: int = 0,
        limit: int = 10
    ) -> List[Review]:
        async with async_session_maker() as session:
            stmt = (
                select(Review)
                .options(
                    selectinload(Review.comments).selectinload(ReviewComment.user),
                    selectinload(Review.book)
                )
                .where(Review.user_id == user_id)
                .offset(skip)
                .limit(limit)
            )
            result = await session.execute(stmt)
            return result.scalars().all()

    @classmethod
    async def create_comment(
        cls,
        user_id: int,
        review_id: int,
        comment_data: ReviewCommentCreate
    ) -> ReviewComment:
        async with async_session_maker() as session:
            # Проверяем существование отзыва
            stmt = select(Review).where(Review.id == review_id)
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )

            # Создаем комментарий
            comment = ReviewComment(
                user_id=user_id,
                review_id=review_id,
                content=comment_data.content
            )
            session.add(comment)
            await session.flush()
            await session.refresh(comment)
            await session.commit()
            return comment

    @classmethod
    async def update_comment(
        cls,
        comment_id: int,
        user_id: int,
        comment_data: ReviewCommentUpdate
    ) -> Optional[ReviewComment]:
        async with async_session_maker() as session:
            # Получаем и обновляем комментарий одним запросом
            stmt = (
                select(ReviewComment)
                .where(
                    and_(
                        ReviewComment.id == comment_id,
                        ReviewComment.user_id == user_id
                    )
                )
            )
            result = await session.execute(stmt)
            comment = result.scalar_one_or_none()
            
            if not comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comment not found"
                )

            # Обновляем поля
            for field, value in comment_data.dict().items():
                setattr(comment, field, value)

            await session.flush()
            await session.refresh(comment)
            await session.commit()
            return comment

    @classmethod
    async def delete_comment(cls, comment_id: int, user_id: int) -> bool:
        async with async_session_maker() as session:
            # Удаляем комментарий одним запросом
            stmt = (
                select(ReviewComment)
                .where(
                    and_(
                        ReviewComment.id == comment_id,
                        ReviewComment.user_id == user_id
                    )
                )
            )
            result = await session.execute(stmt)
            comment = result.scalar_one_or_none()
            
            if not comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comment not found"
                )

            await session.delete(comment)
            await session.commit()
            return True 
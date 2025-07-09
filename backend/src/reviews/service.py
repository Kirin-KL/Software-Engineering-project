from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError
import aiohttp
import os

from src.database import async_session_maker
from src.service.base import BaseService
from .models import Review, ReviewComment
from .schemas import ReviewCreate, ReviewUpdate, ReviewCommentCreate, ReviewCommentUpdate
from src.books.models import Book

YANDEXGPT_API_KEY = os.environ.get("YANDEXGPT_API_KEY")
YANDEXGPT_CATALOG_ID = os.environ.get("YANDEXGPT_CATALOG_ID")

async def check_toxicity_yandexgpt(text: str) -> bool:
    """
    Проверяет текст на токсичность через YandexGPT. Возвращает True, если токсичен.
    """
    if not YANDEXGPT_API_KEY or not YANDEXGPT_CATALOG_ID:
        raise RuntimeError("YANDEXGPT_API_KEY и/или YANDEXGPT_CATALOG_ID не заданы в переменных окружения!")
    url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
    headers = {
        "Authorization": f"Api-Key {YANDEXGPT_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"Проверь этот текст на токсичность. Ответь только 'TOXIC' если он токсичен, иначе 'OK'. Текст: {text}"
    data = {
        "modelUri": f"gpt://{YANDEXGPT_CATALOG_ID}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.1, "maxTokens": 20},
        "messages": [{"role": "user", "text": prompt}]
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as resp:
            result = await resp.json()
            answer = result.get("result", {}).get("alternatives", [{}])[0].get("message", {}).get("text", "")
            return "TOXIC" in answer.upper()

async def check_text_yandexgpt(text: str, book_title: str, book_author: str = "", book_description: str = "") -> str:
    if not YANDEXGPT_API_KEY or not YANDEXGPT_CATALOG_ID:
        raise RuntimeError("YANDEXGPT_API_KEY и/или YANDEXGPT_CATALOG_ID не заданы в переменных окружения!")
    url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
    headers = {
        "Authorization": f"Api-Key {YANDEXGPT_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = (
        f"Проверь этот текст на токсичность и на соответствие теме книги. "
        f"Книга: '{book_title}', автор: {book_author}. Описание: {book_description}. "
        f"Если текст токсичен — ответь только 'TOXIC'. "
        f"Если текст не по теме книги — ответь только 'OFFTOP'. "
        f"Если всё нормально — ответь только 'OK'. "
        f"Текст: {text}"
    )
    data = {
        "modelUri": f"gpt://{YANDEXGPT_CATALOG_ID}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.1, "maxTokens": 20},
        "messages": [{"role": "user", "text": prompt}]
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as resp:
            result = await resp.json()
            answer = result.get("result", {}).get("alternatives", [{}])[0].get("message", {}).get("text", "")
            return answer.strip().upper()

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
                # Проверка токсичности и оффтопа
                book = await session.get(Book, review_data.book_id)
                if not book:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Книга не найдена"
                    )
                check_result = await check_text_yandexgpt(
                    review_data.content,
                    book.title,
                    book.author,
                    getattr(book, "description", "")
                )
                if check_result == "TOXIC":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Текст отзыва содержит токсичность. Пожалуйста, исправьте его."
                    )
                if check_result == "OFFTOP":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Текст отзыва не относится к теме книги. Пожалуйста, напишите по теме."
                    )

                # Проверяем существование книги
                # book = await session.get(Book, review_data.book_id)
                # if not book:
                #     raise HTTPException(
                #         status_code=status.HTTP_404_NOT_FOUND,
                #         detail="Книга не найдена"
                #     )

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
                    user_id=user_id,
                    is_anonymous=int(getattr(review_data, 'is_anonymous', False))
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
            # Проверка токсичности и оффтопа
            review = await session.get(Review, review_id)
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            book = await session.get(Book, review.book_id)
            check_result = await check_text_yandexgpt(
                comment_data.content,
                book.title if book else "",
                book.author if book else "",
                getattr(book, "description", "") if book else ""
            )
            if check_result == "TOXIC":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Текст комментария содержит токсичность. Пожалуйста, исправьте его."
                )
            if check_result == "OFFTOP":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Текст комментария не относится к теме книги. Пожалуйста, напишите по теме."
                )

            # Создаем комментарий
            comment = ReviewComment(
                user_id=user_id,
                review_id=review_id,
                content=comment_data.content,
                is_anonymous=int(getattr(comment_data, 'is_anonymous', False))
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
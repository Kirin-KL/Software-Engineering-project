from fastapi import APIRouter, Depends, status, Body, Path
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import BookParseRequest, BookParseResponse
from .service import parse_and_add_books, preview_books, parse_and_save_prices_for_book, parse_and_save_prices_for_all_books
from src.database import get_db
from typing import List

router = APIRouter(tags=["parsers"])

@router.post("/preview")
async def preview_books_endpoint():
    links, max_count = await preview_books()
    return {"max_count": max_count, "links": links}

@router.post("/parse", response_model=BookParseResponse, status_code=status.HTTP_201_CREATED)
async def parse_books(
    links: List[str] = Body(..., embed=True),
    count: int = Body(...),
    db: AsyncSession = Depends(get_db)
):
    books, added, skipped = await parse_and_add_books(links, db, count)
    return BookParseResponse(books=books, added=added, skipped=skipped)

@router.post("/parse-prices/{book_id}")
async def parse_prices_for_book(
    book_id: int = Path(..., description="ID книги"),
    db: AsyncSession = Depends(get_db)
):
    """
    Парсит и сохраняет цены для одной книги по её id.
    Возвращает количество добавленных цен.
    """
    added = await parse_and_save_prices_for_book(book_id, db)
    return {"added": added}

@router.post("/parse-prices-all")
async def parse_prices_for_all_books(
    db: AsyncSession = Depends(get_db)
):
    """
    Парсит и сохраняет цены для всех книг в базе данных.
    Возвращает статистику по парсингу.
    """
    result = await parse_and_save_prices_for_all_books(db)
    return result

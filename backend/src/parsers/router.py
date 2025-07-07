from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.dependencies import get_current_user
from src.auth.models import User
from . import schemas, service

router = APIRouter(
    prefix="/prices",
    tags=["prices"]
)

@router.get("/book/{book_id}", response_model=schemas.BookPricesResponse)
async def get_book_prices(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить цены на книгу со всех площадок."""
    parser_service = service.ParserService()
    try:
        return await parser_service.parse_book_prices(db, book_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при парсинге цен: {str(e)}"
        ) 
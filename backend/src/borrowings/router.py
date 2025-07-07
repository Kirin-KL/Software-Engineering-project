from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from src.auth.dependencies import get_current_user
from . import schemas, service, models

router = APIRouter(
    prefix="/borrowings",
    tags=["borrowings"]
)

@router.post("/", response_model=schemas.Borrowing)
async def create_borrowing(
    borrowing: schemas.BorrowingCreate,
    current_user = Depends(get_current_user)
):
    return await service.BorrowingService.create_borrowing(current_user.id, borrowing)

@router.get("/{borrowing_id}", response_model=schemas.Borrowing)
async def get_borrowing(
    borrowing_id: int,
    current_user = Depends(get_current_user)
):
    borrowing = await service.BorrowingService.find_by_id(borrowing_id)
    if not borrowing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrowing record not found"
        )
    return borrowing

@router.get("/user/me", response_model=List[schemas.Borrowing])
async def get_user_borrowings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[models.BorrowingStatus] = None,
    current_user = Depends(get_current_user)
):
    return await service.BorrowingService.get_user_borrowings(current_user.id, skip, limit, status)

@router.get("/book/{book_id}", response_model=List[schemas.Borrowing])
async def get_book_borrowings(
    book_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[models.BorrowingStatus] = None,
    current_user = Depends(get_current_user)
):
    return await service.BorrowingService.get_book_borrowings(book_id, skip, limit, status)

@router.post("/{borrowing_id}/return", response_model=schemas.Borrowing)
async def return_book(
    borrowing_id: int,
    current_user = Depends(get_current_user)
):
    borrowing = await service.BorrowingService.return_book(borrowing_id)
    if not borrowing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrowing record not found"
        )
    return borrowing 
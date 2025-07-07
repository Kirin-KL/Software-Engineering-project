from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import BorrowingStatus

class BorrowingBase(BaseModel):
    book_id: int
    due_date: datetime

class BorrowingCreate(BorrowingBase):
    pass

class BorrowingUpdate(BaseModel):
    status: Optional[BorrowingStatus] = None
    returned_at: Optional[datetime] = None

class Borrowing(BorrowingBase):
    id: int
    user_id: int
    borrowed_at: datetime
    returned_at: Optional[datetime]
    status: BorrowingStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 
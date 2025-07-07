from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    average_rating: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class ReviewCommentCreate(ReviewCommentBase):
    pass

class ReviewCommentUpdate(ReviewCommentBase):
    pass

class ReviewCommentInDB(ReviewCommentBase):
    id: int
    user_id: int
    review_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    rating: float = Field(..., ge=0, le=5)
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)

    @validator('rating')
    def validate_rating(cls, v):
        if not 0 <= v <= 5:
            raise ValueError('Rating must be between 0 and 5')
        return round(v, 1)  # Округляем до одного знака после запятой

class ReviewCreate(ReviewBase):
    book_id: int

class ReviewUpdate(ReviewBase):
    pass

class ReviewInDB(ReviewBase):
    id: int
    user_id: int
    book_id: int
    created_at: datetime
    updated_at: datetime
    comments: List[ReviewCommentInDB] = []

    class Config:
        from_attributes = True

class ReviewWithComments(ReviewInDB):
    comments: List[ReviewCommentInDB] = []

class ReviewCommentResponse(ReviewCommentBase):
    id: int
    user_id: int
    review_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    book_id: int
    created_at: datetime
    updated_at: datetime
    comments: List[ReviewCommentResponse] = []
    book: BookResponse

    class Config:
        from_attributes = True 
from pydantic import BaseModel
from typing import Optional, List

class BookParsed(BaseModel):
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    isbn: Optional[str] = None
    publication_year: Optional[int] = None
    url_image: Optional[str] = None

class BookParseRequest(BaseModel):
    count: Optional[int] = None  # Сколько книг парсить (None = все)

class BookParseResponse(BaseModel):
    books: List[BookParsed]
    added: int
    skipped: int

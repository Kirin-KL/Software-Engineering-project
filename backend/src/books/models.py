from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.parsers.models import BookPrice
from src.database import Base
from src.categories.models import Category


class BookStatus(str, enum.Enum):
    AVAILABLE = "available"
    BORROWED = "borrowed"
    RESERVED = "reserved"

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True, nullable=False)
    description = Column(String)
    isbn = Column(String, unique=True, index=True)
    publication_year = Column(Integer)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category_id = Column(Integer, ForeignKey("categories.id"))
    status = Column(Enum(BookStatus), default=BookStatus.AVAILABLE)
    average_rating = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    image_url = Column(String, nullable=True)

    category = relationship("Category", back_populates="books")
    borrowings = relationship("Borrowing", back_populates="book")
    favorited_by = relationship("Favorites", back_populates="book", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")
    prices = relationship("src.parsers.models.BookPrice", back_populates="book", cascade="all, delete-orphan")
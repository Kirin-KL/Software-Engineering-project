from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from src.database import Base
from src.borrowings.models import Borrowing
from src.favorite.models import Favorites
from src.books.models import Book
from src.reviews.models import Review, ReviewComment


class User(Base):
    """Модель пользователя в базе данных."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    borrowings = relationship("Borrowing", back_populates="user")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    review_comments = relationship("ReviewComment", back_populates="user", cascade="all, delete-orphan")
    books = relationship("Book", back_populates="owner")
    favorites = relationship("Favorites", back_populates="user", cascade="all, delete-orphan")
    
    
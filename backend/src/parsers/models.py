from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class BookPrice(Base):
    """Модель для хранения информации о ценах на книги."""
    
    __tablename__ = "book_prices"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False) 
    price = Column(Float, nullable=False)
    url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Уникальный индекс для предотвращения дублирования цен
    __table_args__ = (
        UniqueConstraint('book_id', 'platform', name='uq_book_platform'),
    )

    # Связи с другими моделями
    book = relationship("Book", back_populates="prices") 
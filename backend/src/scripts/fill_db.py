import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.database import SessionLocal, Base, sync_engine
from src.books.models import Book
from src.auth.models import User
from src.categories.models import Category
from src.reviews.models import Review
from src.borrowings.models import Borrowing, BorrowingStatus
from src.favorite.models import Favorites

# --- Синхронное хеширование пароля для тестовых данных ---
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash_sync(password: str) -> str:
    return pwd_context.hash(password)

# --- Создаём таблицы, если их нет ---
Base.metadata.create_all(bind=sync_engine)

# Добавить импорт Comment, если он есть
try:
    from src.reviews.models import Comment
except ImportError:
    Comment = None

def create_categories(session: Session, n=5):
    # 1. Удалить все комментарии
    if Comment is not None:
        session.query(Comment).delete()
        session.commit()
    # 2. Удалить все избранное
    session.query(Favorites).delete()
    session.commit()
    # 3. Удалить все заимствования
    session.query(Borrowing).delete()
    session.commit()
    # 4. Удалить все отзывы
    session.query(Review).delete()
    session.commit()
    # 5. Удалить все книги
    session.query(Book).delete()
    session.commit()
    # 6. Удалить все категории
    session.query(Category).delete()
    session.commit()
    # 7. (опционально) Удалить всех пользователей
    session.query(User).delete()
    session.commit()
    categories = []
    for i in range(n):
        category = Category(
            name=f"Жанр {i}",
            description=f"Описание жанра {i}"
        )
        categories.append(category)
        session.add(category)
    session.commit()
    return categories

def create_users(session: Session, n=5):
    session.query(User).delete()
    session.commit()
    users = []
    for i in range(n):
        user = User(
            email=f"user{i}@test.com",
            username=f"user{i}",
            hashed_password=get_password_hash_sync(f"password{i}"),
            is_active=True,
            is_superuser=False
        )
        users.append(user)
        session.add(user)
    session.commit()
    return users

def create_books(session: Session, categories, n=10):
    session.query(Book).delete()
    session.commit()
    books = []
    for i in range(n):
        book = Book(
            title=f"Книга {i}",
            author=f"Автор {i}",
            description=f"Описание книги {i}",
            isbn=f"978-5-00000-{i:03d}",
            publication_year=2000 + i,
            total_copies=5,
            available_copies=5,
            is_available=True,
            average_rating=round(random.uniform(3, 5), 1),
            category_id=random.choice(categories).id
        )
        books.append(book)
        session.add(book)
    session.commit()
    return books

def create_reviews(session: Session, users, books, n=15):
    session.query(Review).delete()
    session.commit()
    for _ in range(n):
        user = random.choice(users)
        book = random.choice(books)
        review = Review(
            user_id=user.id,
            book_id=book.id,
            rating=round(random.uniform(3, 5), 1),
            title=f"Отзыв на {book.title}",
            content=f"Очень интересная книга {book.title}!",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(review)
    session.commit()

def create_comments(session: Session, users):
    if Comment is None:
        print("Модель Comment не найдена, комментарии не будут созданы.")
        return
    print("Создаём комментарии...")
    session.query(Comment).delete()
    session.commit()
    reviews = session.query(Review).all()
    comment_id = 1
    for review in reviews:
        if random.random() < 0.5:
            num_comments = random.randint(1, 5)
            for i in range(num_comments):
                user = random.choice(users)
                comment = Comment(
                    content=f"Комментарий {comment_id} к отзыву {review.id}",
                    created_at=datetime.utcnow(),
                    user_id=user.id,
                    review_id=review.id,
                    updated_at=datetime.utcnow()
                )
                session.add(comment)
                comment_id += 1
    session.commit()

def create_borrowings(session: Session, users, books, n=10):
    session.query(Borrowing).delete()
    session.commit()
    for _ in range(n):
        user = random.choice(users)
        book = random.choice(books)
        borrowed_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        due_date = borrowed_at + timedelta(days=14)
        returned = random.choice([True, False])
        borrowing = Borrowing(
            user_id=user.id,
            book_id=book.id,
            borrowed_at=borrowed_at,
            due_date=due_date,
            returned_at=(due_date + timedelta(days=random.randint(1, 5))) if returned else None,
            status=BorrowingStatus.RETURNED if returned else BorrowingStatus.BORROWED,
            created_at=borrowed_at,
            updated_at=borrowed_at
        )
        session.add(borrowing)
    session.commit()

def create_favorites(session: Session, users, books, min_fav=3, max_fav=10):
    session.query(Favorites).delete()
    session.commit()
    for user in users:
        fav_books = random.sample(books, k=random.randint(min_fav, max_fav))
        for book in fav_books:
            favorite = Favorites(
                user_id=user.id,
                book_id=book.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(favorite)
    session.commit()

def main():
    with SessionLocal() as session:
        print("Создаём категории...")
        categories = create_categories(session, n=20)
        print("Создаём пользователей...")
        users = create_users(session, n=100)
        print("Создаём книги...")
        books = create_books(session, categories, n=300)
        print("Создаём отзывы...")
        create_reviews(session, users, books, n=2000)
        print("Создаём комментарии...")
        create_comments(session, users)
        print("Создаём заимствования...")
        create_borrowings(session, users, books, n=1000)
        print("Создаём избранное...")
        create_favorites(session, users, books, min_fav=3, max_fav=10)
        print("Готово! База заполнена тестовыми данными.")

if __name__ == "__main__":
    main()
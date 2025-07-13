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

# --- Списки для генерации более живых данных ---
FIRST_NAMES = ["Алексей", "Мария", "Иван", "Екатерина", "Дмитрий", "Ольга", "Сергей", "Анна", "Павел", "Елена", "Виктор", "Татьяна", "Никита", "Светлана", "Максим", "Юлия", "Артём", "Наталья", "Владимир", "Алиса"]
LAST_NAMES = ["Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Попов", "Васильев", "Новиков", "Фёдоров", "Морозов", "Волков", "Алексеев", "Лебедев", "Семенов", "Егоров", "Павлов", "Козлов", "Степанов", "Орлов", "Андреев"]
AUTHORS = ["Лев Толстой", "Фёдор Достоевский", "Александр Пушкин", "Антон Чехов", "Иван Тургенев", "Николай Гоголь", "Михаил Булгаков", "Владимир Набоков", "Борис Акунин", "Дина Рубина", "Сергей Лукьяненко", "Алексей Иванов", "Гузель Яхина", "Виктор Пелевин", "Татьяна Устинова", "Дарья Донцова", "Александр Дюма", "Джордж Оруэлл", "Джейн Остин", "Стивен Кинг"]
GENRES = ["Детектив", "Фантастика", "Роман", "Приключения", "История", "Биография", "Научпоп", "Фэнтези", "Поэзия", "Драма", "Триллер", "Юмор", "Психология", "Саморазвитие", "Бизнес", "Детская", "Классика", "Современная", "Мистика", "Путешествия", "Эзотерика"]
BOOK_TITLES = [
    "Тайна старого дома", "Звёздный путь", "Любовь и война", "Потерянный город", "Время перемен", "Сердце дракона", "Письма из прошлого", "Остров надежды", "Тени прошлого", "Пленники времени", "Золотая клетка", "Сквозь снег", "Город без памяти", "Сон разума", "Путь героя", "Вечный странник", "Забытый дневник", "Серебряный ключ", "Гроза над морем", "Танец теней"
]
REVIEW_TEMPLATES = [
    "Очень понравилась книга! Захватывающий сюжет и интересные герои.",
    "Скучновато, ожидал(а) большего. Но концовка порадовала.",
    "Прочитал(а) на одном дыхании! Рекомендую всем.",
    "Не зацепило, но язык автора красивый.",
    "Книга оставила смешанные чувства. Есть над чем подумать.",
    "Потрясающая атмосфера, хочется перечитать!",
    "Слишком затянуто, но идея интересная.",
    "Одна из лучших книг, что я читал(а) в этом году.",
    "Не понравилось. Много воды и мало действия.",
    "Очень глубокая и трогательная история."
]
COMMENT_TEMPLATES = [
    "Согласен(на) с автором отзыва!",
    "У меня другое мнение, но рецензия интересная.",
    "Спасибо за подробный отзыв!",
    "Тоже понравилась эта книга.",
    "Не согласен(на), книга отличная!",
    "Хороший разбор плюсов и минусов.",
    "Добавил(а) в список для чтения.",
    "После вашего отзыва захотелось прочитать!"
]

# --- Создаём таблицы, если их нет ---
Base.metadata.create_all(bind=sync_engine)

# Добавить импорт Comment, если он есть
try:
    from src.reviews.models import Comment
except ImportError:
    Comment = None

def random_date(start, end):
    """Генерирует случайную дату между start и end (datetime)"""
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def create_categories(session: Session, n=10):
    if Comment is not None:
        session.query(Comment).delete()
        session.commit()
    session.query(Favorites).delete()
    session.commit()
    session.query(Borrowing).delete()
    session.commit()
    session.query(Review).delete()
    session.commit()
    session.query(Book).delete()
    session.commit()
    session.query(Category).delete()
    session.commit()
    session.query(User).delete()
    session.commit()
    categories = []
    used_genres = set()
    for i in range(n):
        genre = random.choice([g for g in GENRES if g not in used_genres] or GENRES)
        used_genres.add(genre)
        category = Category(
            name=genre,
            description=f"Книги жанра {genre}"
        )
        categories.append(category)
        session.add(category)
    session.commit()
    return categories

def create_users(session: Session, n=50):
    session.query(User).delete()
    session.commit()
    users = []
    for i in range(n):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        username = f"{first.lower()}{last.lower()}{random.randint(1,99)}"
        email = f"username{i}@test.com"
        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash_sync("password123"),
            is_active=True,
            is_superuser=(i == 0)  # Первый пользователь — админ
        )
        users.append(user)
        session.add(user)
    session.commit()
    return users

def create_books(session: Session, categories, n=100):
    session.query(Book).delete()
    session.commit()
    books = []
    for i in range(n):
        title = random.choice(BOOK_TITLES) + f" {random.randint(1, 100)}"
        author = random.choice(AUTHORS)
        category = random.choice(categories)
        book = Book(
            title=title,
            author=author,
            description=f"{title} — {random.choice(['увлекательная', 'трогательная', 'захватывающая', 'необычная', 'глубокая'])} книга в жанре {category.name}.",
            isbn=f"978-5-{random.randint(10000,99999)}-{i:03d}",
            publication_year=random.randint(1950, 2023),
            total_copies=random.randint(2, 20),
            available_copies=random.randint(0, 20),
            is_available=True,
            average_rating=round(random.uniform(2, 5), 1),
            category_id=category.id
        )
        books.append(book)
        session.add(book)
    session.commit()
    return books

def create_reviews(session: Session, users, books, n=500):
    session.query(Review).delete()
    session.commit()
    now = datetime.utcnow()
    for _ in range(n):
        user = random.choice(users)
        book = random.choice(books)
        rating = round(random.uniform(1, 5), 1)
        template = random.choice(REVIEW_TEMPLATES)
        days_ago = random.randint(0, 365)
        created = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        review = Review(
            user_id=user.id,
            book_id=book.id,
            rating=rating,
            title=f"Отзыв на {book.title}",
            content=template,
            created_at=created,
            updated_at=created
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
    now = datetime.utcnow()
    comment_id = 1
    for review in reviews:
        if random.random() < 0.4:
            num_comments = random.randint(1, 4)
            for i in range(num_comments):
                user = random.choice(users)
                template = random.choice(COMMENT_TEMPLATES)
                days_ago = random.randint(0, 365)
                created = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                comment = Comment(
                    content=f"{template}",
                    created_at=created,
                    user_id=user.id,
                    review_id=review.id,
                    updated_at=created
                )
                session.add(comment)
                comment_id += 1
    session.commit()

def create_borrowings(session: Session, users, books, n=300):
    session.query(Borrowing).delete()
    session.commit()
    now = datetime.utcnow()
    for _ in range(n):
        user = random.choice(users)
        book = random.choice(books)
        borrowed_at = now - timedelta(days=random.randint(0, 365))
        due_date = borrowed_at + timedelta(days=14)
        returned = random.random() < 0.7
        borrowing = Borrowing(
            user_id=user.id,
            book_id=book.id,
            borrowed_at=borrowed_at,
            due_date=due_date,
            returned_at=(due_date + timedelta(days=random.randint(1, 10))) if returned else None,
            status=BorrowingStatus.RETURNED if returned else BorrowingStatus.BORROWED,
            created_at=borrowed_at,
            updated_at=borrowed_at
        )
        session.add(borrowing)
    session.commit()

def create_favorites(session: Session, users, books, min_fav=1, max_fav=10):
    session.query(Favorites).delete()
    session.commit()
    now = datetime.utcnow()
    for user in users:
        fav_count = random.randint(min_fav, min(max_fav, len(books)))
        fav_books = random.sample(books, k=fav_count)
        for book in fav_books:
            favorite = Favorites(
                user_id=user.id,
                book_id=book.id,
                created_at=now - timedelta(days=random.randint(0, 365)),
                updated_at=now - timedelta(days=random.randint(0, 365))
            )
            session.add(favorite)
    session.commit()

def main():
    with SessionLocal() as session:
        print("Создаём категории...")
        categories = create_categories(session, n=15)
        print("Создаём пользователей...")
        users = create_users(session, n=120)
        print("Создаём книги...")
        books = create_books(session, categories, n=350)
        print("Создаём отзывы...")
        create_reviews(session, users, books, n=2500)
        print("Создаём комментарии...")
        create_comments(session, users)
        print("Создаём заимствования...")
        create_borrowings(session, users, books, n=1200)
        print("Создаём избранное...")
        create_favorites(session, users, books, min_fav=2, max_fav=15)
        print("Готово! База заполнена живыми тестовыми данными.")

if __name__ == "__main__":
    main()
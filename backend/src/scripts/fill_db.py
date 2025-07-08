import asyncio
from src.database import async_session_maker
from src.auth.models import User
from src.books.models import Book
from src.reviews.models import Review, ReviewComment
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
import random
import hashlib

USER_DATA = [
    {"username": "alice", "email": "alice@example.com"},
    {"username": "bob", "email": "bob@example.com"},
    {"username": "carol", "email": "carol@example.com"},
    {"username": "dave", "email": "dave@example.com"},
    {"username": "eve", "email": "eve@example.com"},
]

BOOK_DATA = [
    {"title": "Война и мир", "author": "Лев Толстой", "description": "Эпопея о войне 1812 года.", "isbn": "978-5-699-12014-7", "publication_year": 1869},
    {"title": "Преступление и наказание", "author": "Фёдор Достоевский", "description": "Психологический роман.", "isbn": "978-5-389-07453-2", "publication_year": 1866},
    {"title": "Мастер и Маргарита", "author": "Михаил Булгаков", "description": "Мистика и сатира.", "isbn": "978-5-17-118366-5", "publication_year": 1967},
    {"title": "Анна Каренина", "author": "Лев Толстой", "description": "Трагедия любви.", "isbn": "978-5-389-07454-9", "publication_year": 1877},
    {"title": "Идиот", "author": "Фёдор Достоевский", "description": "Роман о добре.", "isbn": "978-5-389-07455-6", "publication_year": 1869},
    {"title": "Обломов", "author": "Иван Гончаров", "description": "Роман о лени.", "isbn": "978-5-389-07456-3", "publication_year": 1859},
    {"title": "Дубровский", "author": "Александр Пушкин", "description": "Роман о мести.", "isbn": "978-5-389-07457-0", "publication_year": 1841},
    {"title": "Евгений Онегин", "author": "Александр Пушкин", "description": "Роман в стихах.", "isbn": "978-5-389-07458-7", "publication_year": 1833},
    {"title": "Доктор Живаго", "author": "Борис Пастернак", "description": "Роман о революции.", "isbn": "978-5-389-07459-4", "publication_year": 1957},
    {"title": "Тихий Дон", "author": "Михаил Шолохов", "description": "Казачья сага.", "isbn": "978-5-389-07460-0", "publication_year": 1940},
]

REVIEW_TITLES = [
    "Отличная книга!", "Очень понравилось", "Советую всем", "Не зашло", "Глубоко и интересно",
    "Скучно", "Вдохновляет", "Сложно читать", "Шедевр", "Ожидал большего", "Просто супер",
    "Не понравилось", "Захватывает", "Потрясающе", "Рекомендую"
]
REVIEW_CONTENTS = [
    "Очень интересный сюжет и глубокие персонажи.",
    "Не смог оторваться до последней страницы!",
    "Местами было скучно, но в целом хорошо.",
    "Слишком много описаний, но идея классная.",
    "Одна из лучших книг, что я читал.",
    "Не понравился стиль автора.",
    "Заставляет задуматься о жизни.",
    "Слишком затянуто.",
    "Великолепный язык и атмосфера.",
    "Ожидал большего от концовки.",
    "Очень понравилось, советую!",
    "Не рекомендую.",
    "Понравились герои.",
    "Слишком депрессивно.",
    "Прекрасная книга для вечера."
]

COMMENT_CONTENTS = [
    "Согласен!", "Не согласен", "Спасибо за отзыв", "Тоже понравилось", "У меня другое мнение",
    "Интересно!", "Супер!", "Скучно было читать", "Полностью поддерживаю", "Автор молодец",
    "Не понял смысла", "Очень полезно", "Спасибо!", "Вдохновляет", "Слишком длинно",
    "Класс!", "Не понравилось", "Захватывает", "Потрясающе", "Рекомендую"
]

PASSWORD = "password123"

async def fill():
    async with async_session_maker() as session:
        users = []
        for u in USER_DATA:
            # Простейший hash для примера (замените на свою функцию)
            hashed = hashlib.sha256(PASSWORD.encode()).hexdigest()
            user = User(username=u["username"], email=u["email"], hashed_password=hashed)
            session.add(user)
            users.append(user)
        await session.flush()

        books = []
        for b in BOOK_DATA:
            book = Book(
                title=b["title"],
                author=b["author"],
                description=b["description"],
                isbn=b["isbn"],
                publication_year=b["publication_year"],
                total_copies=10,
                available_copies=10
            )
            session.add(book)
            books.append(book)
        await session.flush()

        reviews = []
        for i in range(15):
            user = random.choice(users)
            book = random.choice(books)
            review = Review(
                user_id=user.id,
                book_id=book.id,
                rating=random.randint(1, 5),
                title=REVIEW_TITLES[i],
                content=REVIEW_CONTENTS[i],
                is_anonymous=random.choice([0, 1])
            )
            session.add(review)
            reviews.append(review)
        await session.flush()

        for i in range(20):
            user = random.choice(users)
            review = random.choice(reviews)
            comment = ReviewComment(
                user_id=user.id,
                review_id=review.id,
                content=COMMENT_CONTENTS[i],
                is_anonymous=random.choice([0, 1])
            )
            session.add(comment)
        await session.commit()
    print("База успешно заполнена тестовыми данными!")

if __name__ == '__main__':
    asyncio.run(fill()) 
import pickle
import numpy as np
import os
from src.books.models import Book
from src.database import SessionLocal
from sqlalchemy.orm import selectinload

# Получаем абсолютный путь к файлу модели
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(current_dir, "model.pkl")

def get_recommendations_for_user(user_id: int, n: int = 5):
    # Загружаем модель и маппинги
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    model = data["model"]
    user_id_map = data["user_id_map"]
    book_id_map = data["book_id_map"]

    # Если пользователя нет в обученной модели — вернуть None
    if user_id not in user_id_map:
        return None

    user_idx = user_id_map[user_id]
    n_books = len(book_id_map)
    scores = model.predict(user_idx, np.arange(n_books))
    top_items = np.argsort(-scores)[:n]

    # Получаем book_id по индексам
    inv_book_id_map = {v: k for k, v in book_id_map.items()}
    recommended_book_ids = [inv_book_id_map[idx] for idx in top_items]

    # Получаем книги из БД
    with SessionLocal() as session:
        books = session.query(Book).options(selectinload(Book.category)).filter(Book.id.in_([int(x) for x in recommended_book_ids])).all()
    return books
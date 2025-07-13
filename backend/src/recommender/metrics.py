
import os
import pickle
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, func, text
from src.database import SQLALCHEMY_DATABASE_URL
from src.books.models import Book
from src.database import SessionLocal
from sqlalchemy.orm import selectinload

def get_recommendation_metrics():
    """
    Вычисляет метрики рекомендательной системы.
    """
    try:
        # Получаем путь к модели
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'model.pkl')
        
        # Проверяем, существует ли модель
        if not os.path.exists(model_path):
            return {
                "model_status": "Модель не найдена",
                "users_in_model": 0,
                "books_in_model": 0,
                "coverage": 0,
                "avg_recommended_rating": 0,
                "diversity": 0,
                "total_interactions": 0,
                "avg_interactions_per_user": 0
            }
        
        # Загружаем модель
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
        
        user_id_map = data['user_id_map']
        book_id_map = data['book_id_map']
        
        # Подключаемся к БД
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # 1. Статистика модели
        users_in_model = len(user_id_map)
        books_in_model = len(book_id_map)
        
        # 2. Общее количество пользователей в системе
        total_users_query = "SELECT COUNT(*) FROM users"
        total_users = pd.read_sql(total_users_query, engine).iloc[0, 0]
        
        # 3. Покрытие рекомендаций (сколько пользователей получают рекомендации)
        coverage = (users_in_model / total_users * 100) if total_users > 0 else 0
        
        # 4. Статистика взаимодействий
        interactions_query = """
        SELECT 
            COUNT(*) as total_interactions,
            COUNT(DISTINCT user_id) as active_users
        FROM (
            SELECT user_id, book_id, rating FROM reviews
            UNION ALL
            SELECT user_id, book_id, 1 as rating FROM borrowings
            UNION ALL
            SELECT user_id, book_id, 2 as rating FROM favorites
        ) combined
        """
        interactions_stats = pd.read_sql(interactions_query, engine)
        total_interactions = interactions_stats.iloc[0, 0]
        active_users = interactions_stats.iloc[0, 1]
        avg_interactions_per_user = total_interactions / active_users if active_users > 0 else 0
        
        # 5. Средний рейтинг рекомендуемых книг
        with SessionLocal() as session:
            # Получаем все книги из модели
            book_ids = [int(bid) for bid in book_id_map.keys()]
            books = session.query(Book).filter(Book.id.in_(book_ids)).all()
            
            # Вычисляем средний рейтинг
            ratings = [book.average_rating for book in books if book.average_rating is not None]
            avg_recommended_rating = np.mean(ratings) if ratings else 0
        
        # 6. Разнообразие рекомендаций (количество уникальных книг)
        diversity = len(book_id_map)
        
        # 7. Статистика по типам взаимодействий
        reviews_query = "SELECT COUNT(*) FROM reviews"
        borrowings_query = "SELECT COUNT(*) FROM borrowings"
        favorites_query = "SELECT COUNT(*) FROM favorites"
        
        reviews_count = pd.read_sql(reviews_query, engine).iloc[0, 0]
        borrowings_count = pd.read_sql(borrowings_query, engine).iloc[0, 0]
        favorites_count = pd.read_sql(favorites_query, engine).iloc[0, 0]
        
        return {
            "model_status": "Модель загружена",
            "users_in_model": int(users_in_model),
            "books_in_model": int(books_in_model),
            "total_users": int(total_users),
            "coverage": float(round(coverage, 2)),
            "avg_recommended_rating": float(round(avg_recommended_rating, 2)),
            "diversity": int(diversity),
            "total_interactions": int(total_interactions),
            "avg_interactions_per_user": float(round(avg_interactions_per_user, 2)),
            "interactions_breakdown": {
                "reviews": int(reviews_count),
                "borrowings": int(borrowings_count),
                "favorites": int(favorites_count)
            },
            "model_file_size_mb": float(round(os.path.getsize(model_path) / (1024 * 1024), 2))
        }
        
    except Exception as e:
        import traceback
        print("Ошибка при загрузке метрик:", traceback.format_exc())
        return {
            "error": str(e),
            "model_status": "Ошибка загрузки модели",
            "users_in_model": 0,
            "books_in_model": 0,
            "coverage": 0,
            "avg_recommended_rating": 0,
            "diversity": 0,
            "total_interactions": 0,
            "avg_interactions_per_user": 0
        } 
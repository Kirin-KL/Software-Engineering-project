import os
import pandas as pd
from sqlalchemy import create_engine
from lightfm import LightFM
from scipy import sparse
import pickle

# Импорт строки подключения из database.py
from src.database import SQLALCHEMY_DATABASE_URL

# --- Сбор данных ---
def fetch_interactions():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    print('Загрузка отзывов...')
    reviews = pd.read_sql('SELECT user_id, book_id, rating FROM reviews', engine)
    print(f'  Отзывов: {len(reviews)}')
    print('Загрузка заимствований...')
    borrowings = pd.read_sql('SELECT user_id, book_id FROM borrowings', engine)
    borrowings['rating'] = 1
    print(f'  Заимствований: {len(borrowings)}')
    print('Загрузка избранного...')
    try:
        favorites = pd.read_sql('SELECT user_id, book_id FROM favorites', engine)
        favorites['rating'] = 2
        print(f'  Избранного: {len(favorites)}')
        interactions = pd.concat([reviews, borrowings, favorites])
    except Exception as e:
        print(f'  Не удалось загрузить избранное: {e}')
        interactions = pd.concat([reviews, borrowings])
    # Группируем по user_id, book_id, берём максимальный рейтинг
    interactions = interactions.groupby(['user_id', 'book_id'], as_index=False)['rating'].max()
    print(f'Всего взаимодействий: {len(interactions)}')
    return interactions

def fetch_books():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    print('Загрузка информации о книгах...')
    books = pd.read_sql('SELECT id, author, category_id FROM books', engine)
    print(f'  Книг: {len(books)}')
    return books

# --- Построение матрицы взаимодействий ---
def build_interaction_matrix(interactions):
    user_ids = interactions['user_id'].unique()
    book_ids = interactions['book_id'].unique()
    user_id_map = {uid: idx for idx, uid in enumerate(user_ids)}
    book_id_map = {bid: idx for idx, bid in enumerate(book_ids)}
    rows = interactions['user_id'].map(user_id_map)
    cols = interactions['book_id'].map(book_id_map)
    data = interactions['rating']
    matrix = sparse.coo_matrix((data, (rows, cols)), shape=(len(user_ids), len(book_ids)))
    print(f'Пользователей: {len(user_ids)}, Книг: {len(book_ids)}')
    return matrix, user_id_map, book_id_map

def build_item_features(books, book_id_map):
    print('Построение content-based признаков для книг...')
    from sklearn.feature_extraction import DictVectorizer
    import numpy as np

    features = []
    book_index = []
    for _, row in books.iterrows():
        if row['id'] in book_id_map:
            features.append({
                f'author_{row["author"]}': 1,
                f'category_{row["category_id"]}': 1
            })
            book_index.append(book_id_map[row['id']])
    v = DictVectorizer()
    X = v.fit_transform(features)

    n_items = len(book_id_map)
    # Identity features
    identity = sparse.identity(n_items, format='csr')
    # Content-based features
    item_features = sparse.lil_matrix((n_items, X.shape[1]))
    for idx, row_idx in enumerate(book_index):
        item_features[row_idx] = X[idx]
    item_features = item_features.tocsr()
    # Объединяем identity и content-based признаки
    combined = sparse.hstack([identity, item_features], format='csr')
    print(f'  Признаков на книгу: {combined.shape[1]} (identity + content-based)')
    return combined

# --- Обучение модели ---
def train_and_save():
    print('Сбор данных...')
    interactions = fetch_interactions()
    if interactions.empty:
        print('Нет данных для обучения!')
        return
    books = fetch_books()
    print('Построение матрицы взаимодействий...')
    matrix, user_id_map, book_id_map = build_interaction_matrix(interactions)
    print('Построение матрицы признаков...')
    item_features = build_item_features(books, book_id_map)
    print('Обучение модели...')
    model = LightFM(loss='warp')
    model.fit(matrix, item_features=item_features, epochs=15, num_threads=2)
    print('Сохранение модели...')
    # Получаем путь к текущей директории скрипта
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({'model': model, 'user_id_map': user_id_map, 'book_id_map': book_id_map}, f)
    print(f'Готово! Модель сохранена в {model_path}')

if __name__ == '__main__':
    train_and_save() 
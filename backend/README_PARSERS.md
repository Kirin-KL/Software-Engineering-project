# Парсеры книг

Этот модуль предоставляет функциональность для парсинга книг с интернет-магазинов и сбора информации о ценах.

## Возможности

- ✅ Парсинг книг с сайта book24.ru
- ✅ Сбор информации о ценах с различных магазинов
- ✅ Проверка дубликатов по ISBN
- ✅ Автоматическое обновление цен
- ✅ Асинхронная обработка
- ✅ Обработка ошибок и логирование

## Установка зависимостей

```bash
pip install -r requirements.txt
```

## Запуск сервера

```bash
python run_server.py
```

Или с помощью uvicorn:

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Эндпоинты

### Парсинг книг
```bash
POST /api/parsers/parse-books
```

### Парсинг цен
```bash
POST /api/parsers/parse-prices
```

### Получение книги с ценами
```bash
GET /api/parsers/book/{book_id}/prices
```

### Статистика парсинга
```bash
GET /api/parsers/parse-status
```

## Тестирование

Запустите тестовый скрипт:

```bash
python test_parsers.py
```

## Структура проекта

```
backend/src/parsers/
├── __init__.py
├── models.py          # Модели базы данных
├── schemas.py         # Pydantic схемы
├── service.py         # Бизнес-логика
├── router.py          # API эндпоинты
└── ParceBookPage.py   # Функции парсинга
```

## Модели базы данных

### Book (Книга)
- `id` - Уникальный идентификатор
- `title` - Название книги
- `author` - Автор
- `description` - Описание
- `isbn` - ISBN (уникальный)
- `publication_year` - Год издания
- `image_url` - URL обложки
- `prices` - Связь с ценами (one-to-many)

### BookPrice (Цена книги)
- `id` - Уникальный идентификатор
- `book_id` - Ссылка на книгу
- `platform` - Платформа (OZON, Wildberries, etc.)
- `price` - Цена
- `url` - Ссылка на товар
- `created_at` - Дата создания
- `updated_at` - Дата обновления

## Примеры использования

### 1. Парсинг 10 книг
```python
import requests

response = requests.post(
    "http://localhost:8000/api/parsers/parse-books",
    headers={"Authorization": "Bearer <your_token>"},
    json={"limit": 10, "max_pages": 3}
)
print(response.json())
```

### 2. Парсинг цен для конкретных книг
```python
response = requests.post(
    "http://localhost:8000/api/parsers/parse-prices",
    headers={"Authorization": "Bearer <your_token>"},
    json={"book_ids": [1, 2, 3]}
)
print(response.json())
```

### 3. Получение книги с ценами
```python
response = requests.get(
    "http://localhost:8000/api/parsers/book/1/prices",
    headers={"Authorization": "Bearer <your_token>"}
)
book_data = response.json()
print(f"Книга: {book_data['title']}")
for price in book_data['prices']:
    print(f"  {price['platform']}: {price['price']} руб.")
```

## Особенности реализации

### Проверка дубликатов
Система автоматически проверяет существование книг по ISBN и не добавляет дубликаты. Если книга уже существует, система может обновить её изображение, если оно отсутствует.

### Обновление цен
При парсинге цен система:
1. Проверяет существование цены для данной книги и платформы
2. Если цена существует - обновляет её
3. Если цены нет - создает новую запись

### Обработка ошибок
Все ошибки логируются и возвращаются в ответе API. Это позволяет отслеживать проблемы при парсинге.

### Асинхронность
Все операции выполняются асинхронно для лучшей производительности.

## Конфигурация

### Переменные окружения
Создайте файл `.env.dev` с настройками:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=library
```

### GigaChat API
Для работы с ценами используется GigaChat API. Убедитесь, что у вас есть токен доступа.

## Мониторинг

Используйте эндпоинт `/api/parsers/parse-status` для получения статистики:

```python
response = requests.get(
    "http://localhost:8000/api/parsers/parse-status",
    headers={"Authorization": "Bearer <your_token>"}
)
stats = response.json()
print(f"Всего книг: {stats['total_books']}")
print(f"Книг с ценами: {stats['books_with_prices']}")
print(f"Всего цен: {stats['total_prices']}")
```

## Troubleshooting

### Ошибка подключения к базе данных
Убедитесь, что PostgreSQL запущен и доступен по указанным настройкам.

### Ошибки парсинга
Проверьте:
1. Доступность сайтов для парсинга
2. Корректность токена GigaChat
3. Наличие необходимых зависимостей

### Проблемы с аутентификацией
Убедитесь, что передаете корректный Bearer токен в заголовке Authorization.

## Разработка

### Добавление новых источников парсинга
1. Создайте новую функцию в `ParceBookPage.py`
2. Добавьте её в `service.py`
3. Обновите документацию

### Изменение схем данных
1. Обновите модели в `models.py`
2. Создайте миграцию Alembic
3. Обновите схемы в `schemas.py` 
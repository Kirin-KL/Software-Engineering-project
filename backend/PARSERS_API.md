# API Парсеров

Этот модуль предоставляет API для парсинга книг с интернет-магазинов и сбора информации о ценах.

## Эндпоинты

### 1. Парсинг книг

**POST** `/api/parsers/parse-books`

Парсит книги с сайта book24.ru и добавляет их в базу данных.

**Параметры запроса:**
```json
{
  "limit": 10,        // Количество книг для парсинга (по умолчанию 10)
  "max_pages": 5      // Максимальное количество страниц (по умолчанию 5)
}
```

**Ответ:**
```json
{
  "message": "Парсинг книг завершен",
  "books_parsed": 5,      // Количество обработанных книг
  "books_added": 3,       // Количество добавленных книг
  "prices_parsed": 0,     // Количество обработанных цен
  "prices_added": 0,      // Количество добавленных цен
  "errors": []            // Список ошибок
}
```

### 2. Парсинг цен

**POST** `/api/parsers/parse-prices`

Парсит цены для книг. Можно указать конкретные книги или ISBN.

**Параметры запроса:**
```json
{
  "book_ids": [1, 2, 3],  // Список ID книг для парсинга цен
  "isbn": "978-5-17-123456-7",  // ISBN конкретной книги
  "limit": 10              // Количество книг для парсинга цен
}
```

**Ответ:**
```json
{
  "message": "Парсинг цен для нескольких книг завершен",
  "books_parsed": 0,
  "books_added": 0,
  "prices_parsed": 15,     // Количество обработанных цен
  "prices_added": 12,      // Количество добавленных цен
  "errors": []
}
```

### 3. Парсинг цен для конкретной книги

**POST** `/api/parsers/parse-prices/{book_id}`

Парсит цены для конкретной книги по её ID.

**Ответ:**
```json
{
  "message": "Парсинг цен для книги 'Название книги' завершен",
  "books_parsed": 0,
  "books_added": 0,
  "prices_parsed": 5,
  "prices_added": 5,
  "errors": []
}
```

### 4. Получение книги с ценами

**GET** `/api/parsers/book/{book_id}/prices`

Получает информацию о книге вместе с её ценами.

**Ответ:**
```json
{
  "id": 1,
  "title": "Название книги",
  "author": "Автор",
  "description": "Описание книги",
  "isbn": "978-5-17-123456-7",
  "publication_year": 2023,
  "is_available": true,
  "created_at": "2023-12-01T10:00:00",
  "updated_at": "2023-12-01T10:00:00",
  "average_rating": 4.5,
  "category": {
    "id": 1,
    "name": "Художественная литература"
  },
  "prices": [
    {
      "id": 1,
      "platform": "OZON",
      "price": 599.0,
      "url": "https://www.ozon.ru/product/...",
      "book_id": 1,
      "created_at": "2023-12-01T10:00:00",
      "updated_at": "2023-12-01T10:00:00"
    },
    {
      "id": 2,
      "platform": "Wildberries",
      "price": 650.0,
      "url": "https://www.wildberries.ru/...",
      "book_id": 1,
      "created_at": "2023-12-01T10:00:00",
      "updated_at": "2023-12-01T10:00:00"
    }
  ]
}
```

### 5. Получение только цен для книги

**GET** `/api/parsers/book/{book_id}/prices-only`

Получает только список цен для книги.

**Ответ:**
```json
[
  {
    "id": 1,
    "platform": "OZON",
    "price": 599.0,
    "url": "https://www.ozon.ru/product/...",
    "book_id": 1,
    "created_at": "2023-12-01T10:00:00",
    "updated_at": "2023-12-01T10:00:00"
  }
]
```

### 6. Статистика парсинга

**GET** `/api/parsers/parse-status`

Получает статистику по парсингу.

**Ответ:**
```json
{
  "total_books": 150,
  "books_with_prices": 120,
  "total_prices": 450,
  "books_without_prices": 30
}
```

## Аутентификация

Все эндпоинты требуют аутентификации. Используйте Bearer токен в заголовке Authorization:

```
Authorization: Bearer <your_jwt_token>
```

## Примеры использования

### Парсинг 20 книг
```bash
curl -X POST "http://localhost:8000/api/parsers/parse-books" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "max_pages": 3}'
```

### Парсинг цен для конкретных книг
```bash
curl -X POST "http://localhost:8000/api/parsers/parse-prices" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"book_ids": [1, 2, 3]}'
```

### Парсинг цен по ISBN
```bash
curl -X POST "http://localhost:8000/api/parsers/parse-prices" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isbn": "978-5-17-123456-7"}'
```

### Получение книги с ценами
```bash
curl -X GET "http://localhost:8000/api/parsers/book/1/prices" \
  -H "Authorization: Bearer <token>"
```

## Особенности

1. **Проверка дубликатов**: Система автоматически проверяет существование книг по ISBN и не добавляет дубликаты.

2. **Обновление цен**: При парсинге цен система обновляет существующие записи или создает новые.

3. **Обработка ошибок**: Все ошибки логируются и возвращаются в ответе.

4. **Асинхронность**: Все операции выполняются асинхронно для лучшей производительности.

## Зависимости

Для работы парсеров требуются следующие библиотеки:
- `requests` - для HTTP запросов
- `beautifulsoup4` - для парсинга HTML
- `gigachat` - для извлечения информации о ценах с помощью AI

## Тестирование

Для тестирования парсеров используйте скрипт `test_parsers.py`:

```bash
cd backend
python test_parsers.py
``` 
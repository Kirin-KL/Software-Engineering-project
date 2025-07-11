#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы парсеров.
"""

import asyncio
import sys
import os

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.parsers.service import ParserService
from src.parsers.schemas import ParseBooksRequest, ParsePricesRequest

async def test_parse_books():
    """Тестирует парсинг книг."""
    print("=== Тест парсинга книг ===")
    
    try:
        result = await ParserService.parse_books(limit=5, max_pages=2)
        print(f"Результат: {result}")
        return result
    except Exception as e:
        print(f"Ошибка при парсинге книг: {e}")
        return None

async def test_parse_prices():
    """Тестирует парсинг цен."""
    print("\n=== Тест парсинга цен ===")
    
    try:
        # Получаем список книг из базы данных
        from src.books.service import BookService
        books = await BookService.get_all(limit=3)
        
        if not books:
            print("Нет книг в базе данных для тестирования парсинга цен")
            return None
        
        book_ids = [book.id for book in books]
        print(f"Тестируем парсинг цен для книг: {book_ids}")
        
        result = await ParserService.parse_prices_for_multiple_books(book_ids)
        print(f"Результат: {result}")
        return result
    except Exception as e:
        print(f"Ошибка при парсинге цен: {e}")
        return None

async def test_get_book_with_prices():
    """Тестирует получение книги с ценами."""
    print("\n=== Тест получения книги с ценами ===")
    
    try:
        # Получаем первую книгу из базы данных
        from src.books.service import BookService
        books = await BookService.get_all(limit=1)
        
        if not books:
            print("Нет книг в базе данных для тестирования")
            return None
        
        book_id = books[0].id
        print(f"Получаем книгу с ID: {book_id}")
        
        result = await ParserService.get_book_with_prices(book_id)
        if result:
            print(f"Книга: {result.title}")
            print(f"Количество цен: {len(result.prices)}")
            for price in result.prices:
                print(f"  - {price.platform}: {price.price} руб.")
        else:
            print("Книга не найдена")
        
        return result
    except Exception as e:
        print(f"Ошибка при получении книги с ценами: {e}")
        return None

async def main():
    """Основная функция тестирования."""
    print("Запуск тестов парсеров...")
    
    # Тест парсинга книг
    await test_parse_books()
    
    # Тест парсинга цен
    await test_parse_prices()
    
    # Тест получения книги с ценами
    await test_get_book_with_prices()
    
    print("\nТестирование завершено!")

if __name__ == "__main__":
    asyncio.run(main()) 
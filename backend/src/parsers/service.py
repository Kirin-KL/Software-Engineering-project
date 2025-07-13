from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import BookParsed
from src.books.models import Book
from .ParceBookPage import parsing_book24_bestseller, get_html_book24_page, get_links_to_the_book, extract_book_info_from_html_Giga
from src.parsers.models import BookPrice
from sqlalchemy.exc import IntegrityError
import json
from datetime import datetime

async def book_exists(isbn: str, db: AsyncSession) -> bool:
    if not isbn:
        return False
    result = await db.execute(select(Book).where(Book.isbn == isbn))
    return result.scalar_one_or_none() is not None

async def preview_books() -> Tuple[List[str], int]:
    """
    Возвращает список уникальных ссылок на книги и их максимальное количество.
    """
    links = parsing_book24_bestseller()
    unique_links = []
    seen = set()
    for title, url in links:
        if url not in seen:
            unique_links.append(url)
            seen.add(url)
    return unique_links, len(unique_links)

async def parse_and_add_books(links: List[str], db: AsyncSession, count: int) -> Tuple[List[BookParsed], int, int]:
    """
    Добавляет первые n уникальных книг из переданных ссылок в БД.
    """
    books: List[BookParsed] = []
    added = 0
    skipped = 0
    for url in links:
        if added >= count:
            break
        book_data = get_html_book24_page(url)
        isbn = book_data.get("isbn")
        if not isbn or await book_exists(isbn, db):
            skipped += 1
            continue
        new_book = Book(
            title=book_data.get("title"),
            author=book_data.get("author"),
            description=book_data.get("description"),
            isbn=isbn,
            publication_year=book_data.get("publication_year"),
            image_url=book_data.get("url_image"),
        )
        db.add(new_book)
        await db.commit()
        await db.refresh(new_book)
        books.append(BookParsed(**book_data))
        added += 1
    return books, added, skipped

async def parse_and_save_prices_for_book(book_id: int, db: AsyncSession) -> int:
    """
    Парсит цены для книги по её id (использует isbn) и сохраняет их в таблицу book_prices.
    Если цены уже существуют для данной платформы, они обновляются.
    Возвращает количество добавленных/обновленных цен.
    """
    print(f"Начинаем парсинг цен для книги ID: {book_id}")
    
    # Получаем книгу
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        print(f"Книга с ID {book_id} не найдена")
        return 0
        
    if not book.isbn:
        print(f"У книги с ID {book_id} нет ISBN")
        return 0
    
    print(f"Найдена книга: {book.title}, ISBN: '{book.isbn}'")

    # Получаем HTML с ценами через get_links_to_the_book
    print(f"Вызываем get_links_to_the_book с ISBN: '{book.isbn}'")
    html = get_links_to_the_book(book.isbn)
    
    print(f"Получен HTML длиной: {len(html) if html else 0}")
    
    # Проверяем, что HTML не пустой
    if not html:
        print(f"Не удалось получить HTML для парсинга цен книги {book_id} (ISBN: {book.isbn})")
        return 0
    
    # Извлекаем информацию о ценах через extract_book_info_from_html_Giga
    try:
        print("Вызываем extract_book_info_from_html_Giga...")
        prices_json = extract_book_info_from_html_Giga(html)
        print(f"Получен JSON от GigaChat: {prices_json}")
        
        prices_data = json.loads(prices_json)
        print(f"Распарсенный JSON: {prices_data}")
        
        # Обрабатываем структуру данных от GigaChat
        if isinstance(prices_data, list):
            # Если это уже массив объектов, оставляем как есть
            print(f"Получен массив объектов: {prices_data}")
        elif isinstance(prices_data, dict) and 'market' in prices_data:
            # Если есть ключ 'market' с массивом, берем его содержимое
            if isinstance(prices_data['market'], list):
                prices_data = prices_data['market']
                print(f"Извлечен массив market: {prices_data}")
            else:
                prices_data = [prices_data]
        elif isinstance(prices_data, dict):
            # Если это один объект, оборачиваем в список
            prices_data = [prices_data]
            print(f"Преобразовано в список: {prices_data}")
    except Exception as e:
        print(f"Ошибка при парсинге цен для книги {book_id}: {e}")
        return 0

    added = 0
    updated = 0
    print(f"Обрабатываем {len(prices_data)} записей о ценах...")
    
    for i, price_info in enumerate(prices_data):
        print(f"Обрабатываем запись {i+1}: {price_info}")
        try:
            # Обрабатываем цену (убираем " р." и конвертируем в число)
            price_str = price_info.get('price', '0')
            if isinstance(price_str, str):
                price_str = price_str.replace(' р.', '').replace(' ', '').replace(',', '.')
            try:
                price = float(price_str)
            except ValueError:
                print(f"Не удалось конвертировать цену '{price_str}' в число")
                continue
            
            platform = price_info.get('market', 'unknown')
            url = price_info.get('book_url', '')
            
            # Обрабатываем URL (если это редирект, извлекаем реальный URL)
            if url.startswith('/redir/book?url='):
                import urllib.parse
                try:
                    # Декодируем URL из параметра
                    encoded_url = url.replace('/redir/book?url=', '')
                    decoded_url = urllib.parse.unquote(encoded_url)
                    # Извлекаем реальный URL из параметра ulp
                    if 'ulp=' in decoded_url:
                        ulp_start = decoded_url.find('ulp=') + 4
                        ulp_end = decoded_url.find('&', ulp_start)
                        if ulp_end == -1:
                            ulp_end = len(decoded_url)
                        real_url = urllib.parse.unquote(decoded_url[ulp_start:ulp_end])
                        url = real_url
                except Exception as e:
                    print(f"Ошибка при обработке URL: {e}")
            
            print(f"Извлеченные данные: price={price}, platform={platform}, url={url}")
            
            if not price or not platform or not url:
                print(f"Пропускаем запись {i+1}: неполные данные")
                continue
            
            # Проверяем, есть ли уже цена для этой платформы
            existing_price_result = await db.execute(
                select(BookPrice).where(
                    BookPrice.book_id == book_id,
                    BookPrice.platform == platform
                )
            )
            existing_price = existing_price_result.scalar_one_or_none()
            
            if existing_price:
                # Обновляем существующую цену
                existing_price.price = price
                existing_price.url = url
                existing_price.updated_at = datetime.utcnow()
                await db.commit()
                updated += 1
                print(f"Обновлена цена для {platform}: {price} руб.")
            else:
                # Создаем новую цену
                new_price = BookPrice(
                    book_id=book_id,
                    platform=platform,
                    price=price,
                    url=url
                )
                db.add(new_price)
                await db.commit()
                added += 1
                print(f"Добавлена новая цена для {platform}: {price} руб.")
                
        except (ValueError, IntegrityError, Exception) as e:
            await db.rollback()
            print(f"Ошибка при сохранении цены для книги {book_id}: {e}")
            continue
            
    print(f"Всего добавлено новых цен: {added}, обновлено существующих: {updated}")
    return added + updated

async def parse_and_save_prices_for_all_books(db: AsyncSession) -> dict:
    """
    Парсит цены для всех книг в базе данных.
    Возвращает статистику по парсингу.
    """
    print("Начинаем массовый парсинг цен для всех книг...")
    
    # Получаем все книги с ISBN
    result = await db.execute(select(Book).where(Book.isbn.isnot(None)))
    books = result.scalars().all()
    
    print(f"Найдено книг с ISBN: {len(books)}")
    
    total_processed = 0
    total_added = 0
    total_updated = 0
    total_errors = 0
    
    for book in books:
        try:
            print(f"Обрабатываем книгу {book.id}: {book.title} (ISBN: {book.isbn})")
            result = await parse_and_save_prices_for_book(book.id, db)
            # Примечание: parse_and_save_prices_for_book теперь возвращает общее количество
            # Для более детальной статистики можно было бы изменить её, чтобы она возвращала словарь
            total_added += result
            total_processed += 1
            print(f"Для книги {book.id} обработано цен: {result}")
        except Exception as e:
            print(f"Ошибка при парсинге цен для книги {book.id}: {e}")
            total_errors += 1
            continue
    
    result = {
        "total_books": len(books),
        "processed": total_processed,
        "added": total_added,
        "errors": total_errors
    }
    
    print(f"Массовый парсинг завершен. Результат: {result}")
    return result

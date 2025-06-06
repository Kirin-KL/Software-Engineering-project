from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import aiohttp
import asyncio
from bs4 import BeautifulSoup
from src.parsers.models import BookPrice
from src.parsers.schemas import BookPriceCreate, BookPriceResponse, BookPricesResponse
from src.service.base import BaseService
from src.books.models import Book
import urllib.parse
import logging
import random
import brotli
import json

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParserService(BaseService):
    """Сервис для парсинга цен на книги."""
    
    def __init__(self):
        super().__init__(BookPrice)
        self.platforms = {
            "ozon": "https://www.ozon.ru/search/?text={title}",
            "wildberries": "https://www.wildberries.ru/catalog/0/search.aspx?search={title}",
            "chitai_gorod": "https://www.chitai-gorod.ru/search?phrase={title}",
            "yandex_market": "https://market.yandex.ru/search?text={title}"
        }
        
        # Список User-Agent для ротации
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ]

    def _get_headers(self) -> Dict[str, str]:
        """Получение случайных заголовков для запроса."""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'TE': 'Trailers',
            'DNT': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
        }

    async def parse_book_prices(self, db: AsyncSession, book_id: int) -> BookPricesResponse:
        """Парсинг цен на книгу со всех площадок."""
        # Получаем книгу
        stmt = select(Book).where(Book.id == book_id)
        result = await db.execute(stmt)
        book = result.scalar_one_or_none()
        if not book:
            raise ValueError("Книга не найдена")

        logger.info(f"Начинаем парсинг цен для книги: {book.title} ({book.author})")

        # Удаляем старые цены
        stmt = delete(BookPrice).where(BookPrice.book_id == book_id)
        await db.execute(stmt)
        await db.commit()

        # Формируем поисковый запрос из названия и автора
        search_query = f"{book.title} {book.author}"
        encoded_query = urllib.parse.quote(search_query)
        logger.info(f"Поисковый запрос: {search_query}")

        # Парсим цены со всех площадок
        tasks = []
        for platform, url_template in self.platforms.items():
            url = url_template.format(title=encoded_query)
            logger.info(f"Парсинг {platform}: {url}")
            tasks.append(self._parse_platform_price(platform, url, book_id))
            # Добавляем небольшую задержку между запросами
            await asyncio.sleep(2)

        prices = await asyncio.gather(*tasks)
        valid_prices = [p for p in prices if p is not None]
        logger.info(f"Найдено цен: {len(valid_prices)}")

        # Сохраняем цены в базу
        for price in valid_prices:
            await self.create(db, price)

        # Формируем ответ
        return self._create_prices_response(book_id, valid_prices)

    async def _parse_platform_price(self, platform: str, url: str, book_id: int) -> Optional[BookPriceCreate]:
        """Парсинг цены с конкретной площадки."""
        try:
            headers = self._get_headers()
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 200:
                        html = await response.text()
                        logger.info(f"Получен ответ от {platform}, длина HTML: {len(html)}")
                        
                        # Сохраняем HTML для отладки
                        with open(f"debug_{platform}.html", "w", encoding="utf-8") as f:
                            f.write(html)
                        
                        price = await self._extract_price(platform, html)
                        if price:
                            logger.info(f"Найдена цена на {platform}: {price}")
                            return BookPriceCreate(
                                book_id=book_id,
                                platform=platform,
                                price=price,
                                url=url
                            )
                        else:
                            logger.warning(f"Цена не найдена на {platform}")
                    else:
                        logger.warning(f"Ошибка при запросе к {platform}: {response.status}")
        except Exception as e:
            logger.error(f"Ошибка при парсинге {platform}: {str(e)}")
        return None

    async def _extract_price(self, platform: str, html: str) -> Optional[float]:
        """Извлечение цены из HTML в зависимости от площадки."""
        soup = BeautifulSoup(html, 'html.parser')
        
        try:
            if platform == "ozon":
                # Обновленные селекторы для Ozon
                product = soup.find('div', {'data-widget': 'searchResultsV2Item'}) or \
                         soup.find('div', {'class': 'tsBody500Medium'})
                if product:
                    price_elem = product.find('span', {'data-widget': 'price'}) or \
                                product.find('span', {'class': 'c0h1'})
                    if price_elem:
                        price_text = price_elem.text.strip().replace(' ', '').replace('₽', '')
                        logger.info(f"Ozon price text: {price_text}")
                        return float(price_text)
                    else:
                        logger.warning("Ozon: price element not found in product")
                else:
                    logger.warning("Ozon: product not found")
            
            elif platform == "wildberries":
                # Обновленные селекторы для Wildberries
                product = soup.find('div', {'class': 'product-card'}) or \
                         soup.find('div', {'class': 'card'})
                if product:
                    price_elem = product.find('span', {'class': 'price-block__price'}) or \
                                product.find('span', {'class': 'price'})
                    if price_elem:
                        price_text = price_elem.text.strip().replace(' ', '').replace('₽', '')
                        logger.info(f"Wildberries price text: {price_text}")
                        return float(price_text)
                    else:
                        logger.warning("Wildberries: price element not found in product")
                else:
                    logger.warning("Wildberries: product not found")
            
            elif platform == "chitai_gorod":
                # Обновленные селекторы для Читай-город
                products = soup.find_all('div', {'class': 'product-card'}) or \
                          soup.find_all('div', {'class': 'product'}) or \
                          soup.find_all('div', {'class': 'product-item'})
                
                logger.info(f"Chitai-gorod: найдено {len(products)} продуктов")
                
                for product in products:
                    # Логируем структуру продукта для отладки
                    logger.info(f"Chitai-gorod product structure: {product.prettify()[:500]}")
                    
                    price_elem = product.find('div', {'class': 'product-price'}) or \
                                product.find('span', {'class': 'price'}) or \
                                product.find('div', {'class': 'price'}) or \
                                product.find('div', {'class': 'product-price__value'})
                    
                    if price_elem:
                        price_text = price_elem.text.strip().replace(' ', '').replace('₽', '')
                        logger.info(f"Chitai-gorod price text: {price_text}")
                        return float(price_text)
                    else:
                        logger.warning("Chitai-gorod: price element not found in product")
                
                logger.warning("Chitai-gorod: no products with prices found")
            
            elif platform == "yandex_market":
                # Обновленные селекторы для Яндекс.Маркет
                products = soup.find_all('div', {'class': '_1Jj8d'}) or \
                          soup.find_all('div', {'class': 'product'}) or \
                          soup.find_all('div', {'class': 'cia-cs'}) or \
                          soup.find_all('div', {'class': 'cia-vs'})
                
                logger.info(f"Yandex Market: найдено {len(products)} продуктов")
                
                for product in products:
                    # Логируем структуру продукта для отладки
                    logger.info(f"Yandex Market product structure: {product.prettify()[:500]}")
                    
                    price_elem = product.find('span', {'class': '_1Jj8d'}) or \
                                product.find('span', {'class': 'price'}) or \
                                product.find('span', {'class': 'cia-cs'}) or \
                                product.find('span', {'class': 'cia-vs'}) or \
                                product.find('div', {'class': 'cia-cs'})
                    
                    if price_elem:
                        price_text = price_elem.text.strip().replace(' ', '').replace('₽', '')
                        logger.info(f"Yandex Market price text: {price_text}")
                        return float(price_text)
                    else:
                        logger.warning("Yandex Market: price element not found in product")
                
                logger.warning("Yandex Market: no products with prices found")
        
        except (ValueError, AttributeError) as e:
            logger.error(f"Ошибка при извлечении цены с {platform}: {str(e)}")
            return None
        
        return None

    def _create_prices_response(self, book_id: int, prices: List[BookPriceCreate]) -> BookPricesResponse:
        """Создание ответа с информацией о ценах."""
        if not prices:
            return BookPricesResponse(
                book_id=book_id,
                prices=[],
                min_price=0,
                max_price=0,
                average_price=0
            )

        price_values = [p.price for p in prices]
        return BookPricesResponse(
            book_id=book_id,
            prices=[BookPriceResponse.model_validate(p) for p in prices],
            min_price=min(price_values),
            max_price=max(price_values),
            average_price=sum(price_values) / len(price_values)
        ) 
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole

import time
from bs4 import BeautifulSoup
import requests

headers = {
    'User-Agent' : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

def parsing_book24_bestseller():

    number_page = 1
    all_books = []
    while True:
        try:
            url_book24_bestsellers = f'https://book24.ru/knigi-bestsellery/page-{number_page}/'
            print(f"Парсинг страницы: {number_page}")
            html = requests.get(url_book24_bestsellers, headers = headers)

            if html.status_code != 200:
                print(f"Ошибка при загрузки страниц. Получен код {html.status_code}")
                break

            soup = BeautifulSoup(html.content, 'html.parser')
            div_tag = soup.find('div', class_ = 'product-list catalog__product-list')

            if div_tag is None:
                print("Контейнер с книгами не найден. Или конец списка")
                break

            all_a = div_tag.find_all('a', class_ = 'product-card__name')
            if all_a:
                for a in all_a:
                    title = a['title']
                    href = a['href']
                    book = [title, 'https://book24.ru' + href]
                    all_books.append(book)
            else:
                print("Книги на странице не найдены")
                break

            number_page += 1
            time.sleep(1)

        except Exception as e:
            print(f"Произошла ошибка {e}")
            break

    return all_books

def get_html_book24_page(url):
    html_page = requests.get(url, headers=headers)

    soup = BeautifulSoup(html_page.content, "html.parser")
    content_div = soup.find('div', class_ ='product-detail-page__main-holder')
    if content_div:

        title = content_div.find('h1', class_ = 'product-detail-page__title')
        title = title.text
        print("Название:",title)

        url_img = content_div.find('img', class_ = 'product-poster__main-image')
        url_img = url_img['src']
        print("Ссылка на обложку:",url_img)

        #Извлечение описания
        description_sections = content_div.select('.product-about__text p')
        description = ' '.join([p.get_text(strip=True) for p in description_sections])

        # Извлечение автора
        author_tag = content_div.find('a', {'class': 'product-characteristic-link', 'href': lambda x: x and 'author' in x})
        author = author_tag.get_text(strip=True) if author_tag else None

        # Извлечение ISBN
        isbn_button = content_div.find('button', {'aria-label': 'Копировать ISBN'})
        isbn = isbn_button.get_text(strip=True) if isbn_button else None

        # Поиск блока с характеристиками
        characteristic_items = soup.select('.product-characteristic__item')

        year = None
        for item in characteristic_items:
            label = item.find('span', class_='product-characteristic__label')
            if label and 'Год издания' in label.get_text(strip=True):
                value = item.find('dd', class_='product-characteristic__value')
                if value:
                    year = value.get_text(strip=True)
                    break

    book_data = {
        "title": title,
        "author": author,
        "description": description,
        "isbn": isbn,
        "publication_year": year,
        "url_image": url_img
    }
    return book_data


def get_links_to_the_book(isbn):

    html_urls_to_book = requests.get(f'https://www.findbook.ru/search/d1?isbn={isbn}r=0&r=0&s=0&s11=1&s52=1&s63=1&viewsize=15&startidx=0', headers=headers)

    soup = BeautifulSoup(html_urls_to_book.content, "html.parser")
    table_books = soup.find('div', class_ = 'results__book')

    return table_books.prettify()

def limit_tokens(text: str, max_tokens: int = 120_000) -> str:
    """Ограничивает длину текста по приблизительному количеству токенов (1 токен ≈ 4 символа)"""
    return text[:max_tokens * 4]

def extract_book_info_from_html_Giga(html: str) -> str:
    """
    Извлекает информацию о книге из HTML-кода с помощью GigaChat API.

    :param html: HTML-страница с информацией о книге
    :return: JSON-ответ от модели
    """

    autor_token = 'OTI5NzEzYTItNjAwYS00Y2Y1LWEzYWQtNWVkN2Q2NTQwMzE0OmZkNTk3YTk0LTA2MjItNGRiOS05M2U0LTc1ZWQyMTU2OTAyNw=='

    # Ограничиваем объем HTML под допустимое количество токенов
    prompt_html = limit_tokens(html, 120_000)

    # Системный промпт
    system_prompt = (
        'Ты опытный помощник по анализу HTML-страниц. '
        'Твоя задача — внимательно изучить предоставленный HTML-код '
        'и извлечь из него указанную пользователем информацию.'
    )

    # Пользовательский запрос
    user_question = (
        'Необходимо из html кода предоставленного ниже извлечь следующую информацию:'
        ' 1.Название магазина; 2. Ссылку на страницу книги в интернет магазине; 3. Цену книги.'
        'Если магазинов несколько напиши о всех них.'
        'Всю полученную информацию предоставь в виде текста JSON с заголовками: market, price, book_url.'
        'В ответе должен быть только json без объяснений.'
        f'Html код страницы:\n{prompt_html}'
    )

    # Формируем payload для GigaChat
    payload = Chat(
        messages=[
            Messages(role=MessagesRole.SYSTEM, content=system_prompt),
            Messages(role=MessagesRole.USER, content=user_question)
        ],
        temperature=0.0,
        max_tokens=800
    )

    # Запрос к GigaChat API
    with GigaChat(credentials=autor_token, ca_bundle_file="russian_trusted_root_ca.cer") as giga:
        response = giga.chat(payload)
        return response.choices[0].message.content










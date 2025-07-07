from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from src.auth.router import router as router_auth
from src.application.router import router as router_application
from src.books.router import router as router_books
from src.categories.router import router as router_categories
from src.borrowings.router import router as router_borrowings
from src.reviews.router import router as router_reviews
from src.favorite.router import router as router_favorites
from src.parsers.router import router as parsers_router
import os

app = FastAPI(
    title="Library API Documentation",
    description="API documentation for the library service",
    version="1.0.0",
    root_path="/api",
    docs_url="/docs"
)

# Настройка CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # Для React/Next.js frontend
    "http://localhost:8000",  # Для локальной разработки
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers",
                  "Access-Control-Allow-Origin", "Authorization"],
)

# Создаем директорию для статических файлов, если она не существует
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# Обработка статических файлов
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Подключение роутеров
app.include_router(router_auth, prefix="/v1/auth", tags=["auth"])
app.include_router(router_application, prefix="/v1/application", tags=["application"])
app.include_router(router_books, prefix="/v1/books", tags=["books"])
app.include_router(router_categories, prefix="/v1/categories", tags=["categories"])
app.include_router(router_borrowings, prefix="/v1/borrowings", tags=["borrowings"])
app.include_router(router_reviews, prefix="/v1/reviews", tags=["reviews"])
app.include_router(router_favorites, prefix="/v1/favorites", tags=["favorites"])
app.include_router(parsers_router)

# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )

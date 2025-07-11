#!/usr/bin/env python3
"""
Скрипт для запуска FastAPI сервера с поддержкой парсеров.
"""

import uvicorn
import os
import sys

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Запуск сервера с поддержкой парсеров...")
    print("API документация будет доступна по адресу: http://localhost:8000/api/docs")
    print("Парсеры доступны по адресу: http://localhost:8000/api/parsers/")
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 
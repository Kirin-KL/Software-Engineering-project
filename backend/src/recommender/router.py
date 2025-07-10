from fastapi import APIRouter, HTTPException
from src.recommender.service import get_recommendations_for_user
from src.books.schemas import BookResponse

router = APIRouter()

@router.get("/recommendations/{user_id}", response_model=list[BookResponse])
def recommendations(user_id: int, n: int = 5):
    books = get_recommendations_for_user(user_id, n)
    if books is None or len(books) == 0:
        raise HTTPException(status_code=404, detail="Нет персональных рекомендаций для пользователя")
    return books
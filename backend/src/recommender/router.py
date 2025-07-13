from fastapi import APIRouter, HTTPException, Depends
from src.recommender.service import get_recommendations_for_user
from src.recommender.train_recommender import train_and_save
from src.books.schemas import BookResponse
from src.auth.dependencies import get_current_user
from src.recommender.metrics import get_recommendation_metrics

router = APIRouter()

@router.get("/recommendations/{user_id}", response_model=list[BookResponse])
def recommendations(user_id: int, n: int = 5):
    books = get_recommendations_for_user(user_id, n)
    if books is None or len(books) == 0:
        raise HTTPException(status_code=404, detail="Нет персональных рекомендаций для пользователя")
    return books

@router.post("/admin/retrain")
async def retrain_recommendations(current_user = Depends(get_current_user)):
    """
    Эндпоинт для переобучения модели рекомендаций.
    Доступен авторизованным пользователям.
    """
    try:
        train_and_save()
        return {"message": "Модель рекомендаций успешно обновлена"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка при обновлении модели рекомендаций: {str(e)}"
        )

@router.get("/admin/metrics")
async def get_metrics(current_user = Depends(get_current_user)):
    """
    Эндпоинт для получения метрик рекомендательной системы.
    """
    try:
        metrics = get_recommendation_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении метрик: {str(e)}"
        )
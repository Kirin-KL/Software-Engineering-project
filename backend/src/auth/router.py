from fastapi import APIRouter, HTTPException, status, Response, Depends
from fastapi.responses import JSONResponse
from typing import List

from src.auth.auth import authenticate_user, create_access_token, get_password_hash, verify_password
from src.auth.schemas import SUserAuth, SUserCreate, SUserUpdate, SUserResponse
from src.auth.service import UserService
from src.auth.dependencies import get_current_user
from src.database import async_session_maker

router = APIRouter()

# List of admin emails
ADMIN_EMAILS = ["admin@bookbi.ru"]  # Add more admin emails as needed

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: SUserCreate) -> JSONResponse:
    existing_user = await UserService.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    hashed_password = await get_password_hash(user_data.password)
    async with async_session_maker() as session:
        user = UserService(session)
        new_user = await user.create(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
        )
    
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"message": "Пользователь успешно зарегистрирован"}
    )
    
@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(response: Response, user_data: SUserAuth) -> dict:
    user = await authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    access_token = await create_access_token({"sub": str(user.id)})
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,  # Только для HTTPS
        samesite="lax"  # Защита от CSRF
    )
    
    # Проверяем, является ли пользователь администратором
    is_admin = user.email in ADMIN_EMAILS
    print(f"Пользователь {user.email} {'является' if is_admin else 'не является'} администратором")
    
    return {
        "access_token": access_token,
        "is_admin": is_admin,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "is_verified": user.is_verified
        }
    }


@router.get("/me", response_model=SUserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
) -> SUserResponse:
    """
    Получение информации о текущем пользователе.
    """
    return current_user

@router.get("/{user_id}", response_model=SUserResponse)
async def get_user_by_id(
    user_id: int,
    current_user = Depends(get_current_user)
) -> SUserResponse:
    """
    Получение информации о пользователе по ID.
    Требуется авторизация.
    """
    user = await UserService.get_user_by_id_or_404(user_id)
    return user

@router.get("/by-email/{email}", response_model=SUserResponse)
async def get_user_by_email(
    email: str,
    current_user = Depends(get_current_user)
) -> SUserResponse:
    """
    Получение информации о пользователе по email.
    Требуется авторизация.
    """
    user = await UserService.get_user_by_email_or_404(email)
    return user

@router.get("/", response_model=List[SUserResponse])
async def get_all_users(
    current_user = Depends(get_current_user)
) -> List[SUserResponse]:
    """
    Получение списка всех пользователей в системе.
    Требуется авторизация.
    """
    async with async_session_maker() as session:
        user = UserService(session)
        users = await user.get_all()
    return users
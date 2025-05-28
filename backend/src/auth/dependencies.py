from fastapi import HTTPException, Request, Depends
from src.auth.service import UserService

async def get_token(request: Request) -> str:
    """
    Асинхронная функция для получения токена из Authorization header.
    
    Args:
        request (Request): FastAPI Request объект
        
    Returns:
        str: Токен доступа
        
    Raises:
        HTTPException: Если токен отсутствует или имеет неверный формат
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Данные для аутентификации не были предоставлены"
        )
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(
                status_code=401,
                detail="Неверный формат аутентификации (должен быть Bearer)"
            )
        return token
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Неверный формат заголовка аутентификации"
        )



async def get_current_user(token: str = Depends(get_token)):
    """
    Асинхронная функция для получения текущего пользователя по токену.
    
    Args:
        token (str): JWT токен из cookies
        
    Returns:
        User: Объект текущего пользователя
        
    Raises:
        HTTPException: Если токен недействителен или пользователь не найден
    """
    print(token)
    return await UserService.verify_token(token)


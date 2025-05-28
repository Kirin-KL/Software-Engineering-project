from datetime import datetime, timedelta  
from os import getenv                     

from dotenv import load_dotenv            
from fastapi import HTTPException          
from passlib.context import CryptContext   
from pydantic import EmailStr              
from jose import jwt                       

from src.auth.service import UserService      


load_dotenv()
JWT_KEY = getenv("JWT_KEY")
if not JWT_KEY:
    raise RuntimeError("JWT_KEY environment variable is not set")

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not hash password"
        )

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not verify password"
        )

async def authenticate_user(email: EmailStr, password: str):
    try:
        user = await UserService.find_one_or_none(email=email)
        if not user or not await verify_password(password, user.hashed_password):
            return None
        return user
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Authentication error occurred"
        )

async def create_access_token(data: dict) -> str:
    """
    Create JWT access token.
    
    Args:
        data (dict): Payload to encode into token
        
    Returns:
        str: Encoded JWT token
        
    Raises:
        HTTPException: If token creation fails
    """
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=30)
        to_encode.update({'exp': expire})
        encoded_jwt = jwt.encode(
            to_encode, JWT_KEY, algorithm="HS256"
        )
        return encoded_jwt
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not create access token"
        )
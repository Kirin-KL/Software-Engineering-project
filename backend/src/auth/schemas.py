from pydantic import BaseModel, EmailStr
from typing import Optional

class SUserAuth(BaseModel):
    email: EmailStr
    password: str

class SUserCreate(SUserAuth):
    pass

class SUserUpdate(BaseModel):
    pass

class SUserResponse(BaseModel):
    id: int
    email: EmailStr


    class Config:
        from_attributes = True
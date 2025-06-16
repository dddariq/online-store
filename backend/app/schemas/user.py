from pydantic import BaseModel

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "user"

class User(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True
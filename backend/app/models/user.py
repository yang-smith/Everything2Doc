import uuid
from typing import Generic, TypeVar, List, Optional
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool | None = True


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=40)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=40)
    is_active: bool | None = None

class UserUpdateMe(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)

class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=6, max_length=40)
    new_password: str = Field(min_length=6, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 关系定义
    projects: List["Project"] = Relationship(back_populates="user")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: str


class UserRegister(UserBase):
    password: str = Field(min_length=6, max_length=40)

# Generic type variable
T = TypeVar('T')
class PaginatedResponse(SQLModel, Generic[T]):
    data: List[T]
    count: int


# Using generic paginated response
class UsersPublic(PaginatedResponse[UserPublic]):
    pass



# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str  # 用户ID
    exp: datetime  # 过期时间


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class UserResponse(UserBase):
    id: str
    created_at: datetime

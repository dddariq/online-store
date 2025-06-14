from typing import List
from datetime import datetime
from pydantic import BaseModel

class ProductInOrder(BaseModel):
    id: int
    name: str
    price: float
    description: str
    image_url: str

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    status: str = "В обработке"

class OrderCreate(OrderBase):
    user_id: int
    product_ids: List[int]

class Order(OrderBase):
    id: int
    user_id: int
    created_at: datetime
    status: str
    products: List[ProductInOrder] = []
    total: float

    class Config:
        from_attributes = True
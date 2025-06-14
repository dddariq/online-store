from pydantic import BaseModel
from typing import Optional
from app.schemas.product import Product

class CartBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartCreate(CartBase):
    user_id: Optional[int] = None

class Cart(CartBase):
    id: int
    user_id: int
    product: Optional[Product] = None

    class Config:
        from_attributes = True
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import hashlib
from datetime import datetime, timedelta
from jose import jwt
from typing import List

from app.database import get_db
from app.repositories import product_repo, order_repo, user_repo, cart_repo
from app.schemas import product as schemas_product, user as schemas_user, order as schemas_order, cart as schemas_cart
from app.models import user as models_user, cart as models_cart
from app.api import deps
from app.core import config

router = APIRouter(prefix="/api")

@router.post("/register", response_model=schemas_user.User)
def register(user: schemas_user.UserCreate, db: Session = Depends(get_db)):
    if user_repo.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    return user_repo.create_user(db, user)

@router.post("/token")
def login_for_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    hashed = hashlib.sha256(form_data.password.encode()).hexdigest()
    db_user = user_repo.get_user_by_username(db, form_data.username)
    if not db_user or db_user.password != hashed:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": db_user.username, "exp": datetime.utcnow() + expires}
    token = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    res = login_for_token(form_data, db)
    return {"access_token": res["access_token"], "token_type": "bearer"}

@router.get("/me", response_model=schemas_user.User)
def read_me(current_user: models_user.User = Depends(deps.get_current_user)):
    return current_user

@router.get("/products", response_model=List[schemas_product.Product])
def read_products(db: Session = Depends(get_db)):
    return product_repo.get_products(db)

@router.post("/products", response_model=schemas_product.Product)
def create_product(
    product: schemas_product.ProductCreate,
    db: Session = Depends(get_db),
    _: models_user.User = Depends(deps.get_current_admin)
):
    return product_repo.create_product(db, product)

@router.get("/cart", response_model=List[schemas_cart.Cart])
def get_cart(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    return cart_repo.get_user_cart(db, current_user.id)

@router.post("/cart", response_model=schemas_cart.Cart)
def add_to_cart(
    cart_item: schemas_cart.CartCreate,
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    cart_item.user_id = current_user.id
    return cart_repo.add_to_cart(db, cart_item)

@router.delete("/cart/{product_id}")
def remove_from_cart(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    cart_repo.remove_from_cart(db, current_user.id, product_id)
    return {"message": "Товар удален из корзины"}

@router.put("/cart/{product_id}", response_model=schemas_cart.Cart)
def update_cart_item(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    return cart_repo.update_cart_quantity(db, current_user.id, product_id, quantity)

@router.delete("/cart")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    cart_repo.clear_cart(db, current_user.id)
    return {"message": "Корзина очищена"}

@router.post("/orders", response_model=schemas_order.Order)
def create_order(
    order: schemas_order.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    cart_items = cart_repo.get_user_cart(db, current_user.id)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    product_ids = [item.product_id for item in cart_items]
    products = product_repo.get_products(db)
    order_products = [p for p in products if p.id in product_ids]
    
    db_order = order_repo.create_order(db, schemas_order.OrderCreate(
        user_id=current_user.id,
        product_ids=product_ids,
        status="В обработке"
    ))
    
    cart_repo.clear_cart(db, current_user.id)
    
    total = sum(p.price for p in order_products)
    
    return schemas_order.Order(
        id=db_order.id,
        user_id=db_order.user_id,
        created_at=db_order.created_at,
        status=db_order.status,
        products=order_products,
        total=total
    )

@router.post("/orders/checkout", response_model=schemas_order.Order)
def checkout_order(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    cart_items = cart_repo.get_user_cart(db, current_user.id)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    product_ids = [item.product_id for item in cart_items]
    
    db_order = order_repo.create_order(db, schemas_order.OrderCreate(
        user_id=current_user.id,
        product_ids=product_ids,
        status="В обработке"
    ))
    
    cart_repo.clear_cart(db, current_user.id)
    
    products = product_repo.get_products(db)
    order_products = [p for p in products if p.id in product_ids]
    
    return schemas_order.Order(
        id=db_order.id,
        user_id=db_order.user_id,
        product_ids=product_ids,
        created_at=db_order.created_at,
        status=db_order.status,
        products=order_products
    )

@router.get("/orders", response_model=List[schemas_order.Order])
def read_orders(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    orders = order_repo.get_user_orders(db, current_user.id)
    result = []
    for order in orders:
        total = sum(p.price for p in order.products)
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "created_at": order.created_at,
            "status": order.status,
            "products": order.products,
            "total": total
        })
    return result

@router.get("/orders/user/{user_id}", response_model=List[schemas_order.Order])
def read_user_orders(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return order_repo.get_user_orders(db, user_id)

@router.get("/admin/orders", response_model=List[schemas_order.Order])
def get_all_orders_admin(
    db: Session = Depends(get_db),
    _: models_user.User = Depends(deps.get_current_admin)
):
    orders = order_repo.get_orders(db)
    return [{
        "id": order.id,
        "user_id": order.user_id,
        "created_at": order.created_at,
        "status": order.status,
        "products": order.products
    } for order in orders]

@router.get("/admin/users", response_model=List[schemas_user.User])
def get_all_users(
    db: Session = Depends(get_db),
    _: models_user.User = Depends(deps.get_current_admin)
):
    return user_repo.get_users(db)
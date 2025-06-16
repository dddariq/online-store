from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
import hashlib
from datetime import datetime, timedelta
from jose import jwt
from typing import List
from sqlalchemy import func, select

from app.database import get_db
from app.repositories import product_repo, order_repo, user_repo, cart_repo
from app.schemas import product as schemas_product, user as schemas_user, order as schemas_order, cart as schemas_cart
from app.models import user as models_user, cart as models_cart, order as models_order, product as models_product
from app.api import deps
from app.core import config

router = APIRouter(prefix="/api")

# Auth endpoints
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

# Product endpoints
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

# Cart endpoints
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

# Order endpoints
@router.get("/orders", response_model=List[schemas_order.Order])
def read_orders(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    orders = db.query(models_order.Order)\
        .filter(models_order.Order.user_id == current_user.id)\
        .order_by(models_order.Order.created_at.desc())\
        .all()
    
    result = []
    for order in orders:
        # Получаем все товары заказа с их ценами
        products = db.query(models_product.Product)\
            .join(models_order.order_product_table)\
            .filter(models_order.order_product_table.c.order_id == order.id)\
            .all()
        
        # Считаем общую сумму
        total = sum(product.price for product in products)
        
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "created_at": order.created_at,
            "status": order.status,
            "total": total
        })
    return result

@router.post("/orders/checkout", response_model=schemas_order.Order)
def checkout_order(
    db: Session = Depends(get_db),
    current_user: models_user.User = Depends(deps.get_current_user)
):
    # Получаем корзину с продуктами
    cart_items = db.query(models_cart.Cart)\
        .options(joinedload(models_cart.Cart.product))\
        .filter(models_cart.Cart.user_id == current_user.id)\
        .all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    # Создаем заказ
    db_order = models_order.Order(
        user_id=current_user.id,
        status="В обработке",
        created_at=datetime.utcnow()
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Добавляем товары в заказ и считаем сумму
    total = 0
    for item in cart_items:
        if not item.product:
            continue
        
        # Добавляем связь между заказом и продуктом
        db.execute(
            models_order.order_product_table.insert().values(
                order_id=db_order.id,
                product_id=item.product_id
            )
        )
        total += item.product.price * item.quantity

    # Очищаем корзину
    db.query(models_cart.Cart)\
        .filter(models_cart.Cart.user_id == current_user.id)\
        .delete()
    db.commit()

    return {
        "id": db_order.id,
        "user_id": db_order.user_id,
        "created_at": db_order.created_at,
        "status": db_order.status,
        "total": total
    }

# Admin endpoints
@router.get("/admin/orders", response_model=List[schemas_order.Order])
def get_all_orders_admin(
    db: Session = Depends(get_db),
    _: models_user.User = Depends(deps.get_current_admin)
):
    orders = db.query(models_order.Order)\
        .order_by(models_order.Order.created_at.desc())\
        .all()
    
    result = []
    for order in orders:
        # Получаем все продукты заказа и их количество
        products = db.query(
            models_product.Product,
            func.count(models_product.Product.id).label('quantity')
        )\
            .join(models_order.order_product_table)\
            .filter(models_order.order_product_table.c.order_id == order.id)\
            .group_by(models_product.Product.id)\
            .all()
        
        # Считаем общую сумму
        total = sum(product.price * quantity for product, quantity in products)
        
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "created_at": order.created_at,
            "status": order.status,
            "total": total
        })
    return result

@router.get("/admin/users", response_model=List[schemas_user.User])
def get_all_users(
    db: Session = Depends(get_db),
    _: models_user.User = Depends(deps.get_current_admin)
):
    return user_repo.get_users(db)
from sqlalchemy.orm import Session, joinedload
from app.models.cart import Cart as ModelCart
from app.schemas.cart import CartCreate as SchemaCartCreate

def add_to_cart(db: Session, cart_item: SchemaCartCreate):
    existing_item = db.query(ModelCart).filter(
        ModelCart.user_id == cart_item.user_id,
        ModelCart.product_id == cart_item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += cart_item.quantity
    else:
        existing_item = ModelCart(**cart_item.dict())
        db.add(existing_item)
    
    db.commit()
    db.refresh(existing_item)
    return existing_item

def get_user_cart(db: Session, user_id: int):
    return db.query(ModelCart).options(joinedload(ModelCart.product)).filter(ModelCart.user_id == user_id).all()

def remove_from_cart(db: Session, user_id: int, product_id: int):
    db.query(ModelCart).filter(
        ModelCart.user_id == user_id,
        ModelCart.product_id == product_id
    ).delete()
    db.commit()

def update_cart_quantity(db: Session, user_id: int, product_id: int, quantity: int):
    cart_item = db.query(ModelCart).filter(
        ModelCart.user_id == user_id,
        ModelCart.product_id == product_id
    ).first()
    
    if not cart_item:
        return None
        
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item

def clear_cart(db: Session, user_id: int):
    db.query(ModelCart).filter(ModelCart.user_id == user_id).delete()
    db.commit()
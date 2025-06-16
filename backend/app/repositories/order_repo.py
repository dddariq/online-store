from sqlalchemy.orm import Session, joinedload
from app.models.order import Order as ModelOrder, order_product_table
from app.schemas.order import OrderCreate as SchemaOrderCreate

def create_order(db: Session, order: SchemaOrderCreate):
    db_order = ModelOrder(
        user_id=order.user_id,
        status=order.status
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Добавляем связь с товарами
    for product_id in order.product_ids:
        db.execute(
            order_product_table.insert().values(
                order_id=db_order.id,
                product_id=product_id
            )
        )
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders(db: Session):
    return db.query(ModelOrder).options(
        joinedload(ModelOrder.products)
    ).order_by(ModelOrder.created_at.desc()).all()

def get_user_orders(db: Session, user_id: int):
    return db.query(ModelOrder).options(
        joinedload(ModelOrder.products)
    ).filter(ModelOrder.user_id == user_id).order_by(ModelOrder.created_at.desc()).all()
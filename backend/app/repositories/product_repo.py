from sqlalchemy.orm import Session
from app.models.product import Product as ModelProduct
from app.schemas.product import ProductCreate as SchemaProductCreate

def get_products(db: Session):
    return db.query(ModelProduct).all()

def create_product(db: Session, product: SchemaProductCreate):
    db_product = ModelProduct(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
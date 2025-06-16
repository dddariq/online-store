from sqlalchemy import Column, Integer, ForeignKey, DateTime, Table, String
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

order_product_table = Table(
    "order_products",
    Base.metadata,
    Column("order_id", Integer, ForeignKey("orders.id"), primary_key=True),
    Column("product_id", Integer, ForeignKey("products.id"), primary_key=True)
)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="В обработке")

    user = relationship("User", back_populates="orders")
    products = relationship("Product", secondary=order_product_table)
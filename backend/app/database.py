from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Указываем путь к базе данных
SQLALCHEMY_DATABASE_URL = "sqlite:///./store.db"

# Создаём движок базы данных
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Создаём сессию
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Функция, которую используем как Depends(get_db)
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.database import Base, engine

print("Создание таблиц в базе данных...")

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Таблицы успешно созданы")

if __name__ == "__main__":
    create_tables()

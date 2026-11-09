import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# 1. Настройка "тумблера" окружения (Production / Development)
ENV = os.getenv("ENVIRONMENT", "development")
# Разрешаем запросы только с вашего будущего фронтенда Vercel (или localhost для тестов)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app = FastAPI(
    title="Böblingen Spediter Logistik API",
    debug=(ENV == "development")
)

# 2. Активируем CORS рубеж защиты
# Указываем точный URL твоего приложения на Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://spediter.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 3. Pydantic-схема (Защита №1: Валидация входящих данных грузовика)
class DeliveryRequest(BaseModel):
    # Ограничиваем имя товара строгими правилами, чтобы избежать инъекций
    cargo_name: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9а-яА-Я\s\-\.]+$")
    # Вес груза в тоннах. Защита от гигантских чисел и отрицательных значений!
    weight_tons: float = Field(..., gt=0, le=7.5, description="Максимальная грузоподъемность LKW 7.5 тонн")
    # Точка назначения в Бёблингене
    destination: str = Field(..., description="Куда везем: Mercaden, Kaufland или Diezenhalde")


# Исходное состояние нашей машины LKW
lkw_status = {
    "status": "IDLE",  # Возможные: IDLE, EN_ROUTE, DELIVERED
    "location": "Böblingen Hulb (Zentrallager)",
    "current_cargo": None,
    "weight": 0.0
}


# 4. Фоновая асинхронная задача симуляции движения по дорогам Бёблингена
async def simulate_lkw_travel(destination: str):
    await asyncio.sleep(10)  # LKW "едет" 10 секунд до магазина
    lkw_status["status"] = "DELIVERED"
    lkw_status["location"] = f"{destination} (Ankunft)"


# 5. Эндпоинт отправки машины (Защищен от переполнений и зависаний)
@app.post("/api/v1/dispatch")
async def dispatch_lkw(request: DeliveryRequest):
    if lkw_status["status"] == "EN_ROUTE":
        raise HTTPException(status_code=400, detail="LKW ist bereits unterwegs! Машина уже в рейсе.")

    # Строго проверяем разрешенные точки в Бёблингене
    allowed_destinations = ["Mercaden", "Kaufland", "Diezenhalde"]
    if request.destination not in allowed_destinations:
        raise HTTPException(status_code=400, detail="Unbekanntes Ziel в Бёблингене!")

    # Загружаем LKW и отправляем в рейс
    lkw_status["status"] = "EN_ROUTE"
    lkw_status["location"] = "Auf der Straße (Böblingen)"
    lkw_status["current_cargo"] = request.cargo_name
    lkw_status["weight"] = request.weight_tons

    # Запускаем фоновую задачу, сервер не зависнет на 68 лет!
    asyncio.create_task(simulate_lkw_travel(request.destination))

    return {"message": "LKW erfolgreich abgefahren!", "status": lkw_status}


@app.get("/api/v1/lkw-status")
async def get_status():
    return lkw_status

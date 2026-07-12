from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from api.v1.free_models import router as models_router
from api.v1.health import router as health_router
from api.v1.router import router as main_router

app = FastAPI()

# Настройка CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router, prefix="/api")
app.include_router(models_router)
app.include_router(health_router)

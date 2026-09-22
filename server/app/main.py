from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.catalogue import router as catalogue_router
from app.api.shop import router as shop_router
from app.api.images import router as images_router
from app.api.matching import router as matching_router
from app.core.config import settings
from app.services import database

app = FastAPI(
    lifespan=database.lifespan,
    title="StyleFit API",
    description="StyleFit clothing catalogue and authenticated shopping API.",
    version="0.3.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(health_router)
app.include_router(catalogue_router)
app.include_router(shop_router)
app.include_router(images_router)
app.include_router(matching_router)

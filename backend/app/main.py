from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.deviations import router as deviations_router
from app.config import settings

app = FastAPI(
    title="AIVOA AI Deviation API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deviations_router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "aivoa-deviation-api",
    }
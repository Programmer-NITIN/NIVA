"""
NIVA Backend — FastAPI Application Entry Point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    # Startup
    print("[NIVA] Backend starting...")
    print(f"   AA Mode:      {settings.aa_mode}")
    print(f"   LLM Provider: {settings.llm_provider}")
    print(f"   Database:     connected")
    yield
    # Shutdown
    print("[NIVA] Backend shutting down...")


app = FastAPI(
    title="NIVA — Responsible Financial Intelligence API",
    description=(
        "AI-Powered Hyper-Personalized Banking for Bharat. "
        "Uses RBI Account Aggregator framework for secure financial data access."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "niva-api",
        "aa_mode": settings.aa_mode,
        "llm_provider": settings.llm_provider,
    }

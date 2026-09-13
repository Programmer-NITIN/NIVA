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
    print("[NIVA] Backend starting...")
    print(f"   AA Mode:      {settings.aa_mode}")
    print(f"   LLM Provider: {settings.llm_provider}")
    # Try to init DB (sqlite fallback if postgres unavailable)
    try:
        from app.database import init_db
        await init_db()
        print(f"   Database:     initialized")
    except Exception as e:
        print(f"   Database:     init failed ({e}) - will retry on request")
    yield
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

# CORS - restrict to configured origins
_allowed = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Real-time Terminal Request Logging Middleware
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class TerminalRequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        
        path = request.url.path
        if path.startswith("/api/v1") and request.method != "OPTIONS":
            status_color = "\033[92m" if response.status_code < 400 else "\033[91m"
            method_color = "\033[96m" if request.method == "GET" else "\033[93m"
            reset = "\033[0m"
            print(f"[API] {method_color}{request.method:<6}{reset} {path:<42} -> {status_color}{response.status_code}{reset} ({elapsed_ms:.1f}ms)", flush=True)
        return response

app.add_middleware(TerminalRequestLoggingMiddleware)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "title": "NIVA — Responsible Financial Intelligence API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health",
        "frontend_url": "http://localhost:3000",
        "message": "NIVA Backend API is running successfully. Open http://localhost:3000 for the Web UI or /docs for Swagger API documentation."
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "niva-api",
        "aa_mode": settings.aa_mode,
        "llm_provider": settings.llm_provider,
    }

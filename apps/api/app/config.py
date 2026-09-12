"""
NIVA Backend — Configuration via environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://niva:niva_dev_2026@localhost:5432/niva"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # AA Provider
    aa_mode: str = "mock"  # "mock" | "setu"
    setu_base_url: str = "https://fiu-uat.setu.co"
    setu_client_id: Optional[str] = None
    setu_client_secret: Optional[str] = None
    setu_product_instance_id: Optional[str] = None

    # LLM
    llm_provider: str = "gemini"  # "gemini" | "groq"
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None

    # Auth
    secret_key: str = "niva-hackathon-secret-change-in-prod"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = (".env", "../.env", "../../.env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

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
    secret_key: Optional[str] = None
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    jwt_algorithm: str = "HS256"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # App
    app_env: str = "development"

    class Config:
        env_file = (".env", "../.env", "../../.env")
        env_file_encoding = "utf-8"
        extra = "ignore"

    def model_post_init(self, __context):
        import secrets as _secrets
        if not self.secret_key or len(self.secret_key) < 32:
            if self.app_env == "production":
                raise ValueError("SECRET_KEY must be >=32 chars in production. Set SECRET_KEY env.")
            # dev fallback - generate ephemeral key and warn
            if not self.secret_key:
                self.secret_key = _secrets.token_hex(32)
                print("[NIVA] WARNING: SECRET_KEY not set, generated ephemeral key for dev session")
            elif len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be >=32 chars")


settings = Settings()

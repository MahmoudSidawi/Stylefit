from pathlib import Path

from pydantic import SecretStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVER_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    client_origin: str = "http://localhost:5173"
    supabase_url: str | None = None
    supabase_publishable_key: SecretStr | None = None
    supabase_secret_key: SecretStr | None = None
    ai_api_key: SecretStr | None = None
    groq_api_key: SecretStr | None = None
    groq_model: str = 'qwen/qwen3.8-27b'
    groq_timeout_seconds: float = Field(45, gt=0, le=120)
    sample_catalogue_enabled: bool = True


settings = Settings()

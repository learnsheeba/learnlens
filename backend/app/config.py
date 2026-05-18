from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "LearnLens API"
    debug: bool = False

    google_api_key: str = ""
    gemma_model: str = "gemma-4-26b-it"

    llm_provider: str = "google"  # google | ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma4"

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

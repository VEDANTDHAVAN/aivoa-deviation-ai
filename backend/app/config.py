from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = ""
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore",
    )

settings = Settings()
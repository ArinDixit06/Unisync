from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    api_base_url: str = "https://unisync-pztl.onrender.com"
    frontend_url: str = "https://unisync-pztl.onrender.com"

    database_url: str | None = None
    use_db: bool = Field(default=False, validation_alias="USE_DB")
    redis_url: str | None = None
    use_redis: bool = Field(default=False, validation_alias="USE_REDIS")

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = Field(
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET", "JWT_SECRET")
    )

    google_client_id: str
    google_client_secret: str
    google_pubsub_topic: str | None = None
    google_cloud_project: str | None = None
    gmail_redirect_uri: str | None = Field(default=None, validation_alias="GOOGLE_REDIRECT_URI")

    microsoft_client_id: str
    microsoft_client_secret: str
    microsoft_tenant_id: str
    outlook_redirect_uri: str | None = Field(default=None, validation_alias="MICROSOFT_REDIRECT_URI")

    gemini_api_key: str
    gemini_model: str | None = Field(default=None, validation_alias="GEMINI_MODEL")

    token_encryption_key: str
    jwt_secret: str = Field(validation_alias="JWT_SECRET")
    webhook_secret: str | None = None


settings = Settings()


def gmail_redirect() -> str:
    if settings.gmail_redirect_uri:
        return settings.gmail_redirect_uri
    return f"{settings.api_base_url}/auth/callback/gmail"


def outlook_redirect() -> str:
    if settings.outlook_redirect_uri:
        return settings.outlook_redirect_uri
    return f"{settings.api_base_url}/auth/callback/outlook"

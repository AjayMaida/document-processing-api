from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    allowed_extensions: list[str]
    allowed_content_types: list[str]
    database_url: str
    upload_dir: str

    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
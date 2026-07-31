from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):


    ALLOWED_EXTENSIONS = frozenset({
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
    })

    ALLOWED_CONTENT_TYPES = frozenset({
        "application/pdf",
        "image/jpeg",
        "image/png",
    })

    database_url: str
    upload_dir:str
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

settings = Settings()
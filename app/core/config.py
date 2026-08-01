from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    allowed_extentions: str
    allowed_content_types: str
    database_url: str
    upload_dir:str
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

settings = Settings()
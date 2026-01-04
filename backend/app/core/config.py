from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # Anthropic API
    anthropic_api_key: str
    
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    
    # App settings
    app_name: str = "NeuroMedica Chat API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


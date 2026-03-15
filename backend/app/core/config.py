from pydantic_settings import BaseSettings
from typing import Optional, List, Any, Dict
from pydantic import computed_field, model_validator


class Settings(BaseSettings):
    # Groq API
    groq_api_key: str
    
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    
    # App settings
    app_name: str = "NeuroMedica Chat API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # CORS - stored as string in env file
    allowed_origins_str: str = "http://localhost:3000,http://localhost:3001"
    
    @model_validator(mode='before')
    @classmethod
    def parse_allowed_origins(cls, data: Any) -> Any:
        """Convert ALLOWED_ORIGINS env var to allowed_origins_str before validation."""
        if isinstance(data, dict):
            # Handle both ALLOWED_ORIGINS and allowed_origins_str
            if 'ALLOWED_ORIGINS' in data and 'allowed_origins_str' not in data:
                data['allowed_origins_str'] = data.pop('ALLOWED_ORIGINS')
            elif 'allowed_origins' in data and 'allowed_origins_str' not in data:
                data['allowed_origins_str'] = data.pop('allowed_origins')
        return data
    
    @computed_field
    @property
    def allowed_origins(self) -> List[str]:
        """Parse comma-separated origins string into a list."""
        return [origin.strip() for origin in self.allowed_origins_str.split(',') if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


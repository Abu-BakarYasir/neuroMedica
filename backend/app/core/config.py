from pydantic_settings import BaseSettings
from typing import Optional, List, Any, Dict
from pydantic import computed_field, model_validator


class Settings(BaseSettings):
    # Groq API
    groq_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection: str = "pubmed_articles"

    # Ingestion
    pubmed_email: str = "neuromedica@example.com"
    pubmed_api_key: Optional[str] = None
    embedding_model: str = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
    chunk_size: int = 512
    chunk_overlap: int = 64

    # Retrieval
    rrf_k: int = 60
    dense_weight: float = 1.0
    sparse_weight: float = 1.0

    # Reranking
    reranker_model: str = "BAAI/bge-reranker-base"

    # Generation (Claude API)
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"
    claude_max_tokens: int = 2048

    # Knowledge Graph (Neo4j)
    neo4j_uri: str = ""
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

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


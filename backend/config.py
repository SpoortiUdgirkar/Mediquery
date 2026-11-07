import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
LOCAL_DB_FILE = DATA_DIR / "vector_store.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "MediQuery RAG"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Vector store mode: 'local' (zero-config local vector store) or 'supabase' (pgvector)
    VECTOR_STORE_MODE: str = os.getenv("VECTOR_STORE_MODE", "local")
    
    # Supabase credentials (optional if using local mode)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # LLM API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Preferred LLM Provider: 'gemini', 'openai', or 'auto'
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")
    
    # Retrieval Settings
    TOP_K_CHUNKS: int = 5
    SIMILARITY_THRESHOLD: float = 0.10
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

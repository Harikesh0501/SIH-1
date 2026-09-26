import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
use_sqlite = os.environ.get("USE_SQLITE", "").lower() in ("1", "true", "yes")

engine = None

if DATABASE_URL and not use_sqlite:
    # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    try:
        test_engine = create_engine(
            DATABASE_URL,
            poolclass=NullPool,
            connect_args={"connect_timeout": 3}
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        print("[Database] Successfully connected to PostgreSQL cloud database.")
    except Exception as e:
        print(f"[Database Warning] PostgreSQL connection failed ({type(e).__name__}). Falling back to local SQLite database.")
        engine = None

if engine is None:
    # Fallback to local SQLite database
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "rakshak_aayush.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

    # Enable WAL (Write-Ahead Logging) mode and foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
    print("[Database] Using local SQLite database (rakshak_aayush.db).")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlmodel import create_engine, SQLModel, Session
import os

# Store DB in same folder as this file — always works
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "canarasakhi.db")

# Create folder if needed (shouldn't be needed but just in case)
os.makedirs(BASE_DIR, exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False, "timeout": 30}
)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as s:
        yield s
import os
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

MODEL_PATH = os.getenv("MODEL_PATH", "backend/yolov8n.pt")
if not Path(MODEL_PATH).is_absolute():
    MODEL_PATH = str(PROJECT_ROOT / MODEL_PATH)

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

DB_PATH = os.getenv("DB_PATH", "detections.db")
if not Path(DB_PATH).is_absolute():
    DB_PATH = str(PROJECT_ROOT / DB_PATH)

FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]
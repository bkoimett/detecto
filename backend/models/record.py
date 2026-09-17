from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from ..config import DB_PATH

Base = declarative_base()


class DetectionRecord(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    count = Column(Integer)
    avg_confidence = Column(Float)
    inference_time_ms = Column(Float)


engine = create_engine(f"sqlite:///{DB_PATH}")
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)
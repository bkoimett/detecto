from datetime import datetime

from fastapi import APIRouter, Query

from ..models.record import DetectionRecord, SessionLocal

router = APIRouter()


@router.get("/history")
def get_history(
    min_confidence: float = Query(0.0),
    since: str | None = None,
    limit: int = 100,
):
    db = SessionLocal()
    q = db.query(DetectionRecord)
    if since:
        q = q.filter(DetectionRecord.timestamp >= datetime.fromisoformat(since))
    q = q.filter(DetectionRecord.avg_confidence >= min_confidence)
    rows = q.order_by(DetectionRecord.timestamp.desc()).limit(limit).all()
    db.close()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "count": r.count,
            "avg_confidence": r.avg_confidence,
            "inference_time_ms": r.inference_time_ms,
        }
        for r in rows
    ]


@router.post("/reset")
def reset():
    db = SessionLocal()
    db.query(DetectionRecord).delete()
    db.commit()
    db.close()
    return {"status": "cleared"}
import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Query, Response

from ..models.record import DetectionRecord, SessionLocal

router = APIRouter()


def _query_rows(min_confidence, since, limit):
    db = SessionLocal()
    q = db.query(DetectionRecord)
    if since:
        q = q.filter(DetectionRecord.timestamp >= datetime.fromisoformat(since))
    q = q.filter(DetectionRecord.avg_confidence >= min_confidence)
    rows = q.order_by(DetectionRecord.timestamp.desc()).limit(limit).all()
    db.close()
    return rows


def _row_dict(r):
    return {
        "id": r.id,
        "timestamp": r.timestamp.isoformat(),
        "count": r.count,
        "avg_confidence": r.avg_confidence,
        "inference_time_ms": r.inference_time_ms,
    }


@router.get("/history")
def get_history(
    min_confidence: float = Query(0.0),
    since: str | None = None,
    limit: int = 100,
):
    return [_row_dict(r) for r in _query_rows(min_confidence, since, limit)]


@router.get("/history/export")
def get_history_export(
    min_confidence: float = Query(0.0),
    since: str | None = None,
    limit: int = 100,
):
    rows = _query_rows(min_confidence, since, limit)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "timestamp", "count", "avg_confidence", "inference_time_ms"])
    for r in rows:
        writer.writerow([
            r.id, r.timestamp.isoformat(),
            r.count, r.avg_confidence, r.inference_time_ms,
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="detections.csv"'},
    )


@router.post("/reset")
def reset():
    db = SessionLocal()
    db.query(DetectionRecord).delete()
    db.commit()
    db.close()
    return {"status": "cleared"}


@router.get("/stats")
def get_stats():
    db = SessionLocal()
    rows = db.query(
        DetectionRecord.timestamp,
        DetectionRecord.count,
        DetectionRecord.avg_confidence,
        DetectionRecord.inference_time_ms,
    ).order_by(DetectionRecord.timestamp.asc()).all()
    db.close()

    total_detections = len(rows)
    total_people = sum(r.count for r in rows)
    avg_confidence = (
        round(sum(r.avg_confidence for r in rows) / total_detections, 3)
        if total_detections else 0.0
    )
    avg_inference_time_ms = (
        round(sum(r.inference_time_ms for r in rows) / total_detections, 2)
        if total_detections else 0.0
    )

    now = datetime.utcnow()
    detections_last_hour = sum(
        1 for r in rows if r.timestamp >= now - timedelta(hours=1)
    )

    cutoff = now - timedelta(hours=24)
    buckets = {}
    for r in rows:
        if r.timestamp >= cutoff:
            key = r.timestamp.strftime("%Y-%m-%dT%H:00")
            b = buckets.setdefault(key, {"detections": 0, "people": 0})
            b["detections"] += 1
            b["people"] += r.count
    per_hour = [
        {"hour": hour, "detections": b["detections"], "people": b["people"]}
        for hour, b in sorted(buckets.items())
    ]
    busiest = max(per_hour, key=lambda b: b["people"], default=None)

    return {
        "total_detections": total_detections,
        "total_people": total_people,
        "avg_confidence": avg_confidence,
        "avg_inference_time_ms": avg_inference_time_ms,
        "detections_last_hour": detections_last_hour,
        "per_hour": per_hour,
        "busiest_hour": busiest,
    }
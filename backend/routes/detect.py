import base64
import time

import cv2
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from ultralytics import YOLO

from ..config import CONFIDENCE_THRESHOLD, MODEL_PATH
from ..models.record import DetectionRecord, SessionLocal
from ..models.schemas import DetectResponse, Detection, LiveDetectResponse
from ..utils.preprocessing import preprocess_image
from ..utils.tracker import CentroidTracker

router = APIRouter()
model = YOLO(MODEL_PATH)
live_tracker = CentroidTracker()


def _person_boxes(results):
    boxes = []
    for box in results[0].boxes:
        if model.names[int(box.cls[0])] == "person":
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            boxes.append({
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "confidence": float(box.conf[0]),
            })
    return boxes


def _decode_image(raw):
    try:
        return preprocess_image(raw, target_size=(640, 640))
    except ValueError:
        raise HTTPException(400, "Could not decode image")


def _parse_zone(raw: str | None):
    if not raw:
        return None
    parts = [float(p) for p in raw.split(",")]
    if len(parts) != 4:
        raise HTTPException(400, "zone must be x1,y1,x2,y2")
    return parts


def _count_in_zone(boxes, zone):
    if not zone:
        return None
    x1, y1, x2, y2 = zone
    count = 0
    for b in boxes:
        cx = (b["x1"] + b["x2"]) / 2
        cy = (b["y1"] + b["y2"]) / 2
        if x1 <= cx <= x2 and y1 <= cy <= y2:
            count += 1
    return count


def _persist(count, avg_conf, dt_ms):
    db = SessionLocal()
    db.add(DetectionRecord(
        count=count,
        avg_confidence=avg_conf,
        inference_time_ms=dt_ms,
    ))
    db.commit()
    db.close()


@router.post("/detect", response_model=DetectResponse)
async def detect(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Only JPEG/PNG supported")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")

    img = _decode_image(raw)
    t0 = time.perf_counter()
    results = model(img, conf=CONFIDENCE_THRESHOLD, verbose=False)
    dt = (time.perf_counter() - t0) * 1000

    boxes = _person_boxes(results)
    annotated = results[0].plot()
    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode()

    count = len(boxes)
    avg_conf = sum(b["confidence"] for b in boxes) / count if count else 0.0
    inference_time_ms = round(dt, 2)
    _persist(count, avg_conf, inference_time_ms)

    return DetectResponse(
        count=count,
        detections=[Detection(**b) for b in boxes],
        inference_time_ms=inference_time_ms,
        avg_confidence=avg_conf,
        annotated_image_b64=b64,
    )


@router.post("/detect/live", response_model=LiveDetectResponse)
async def detect_live(
    file: UploadFile = File(...),
    zone: str | None = Query(None, description="x1,y1,x2,y2 in 640x640 space"),
    alert_threshold: int = Query(0, ge=0),
):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Only JPEG/PNG supported")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")

    img = _decode_image(raw)
    zone_box = _parse_zone(zone)

    t0 = time.perf_counter()
    results = model(img, conf=CONFIDENCE_THRESHOLD, verbose=False)
    dt = (time.perf_counter() - t0) * 1000

    boxes = _person_boxes(results)
    track_ids = live_tracker.update(boxes)

    annotated = results[0].plot()
    for tid, trail in live_tracker.trails():
        pts = [(int(x), int(y)) for x, y in trail]
        for a, b in zip(pts[:-1], pts[1:]):
            cv2.line(annotated, a, b, (0, 255, 0), 2)
    for b, tid in zip(boxes, track_ids):
        if tid is not None:
            label = f"#{tid}"
            org = (int(b["x1"]), int(b["y1"]) - 6)
            cv2.putText(
                annotated, label, org,
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2,
            )
    if zone_box:
        x1, y1, x2, y2 = [int(v) for v in zone_box]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 165, 0), 2)

    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode()

    count = len(boxes)
    avg_conf = sum(b["confidence"] for b in boxes) / count if count else 0.0
    zone_count = _count_in_zone(boxes, zone_box)
    zone_alert = bool(zone_count is not None and alert_threshold > 0 and zone_count >= alert_threshold)

    detections = [
        {**b, "track_id": track_ids[i]} for i, b in enumerate(boxes)
    ]

    return LiveDetectResponse(
        count=count,
        detections=detections,
        inference_time_ms=round(dt, 2),
        avg_confidence=avg_conf,
        annotated_image_b64=b64,
        zone_count=zone_count,
        zone_alert=zone_alert,
    )
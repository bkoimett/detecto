import base64
import time

import cv2
from fastapi import APIRouter, File, HTTPException, UploadFile
from ultralytics import YOLO

from ..config import CONFIDENCE_THRESHOLD, MODEL_PATH
from ..models.record import DetectionRecord, SessionLocal
from ..models.schemas import DetectResponse, Detection
from ..utils.preprocessing import preprocess_image

router = APIRouter()
model = YOLO(MODEL_PATH)


@router.post("/detect", response_model=DetectResponse)
async def detect(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Only JPEG/PNG supported")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")

    try:
        img = preprocess_image(raw, target_size=(640, 640))
    except ValueError:
        raise HTTPException(400, "Could not decode image")

    t0 = time.perf_counter()
    results = model(img, conf=CONFIDENCE_THRESHOLD, verbose=False)
    dt = (time.perf_counter() - t0) * 1000

    detections = []
    for box in results[0].boxes:
        if model.names[int(box.cls[0])] == "person":
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(
                Detection(
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=float(box.conf[0]),
                )
            )

    annotated = results[0].plot()
    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode()

    count = len(detections)
    avg_conf = sum(d.confidence for d in detections) / count if count else 0.0
    inference_time_ms = round(dt, 2)

    db = SessionLocal()
    db.add(DetectionRecord(
        count=count,
        avg_confidence=avg_conf,
        inference_time_ms=inference_time_ms,
    ))
    db.commit()
    db.close()

    return DetectResponse(
        count=count,
        detections=detections,
        inference_time_ms=inference_time_ms,
        avg_confidence=avg_conf,
        annotated_image_b64=b64,
    )
from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
import cv2, base64, time, numpy as np
from ..models.record import DetectResponse, Detection

router = APIRouter()
model = YOLO("yolov8n.pt")

@router.post("/detect", response_model=DetectResponse)
async def detect(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Only JPEG/PNG supported")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")

    nparr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    t0 = time.perf_counter()
    results = model(img, conf=0.5, verbose=False)
    dt = (time.perf_counter() - t0) * 1000

    detections = []
    for box in results[0].boxes:
        if model.names[int(box.cls[0])] == "person":
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(Detection(
                x1=x1, y1=y1, x2=x2, y2=y2,
                confidence=float(box.conf[0])
            ))

    annotated = results[0].plot()
    _, buf = cv2.imencode(".jpg", annotated)
    b64 = base64.b64encode(buf).decode()

    avg_conf = sum(d.confidence for d in detections) / len(detections) if detections else 0.0

    return DetectResponse(
        count=len(detections),
        detections=detections,
        inference_time_ms=dt,
        avg_confidence=avg_conf,
        annotated_image_b64=b64
    )
from pydantic import BaseModel


class Detection(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float


class DetectResponse(BaseModel):
    count: int
    detections: list[Detection]
    inference_time_ms: float
    avg_confidence: float
    annotated_image_b64: str


class LiveDetection(Detection):
    track_id: int | None = None


class LiveDetectResponse(BaseModel):
    count: int
    detections: list[LiveDetection]
    inference_time_ms: float
    avg_confidence: float
    annotated_image_b64: str
    zone_count: int | None = None
    zone_alert: bool | None = None
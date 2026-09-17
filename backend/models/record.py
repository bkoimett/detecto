from pydantic import BaseModel
from typing import List

class Detection(BaseModel):
    x1: float; y1: float; x2: float; y2: float
    confidence: float

class DetectResponse(BaseModel):
    count: int
    detections: List[Detection]
    inference_time_ms: float
    avg_confidence: float
    annotated_image_b64: str   # base64-encoded JPEG
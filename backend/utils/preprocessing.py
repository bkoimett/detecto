import cv2
import numpy as np

def preprocess_image(image_bytes: bytes, target_size=(640, 640)):
    """
    Convert raw bytes -> OpenCV BGR image, resized + normalized.
    YOLO handles its own normalization, but resizing saves inference time.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    img_resized = cv2.resize(img, target_size)
    return img_resized
from ultralytics import YOLO
import cv2

# load the model with the weights file
model = YOLO("yolov8n.pt")   # 'n' = nano, fastest

# running inference 
results = model("samples/frame2.jpg", conf=0.5)

for r in results:
    for box in r.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        if model.names[cls] == "person":
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            print(f"Person at ({x1:.0f},{y1:.0f})-({x2:.0f},{y2:.0f}) conf={conf:.2f}")

# Draw and save
annotated = results[0].plot()
cv2.imwrite("output.jpg", annotated)
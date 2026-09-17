from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import detect, history

app = FastAPI(title="Detecto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(detect.router, tags=["detection"])
app.include_router(history.router, tags=["history"])

# uvicorn backend.main:app --reload
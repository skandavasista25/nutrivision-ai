import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from app.services import recognition

ALLOWED = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 8 * 1024 * 1024

app = FastAPI(title="NutriVision AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    recognition.load_model()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/recognize")
async def recognize(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(415, "Upload a JPG, PNG or WebP image.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image must be under 8 MB.")
    try:
        Image.open(io.BytesIO(data)).verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "File is not a valid image.")
    try:
        preds = recognition.predict(data)
    except NotImplementedError:
        raise HTTPException(501, "Recognition model not connected yet.")
    return {"predictions": [p.__dict__ for p in preds]}

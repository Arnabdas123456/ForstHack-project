"""FastAPI application factory and router registration.

Defines the global ``app`` instance and includes the
video generation router. Additional middleware and static
mounts are configured for frontend integration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.generate_video import router as generate_router
from app.utils.file_handler import ensure_directories


app = FastAPI(
    title="AI Lofi Generator",
    version="1.0"
)

ensure_directories()

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
        "https://vibeverse-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(generate_router)

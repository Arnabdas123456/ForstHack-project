"""API endpoints related to video generation.

This router handles the POST request that accepts an audio
track and a banner image, analyzes the audio to determine a
mood, and then delegates to the video generation service to
produce a lo-fi style video.  Uploaded files are stored in
configured directories and the resulting video path and
mood are returned in the response.
"""

import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.services.audio_analyzer import analyze_audio
from app.services.video_generator import create_video


router = APIRouter(tags=["Generate"])

SONG_UPLOAD = "uploads/songs"
BANNER_UPLOAD = "uploads/banners"
ALLOWED_SONG_EXTENSIONS = {".mp3"}
ALLOWED_BANNER_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_SONG_CONTENT_TYPES = {"audio/mpeg", "audio/mp3"}
ALLOWED_BANNER_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


def _validate_upload(
    upload: UploadFile,
    allowed_extensions: set[str],
    allowed_content_types: set[str],
    field_name: str,
) -> str:
    filename = os.path.basename(upload.filename or "")
    _, extension = os.path.splitext(filename)
    extension = extension.lower()
    content_type = (upload.content_type or "").lower()

    if not filename or extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} file type. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    if content_type and content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} content type. Allowed: {', '.join(sorted(allowed_content_types))}",
        )

    return filename


@router.post("/generate")
@router.post("/generate-video")
async def generate_video(
    request: Request,
    song: UploadFile = File(...),
    banner: UploadFile = File(...)
):
    """Receive uploads, analyze and produce a video.

    Parameters
    ----------
    song : UploadFile
        The music file uploaded via multipart/form-data.
    banner : UploadFile
        The image file used as the video background.

    Returns
    -------
    dict
        A JSON object containing the detected ``mood`` and the
        ``video_url`` pointing to the generated file.
    """
    song_filename = _validate_upload(
        song,
        ALLOWED_SONG_EXTENSIONS,
        ALLOWED_SONG_CONTENT_TYPES,
        "song",
    )
    banner_filename = _validate_upload(
        banner,
        ALLOWED_BANNER_EXTENSIONS,
        ALLOWED_BANNER_CONTENT_TYPES,
        "banner",
    )

    song_path = os.path.join(SONG_UPLOAD, song_filename)
    banner_path = os.path.join(BANNER_UPLOAD, banner_filename)

    with open(song_path, "wb") as buffer:
        shutil.copyfileobj(song.file, buffer)

    with open(banner_path, "wb") as buffer:
        shutil.copyfileobj(banner.file, buffer)

    mood = analyze_audio(song_path)

    video_path = create_video(song_path, banner_path, mood)

    normalized_video_path = "/" + video_path.replace("\\", "/").lstrip("./")
    banner_url = f"/uploads/banners/{banner_filename}"

    return {
        "mood": mood,
        "video_url": str(request.base_url).rstrip("/") + normalized_video_path,
        "banner_url": str(request.base_url).rstrip("/") + banner_url,
    }

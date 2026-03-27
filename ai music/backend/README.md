# AI Lofi Generator Backend

This repository contains the backend service for the AI Lofi video generator.
It is a small FastAPI application that accepts an audio track and a banner image,
analyses the audio to determine a mood, and then composes a lo-fi styled video
using `moviepy` overlays and filters.

## Requirements

- Python 3.10.11 (or 3.11+) installed on Windows (Linux/macOS should work too)
- A virtual environment (venv) is recommended
- Dependencies are listed in `requirements.txt` (if one exists) or can be
  installed manually from the `pip install` commands below.
- **FFmpeg** is required for video processing (see FFmpeg section below)

## FFmpeg Installation

FFmpeg is essential for video generation and processing in this application.

### Installation

**Windows:**
- Download from: https://github.com/BtbN/FFmpeg-Builds/releases
- Extract and add to PATH, or install via package manager:
  ```powershell
  # Using Chocolatey
  choco install ffmpeg
  # Or using Winget
  winget install FFmpeg.FFmpeg
  ```

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

### Verify Installation

```bash
ffmpeg -version
```

### Basic Usage

FFmpeg is used internally by `moviepy` to encode video files. No direct usage is typically required, as the application handles it automatically. However, to manually convert/encode a video:
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset fast output.mp4
```

## Setup

1. **Create/activate a virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # PowerShell
   # or `.\venv\Scripts\activate` for cmd.exe
   ```

2. **Install dependencies**
   ```powershell
   pip install --upgrade pip
   ```
   *there is a `requirements.txt where i mention library with their version` file, you can instead run:*
   ```powershell
   pip install -r requirements.txt
   ```

3. **Prepare filesystem structure** (performed automatically by the app, but
   you can run manually):
   ```powershell
   python -c "from app.utils import file_handler; file_handler.ensure_directories()"
   ```

4. **Place overlay videos** under `assets/overlays/`. Filenames must match
   theme keys such as `rain.mp4`, `particles.mp4`, etc.

## Running the service

From the project root (`ai music/backend`):

```powershell
# development mode with hot reload
python run.py
```

The API will be available at `http://localhost:8000/docs`.

### Endpoint

- `POST /generate/` – accepts multipart form data:
  - `song` (audio file)
  - `banner` (image file)

Returns JSON:
```json
{
  "mood": "chill",
  "video_url": "outputs/videos/<uuid>.mp4"
}
```

## Notes

- The memory/cpu heavy operations may require adequate hardware.
- Output video files are written to `outputs/videos/`.
- Logs are printed to the console by each module.

Feel free to extend or modify the service to suit your needs!
import uuid
import subprocess
from app.services.theme_engine import get_visual_theme


def create_video(song_path, banner_path, mood):

    print("\n========== VIDEO GENERATION START ==========")

    # get theme
    theme = get_visual_theme(mood)

    overlay = theme["overlay"]
    color = theme["color_filter"]

    print("Detected Mood:", mood)
    print("Selected Theme:", theme)
    print("Overlay:", overlay)
    print("Color Filter:", color)

    output = f"outputs/videos/{uuid.uuid4()}.mp4"
    overlay_path = f"assets/overlays/{overlay}.mp4"

    # video settings
    fps = 12
    width = 854
    height = 480

    print("Resolution:", f"{width}x{height}")
    print("FPS:", fps)

    # color filter mapping
    color_filters = {
        "cool": "eq=brightness=-0.02:saturation=0.9",
        "warm": "eq=brightness=0.05:saturation=1.1",
        "bright": "eq=brightness=0.08:saturation=1.2",
        "dark": "eq=brightness=-0.08:saturation=0.9",
        "vivid": "eq=saturation=1.5",
        "pink": "eq=saturation=1.2",
        "purple": "eq=saturation=1.15",
        "green": "eq=saturation=1.05",
        "aqua": "eq=saturation=1.08",
        "galaxy": "eq=saturation=1.25",
        "deep_blue": "eq=brightness=-0.03:saturation=1.1"
    }

    color_filter = color_filters.get(color, "")

    print("FFmpeg Color Filter:", color_filter)

    # FFmpeg command
    command = [
        "ffmpeg",
        "-y",

        "-loop", "1",
        "-i", banner_path,

        "-i", song_path,

        "-stream_loop", "-1",
        "-i", overlay_path,

        "-filter_complex",
        f"[0:v]{color_filter},scale={width}:{height}[bg];"
        f"[2:v]scale={width}:{height},format=rgba,colorchannelmixer=aa=0.4[ov];"
        "[bg][ov]overlay=0:0:shortest=1",

        "-map", "1:a",

        "-r", str(fps),

        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "stillimage",

        "-c:a", "aac",

        "-shortest",

        output
    ]

    print("\nRunning FFmpeg command...")
    print(" ".join(command))

    try:
        subprocess.run(command, check=True)
        print("\nVideo successfully generated!")
        print("Output File:", output)

    except subprocess.CalledProcessError as e:
        print("FFmpeg Error:", e)

    print("=========== VIDEO GENERATION END ===========\n")

    return output
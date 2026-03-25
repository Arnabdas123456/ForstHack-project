import librosa
import numpy as np


def analyze_audio(song_path):

    print(f"Analyzing audio file: {song_path}")

    y, sr = librosa.load(song_path)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

    energy = np.mean(np.abs(y))

    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))

    print("\nAudio Analysis Result")
    print("----------------------")
    print("Tempo:", tempo)
    print("Energy:", energy)
    print("Spectral Brightness:", spectral_centroid)

    # mood detection
    if tempo < 60:
        mood = "sleep"

    elif tempo < 80 and energy < 0.08:
        mood = "relax"

    elif tempo < 95:
        mood = "chill"

    elif tempo < 110 and spectral_centroid < 2000:
        mood = "romantic"

    elif tempo < 120:
        mood = "happy"

    elif energy > 0.25:
        mood = "party"

    else:
        mood = "lofi"

    print("Detected Mood:", mood)

    return mood
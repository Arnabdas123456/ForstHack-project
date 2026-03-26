import librosa
import numpy as np
import scipy.signal


def _estimate_tempo(y: np.ndarray, sr: int) -> float:
    """Estimate tempo robustly across SciPy/librosa version mismatches."""
    # Older librosa versions call scipy.signal.hann, which moved to scipy.signal.windows.hann.
    if not hasattr(scipy.signal, "hann") and hasattr(scipy.signal, "windows"):
        scipy.signal.hann = scipy.signal.windows.hann

    try:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        return float(np.squeeze(tempo))
    except Exception:
        # Fallback path to avoid hard failures in API requests.
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo = librosa.feature.tempo(onset_envelope=onset_env, sr=sr)
        return float(np.squeeze(tempo))


def analyze_audio(song_path):

    print(f"Analyzing audio file: {song_path}")

    y, sr = librosa.load(song_path)

    tempo = _estimate_tempo(y, sr)

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

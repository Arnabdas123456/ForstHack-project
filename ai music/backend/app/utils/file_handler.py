"""Utility functions for filesystem management.

This module is responsible for creating any required
folders used by the application, such as upload and output
locations.  It is intended to be invoked during startup
or before handling file operations.
"""

import os


def ensure_directories():
    """Create the necessary directories if they do not exist.

    The application expects the following directory structure:

    - ``uploads/songs`` – where incoming audio files are saved
    - ``uploads/banners`` – where banner images are saved
    - ``outputs/videos`` – where generated videos are written

    Directories are created with ``exist_ok=True`` so this
    function can be called repeatedly safely.
    """
    folders = [
        "uploads/songs",
        "uploads/banners",
        "outputs/videos"
    ]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
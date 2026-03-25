"""Entry point for the AI Lofi Generator backend.

This script launches the FastAPI application using an
embedded Uvicorn server when executed directly. It is
primarily used during development for hot-reloading.
"""

import uvicorn


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
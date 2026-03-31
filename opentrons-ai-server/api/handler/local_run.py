# run.py
import os

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Keep-alive must be at least as long as request_timeout_seconds (default 300) so streaming is not cut off.
    timeout_keep_alive = int(os.getenv("UVICORN_TIMEOUT_KEEP_ALIVE", "310"))
    uvicorn.run(
        "api.handler.fast:app",
        host="localhost",
        port=port,
        timeout_keep_alive=timeout_keep_alive,
        reload=True,
        log_config=None,
    )

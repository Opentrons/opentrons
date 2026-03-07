# run.py
import os

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "api.handler.fast:app",
        host="localhost",
        port=port,
        timeout_keep_alive=190,
        reload=True,
        log_config=None,
    )

# run.py
import uvicorn

from api.handler.logging_config import setup_logging

setup_logging()

if __name__ == "__main__":
    uvicorn.run("api.handler.fast:app", host="localhost", port=8000, timeout_keep_alive=190, reload=True)

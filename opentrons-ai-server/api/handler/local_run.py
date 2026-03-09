# run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.handler.fast:app",
        host="localhost",
        port=8000,
        timeout_keep_alive=190,
        reload=True,
        log_config=None,
    )

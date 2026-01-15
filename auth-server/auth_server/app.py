"""The public export of the server's ASGI app object."""

from fastapi import FastAPI

app = FastAPI()


# todo(mm, 2026-01-15): Remove this placeholder when this server has any real endpoint.
@app.get("/auth/hello")
def get_hello() -> str:  # noqa: D103
    return "Hello, world."

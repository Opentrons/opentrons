"""Machinery for returning this server's HTTP error responses."""

import fastapi
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorBody(BaseModel):
    """The body of most of this server's error responses.

    `error` is a stable machine-readable code. `message` is for humans and may
    change between releases.
    """

    error: str
    message: str


class MessageBody(BaseModel):
    """The body of error responses that only carry a human-readable message."""

    message: str


class APIError(Exception):
    """An endpoint can raise this to return an HTTP error with an arbitrary JSON body."""

    def __init__(self, status_code: int, body: BaseModel) -> None:
        super().__init__(f"HTTP {status_code}: {body}")
        self.status_code = status_code
        self.body = body


def handle_api_error(request: object, error: APIError) -> JSONResponse:
    """Turn `APIError` exceptions into HTTP responses.

    This should be installed as a global FastAPI exception handler.
    """
    return JSONResponse(
        status_code=error.status_code,
        content=error.body.model_dump(by_alias=True),
    )


def install_api_error_handler(app: fastapi.FastAPI) -> None:
    """Configure `app` to turn `APIError` exceptions into HTTP responses."""
    app.exception_handler(APIError)(handle_api_error)

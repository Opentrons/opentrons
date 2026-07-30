from fastapi.responses import JSONResponse
from pydantic import BaseModel


class APIError(Exception):
    """An endpoint can raise this to return an HTTP error with an arbitrary JSON body.

    todo(mm, 2026-06-24): Unify this with robot-server's ApiError.
    """

    def __init__(self, status_code: int, body: BaseModel) -> None:
        self.status_code = status_code
        self.body = body


def handle_api_error(request: object, error: APIError) -> JSONResponse:
    """Catch an APIError and turn it into an HTTP response.

    This should be installed as a global FastAPI exception handler.
    """
    return JSONResponse(
        status_code=error.status_code,
        content=error.body.model_dump(by_alias=True),
    )

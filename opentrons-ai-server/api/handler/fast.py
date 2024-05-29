import asyncio
import logging
from typing import Any, Literal, Union

from fastapi import FastAPI, HTTPException, Query, Request, Security, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, conint
from starlette.middleware.base import BaseHTTPMiddleware

from api.domain.openai_predict import OpenAIPredict
from api.integration.auth import VerifyToken
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse
from api.models.empty_request_error import EmptyRequestError
from api.models.internal_server_error import InternalServerError
from api.settings import Settings, get_settings

# Actual routes we handle
CHAT_COMPLETION_ROUTE: str = "/api/chat/completion"
HEALTH_ROUTE: str = "/api/health"
LB_HEALTH_ROUTE: str = "/health"
# CORS and PREFLIGHT settings
# ALLOWED_ORIGINS is now an environment variable
ALLOWED_CREDENTIALS: bool = True
ALLOWED_METHODS: str = "GET,POST,OPTIONS"
ALLOWED_HEADERS: str = "content-type,authorization,origin,accept"
ALLOWED_ACCESS_CONTROL_EXPOSE_HEADERS: str = "content-type"
ALLOWED_ACCESS_CONTROL_MAX_AGE: str = "600"

settings: Settings = get_settings()
openai: OpenAIPredict = OpenAIPredict(settings=settings)
auth = VerifyToken()

# Initialize FastAPI app with metadata
app = FastAPI(
    title="Opentrons AI API",
    description="An API for generating chat responses.",
    version=settings.dd_version,
    openapi_url="/api/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=ALLOWED_CREDENTIALS,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
)


# Add Timeout middleware
class TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, timeout_s: int) -> None:
        super().__init__(app)
        self.timeout_s = timeout_s

    async def dispatch(self, request: Request, call_next: Any) -> JSONResponse | Any:
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout_s)
        except asyncio.TimeoutError:
            return JSONResponse({"detail": "API Request timed out"}, status_code=504)


# 1 second before the uvicorn timeout (178 seconds)
# 2 seconds before the CloudFront timeout (180 seconds)
# 23 seconds before the ALB timeout (200 seconds)
app.add_middleware(TimeoutMiddleware, timeout_s=177)

# Configure logging
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


# Models
class Status(BaseModel):
    status: Literal["ok", "error"]
    version: str


class ErrorResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: Status


class TimeoutResponse(BaseModel):
    message: str


class CorsHeadersResponse(BaseModel):
    Access_Control_Allow_Origin: str
    Access_Control_Allow_Methods: str
    Access_Control_Allow_Headers: str
    Access_Control_Expose_Headers: str
    Access_Control_Max_Age: str


# Endpoint functions
@app.post(
    CHAT_COMPLETION_ROUTE,
    response_model=Union[ChatResponse, ErrorResponse],
    summary="Create Chat Completion",
    description="Generate a chat response based on the provided message.",
)
async def create_chat_completion(
    body: ChatRequest, auth_result: Any = Security(auth.verify)  # noqa: B008
) -> Union[ChatResponse, ErrorResponse]:  # noqa: B008
    """
    Generate a chat completion response using OpenAI.

    - **request**: The HTTP request containing the chat message.
    - **returns**: A chat response or an error message.
    """
    logger.info(f"POST {CHAT_COMPLETION_ROUTE}", extra={"body": body.model_dump(), "auth_result": auth_result})
    try:
        if not body.message or body.message == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=EmptyRequestError(message="Request body is empty").model_dump()
            )

        if body.fake:
            return ChatResponse(reply="Fake response", fake=body.fake)
        response: Union[str, None] = openai.predict(prompt=body.message, chat_completion_message_params=body.history)

        if response is None or response == "":
            return ChatResponse(reply="No response was generated", fake=body.fake)

        return ChatResponse(reply=response, fake=body.fake)

    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=InternalServerError(exception_object=e).model_dump()
        ) from e


@app.get(
    LB_HEALTH_ROUTE,
    response_model=Status,
    summary="LB Health Check",
    description="Check the health and version of the API.",
    include_in_schema=False,
)
@app.get(HEALTH_ROUTE, response_model=Status, summary="Health Check", description="Check the health and version of the API.")
async def get_health(request: Request) -> Status:
    """
    Perform a health check of the API.

    - **returns**: A Status containing the version of the API.
    """
    logger.info(f"{request.method} {request.url.path}")
    return Status(status="ok", version=settings.dd_version)


@app.get("/api/timeout", response_model=TimeoutResponse)
async def timeout_endpoint(request: Request, seconds: conint(ge=1, le=300) = Query(..., description="Number of seconds to wait")):  # type: ignore # noqa: B008
    """
    Wait for the specified number of seconds and then respond.

    - **seconds**: The number of seconds to wait (between 1 and 300).
    """
    # call me with http://localhost:8000/api/timeout?seconds=180
    logger.info(f"{request.method} {request.url.path}")
    try:
        await asyncio.sleep(seconds)  # Asynchronously wait for the specified time
        return TimeoutResponse(message=f"Waited for {seconds} seconds")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/redoc", include_in_schema=False)
async def redoc_html() -> HTMLResponse:
    return get_redoc_html(openapi_url="/api/openapi.json", title="Opentrons API Documentation")


@app.get("/api/doc", include_in_schema=False)
async def swagger_html() -> HTMLResponse:
    return get_swagger_ui_html(openapi_url="/api/openapi.json", title="Opentrons API Documentation")


@app.options(
    "/{path:path}", response_model=CorsHeadersResponse, summary="CORS Preflight Request", description="Handle CORS preflight requests."
)
async def handle_options(request: Request) -> CorsHeadersResponse:
    """
    Handle CORS preflight requests.

    This endpoint responds to CORS preflight requests with the appropriate headers.

    - **returns**: CORS headers.
    """
    logger.info(f"{request.method} {request.url.path}")
    return CorsHeadersResponse(
        Access_Control_Allow_Origin=settings.allowed_origins,
        Access_Control_Allow_Methods=ALLOWED_METHODS,
        Access_Control_Allow_Headers=ALLOWED_HEADERS,
        Access_Control_Expose_Headers=ALLOWED_ACCESS_CONTROL_EXPOSE_HEADERS,
        Access_Control_Max_Age=ALLOWED_ACCESS_CONTROL_MAX_AGE,
    )


# Custom 404 handler
@app.exception_handler(status.HTTP_404_NOT_FOUND)
async def not_found_handler(request: Request, exc: Exception | None = None) -> JSONResponse:
    """
    Handle 404 errors.

    - **request**: The HTTP request that caused the error.
    - **exc**: The exception that was raised.
    - **returns**: A JSON response with a 404 status code.
    """
    route = request.url.path
    logger.warning(f"Route not found: {route}")
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message": "Route not found", "route": route})


# General exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation errors.

    - **request**: The HTTP request that caused the error.
    - **exc**: The validation exception that was raised.
    - **returns**: A JSON response with a 422 status code and error details.
    """
    logger.error(f"Validation error for route {request.url.path}: {exc}")
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Validation error", "details": exc.errors()})


# Catch-all handler for any other uncaught exceptions
@app.middleware("http")
async def catch_all_exceptions(request: Request, call_next: Any) -> JSONResponse | Any:
    """
    Catch all uncaught exceptions.

    - **request**: The HTTP request that caused the error.
    - **call_next**: The next middleware or route handler.
    - **returns**: A JSON response with a 500 status code if an exception is raised.
    """
    try:
        response = await call_next(request)
        if response.status_code == status.HTTP_404_NOT_FOUND:
            return await not_found_handler(request, None)
        return response
    except Exception as exc:
        logger.error(f"Unhandled error for route {request.url.path}: {exc}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    app.debug = True
    uvicorn.run(app, host="localhost", port=8000, timeout_keep_alive=178)

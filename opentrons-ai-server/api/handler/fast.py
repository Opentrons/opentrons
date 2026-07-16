import asyncio
import json
import os
import time
from typing import Annotated, Any, Awaitable, Callable, Dict, List, Literal, Optional, Union, cast

import anthropic
import structlog
from anthropic.types import MessageParam
from asgi_correlation_id import CorrelationIdMiddleware
from asgi_correlation_id.context import correlation_id
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Query, Request, Response, Security, UploadFile, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field, conint
from starlette.middleware.base import BaseHTTPMiddleware
from uvicorn.protocols.utils import get_path_with_query_string

from api.domain.anthropic_predict import AnthropicPredict, get_tracing_context, setup_weave_analytics
from api.domain.fake_responses import FakeResponse, get_fake_response
from api.domain.openai_predict import OpenAIPredict
from api.handler.custom_logging import setup_logging
from api.handler.utils_fast import (
    extract_message_index_from_filename,
    parse_tagged_content,
    process_single_multipart_file,
    reconstruct_conversation_history,
)
from api.integration.auth import VerifyToken
from api.integration.google_sheets import GoogleSheetsClient
from api.models.chat_request import ChatRequest
from api.models.chat_response import ChatResponse
from api.models.create_protocol import CreateProtocol
from api.models.empty_request_error import EmptyRequestError
from api.models.error_response import ErrorResponse
from api.models.feedback_request import FeedbackRequest
from api.models.feedback_response import FeedbackResponse
from api.models.internal_server_error import InternalServerError
from api.models.protocol_format import ProtocolFormat
from api.models.timeout_error import TimeoutError as TimeoutErrorResponse
from api.models.update_protocol import UpdateProtocol
from api.models.user import User
from api.services.file_processor import FileProcessor
from api.settings import Settings, get_settings
settings: Settings = get_settings()
setup_logging(json_logs=settings.json_logging, log_level=settings.log_level.upper())

access_logger = structlog.stdlib.get_logger("api.access")
logger = structlog.stdlib.get_logger(settings.logger_name)

auth: VerifyToken = VerifyToken()
openai: OpenAIPredict = OpenAIPredict(settings)
google_sheets_client = GoogleSheetsClient(settings)
claude: AnthropicPredict = AnthropicPredict(settings)

# Initialize FastAPI app with metadata
app = FastAPI(
    title="Opentrons AI API",
    description="An API for generating chat responses.",
    version=os.getenv("SERVICE_VERSION", "local"),
    openapi_url="/api/openapi.json",
)

# CORS and PREFLIGHT settings
# ALLOWED_ORIGINS is now an environment variable
ALLOWED_CREDENTIALS: bool = True
ALLOWED_METHODS: List[str] = ["GET", "POST", "OPTIONS"]
ALLOWED_HEADERS: List[str] = ["content-type", "authorization", "origin", "accept", "x-enable-analytics"]
ALLOWED_ACCESS_CONTROL_EXPOSE_HEADERS: List[str] = ["content-type"]
ALLOWED_ACCESS_CONTROL_MAX_AGE: str = "600"

# Add CORS middleware. Parse comma-separated origins.
_cors_origins: List[str] = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
if not _cors_origins:
    raise ValueError("allowed_origins setting is empty")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
            body = TimeoutErrorResponse(
                detail="The request took too long to complete and was cancelled.",
                message=("Your request exceeded 3 minutes. Please simplify your request and try again."),
                timeout_seconds=self.timeout_s,
            )
            return JSONResponse(body.model_dump(by_alias=True), status_code=504)


# Request timeout in seconds. Set via settings.request_timeout_seconds.
# Kept below CloudFront/ALB (e.g. 180s) so we return a clear 504 and message.
app.add_middleware(TimeoutMiddleware, timeout_s=int(settings.request_timeout_seconds))


@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
    structlog.contextvars.clear_contextvars()
    # These context vars will be added to all log entries emitted during the request
    request_id = correlation_id.get()
    structlog.contextvars.bind_contextvars(request_id=request_id)

    start_time = time.perf_counter_ns()
    # If the call_next raises an error, we still want to return our own 500 response,
    # so we can add headers to it (process time, request ID...)
    response = Response(status_code=500)
    try:
        response = await call_next(request)
    except Exception:
        structlog.stdlib.get_logger("api.error").exception("Uncaught exception")
        raise
    finally:
        process_time = time.perf_counter_ns() - start_time
        status_code = response.status_code
        url = get_path_with_query_string(request.scope)  # type: ignore[arg-type]
        client_host = request.client.host if request.client and request.client.host else "unknown"
        client_port = request.client.port if request.client and request.client.port else "unknown"
        http_method = request.method if request.method else "unknown"
        http_version = request.scope["http_version"]
        # Skip access log for health checks to avoid spam from load balancers in deployed environments
        if request.url.path not in ("/health", "/api/health"):
            access_logger.info(
                f"""{client_host}:{client_port} - "{http_method} {url} HTTP/{http_version}" {status_code}""",
                http={
                    "url": str(request.url),
                    "status_code": status_code,
                    "method": http_method,
                    "request_id": request_id,
                    "version": http_version,
                },
                network={"client": {"ip": client_host, "port": client_port}},
                duration=process_time,
            )
        response.headers["X-Process-Time"] = str(process_time / 10**9)
    return response


# This middleware must be placed after the logging, to populate the context with the request ID
# NOTE: Why last??
# Answer: middlewares are applied in the reverse order of when they are added (you can verify this
# by debugging `app.middleware_stack` and recursively drilling down the `app` property).
app.add_middleware(CorrelationIdMiddleware)


# Models
class Status(BaseModel):
    status: Literal["ok", "error"]
    version: str


class HealthResponse(BaseModel):
    status: Status


class TimeoutResponse(BaseModel):
    message: str


class CorsHeadersResponse(BaseModel):
    Access_Control_Allow_Origin: List[str] | str = Field(alias="Access-Control-Allow-Origin")
    Access_Control_Allow_Methods: List[str] | str = Field(alias="Access-Control-Allow-Methods")
    Access_Control_Allow_Headers: List[str] | str = Field(alias="Access-Control-Allow-Headers")
    Access_Control_Expose_Headers: List[str] | str = Field(alias="Access-Control-Expose-Headers")
    Access_Control_Max_Age: str = Field(alias="Access-Control-Max-Age")


def _extract_anthropic_error_message(exc: anthropic.APIError) -> str:
    """Pull the human-readable message out of an Anthropic error."""
    try:
        body = getattr(exc, "body", None)
        if isinstance(body, dict):
            error_detail = body.get("error", {})
            if isinstance(error_detail, dict) and "message" in error_detail:
                return str(error_detail["message"])
    except Exception:
        pass
    return str(exc)


def _anthropic_error_to_json_response(exc: anthropic.APIError) -> JSONResponse:
    """Convert any Anthropic SDK error into a safe, serializable JSONResponse."""
    message = _extract_anthropic_error_message(exc)
    error_type = type(exc).__name__

    if isinstance(exc, anthropic.BadRequestError):
        http_status = status.HTTP_400_BAD_REQUEST
        if "too long" in message.lower() or "maximum" in message.lower():
            error_type = "context_length_exceeded"
    elif isinstance(exc, anthropic.RateLimitError):
        http_status = status.HTTP_429_TOO_MANY_REQUESTS
    elif isinstance(exc, anthropic.APITimeoutError):
        http_status = status.HTTP_504_GATEWAY_TIMEOUT
    elif isinstance(exc, anthropic.APIConnectionError):
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, anthropic.APIStatusError):
        http_status = status.HTTP_502_BAD_GATEWAY
    else:
        http_status = status.HTTP_500_INTERNAL_SERVER_ERROR

    body = ErrorResponse(message=message, error_type=error_type)
    return JSONResponse(body.model_dump(by_alias=True), status_code=http_status)


def _validate_request(data: Any, field_name: str) -> None:
    """Generic request validation for empty fields."""
    value = getattr(data, field_name, None)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=EmptyRequestError(message=f"{field_name} is empty").model_dump(by_alias=True),
        )


def _get_analytics_preference(request: Request) -> bool:
    """Get analytics preference from request headers."""
    analytics_header = request.headers.get("x-enable-analytics", "true").lower()
    return analytics_header == "true"


def _handle_fake_response(fake: bool, fake_key: Optional[str] = None) -> Optional[ChatResponse]:
    """Handle fake responses with optional fake_key."""
    if fake_key is not None:
        fake_response: FakeResponse = get_fake_response(fake_key)
        return ChatResponse(
            reply=fake_response.chat_response.reply,
            fake=fake_response.chat_response.fake,
            protocol_content=fake_response.chat_response.protocol_content,
        )

    if fake:
        return ChatResponse(reply="Default fake response", fake=True)

    return None


async def _generate_llm_response_with_history(
    model_type: str,
    user_id: str,
    prompt: str,
    enable_analytics: bool,
    history_with_attachments: Optional[List[Dict[str, Any]]] = None,
    protocol_format: Optional[ProtocolFormat] = None,
    protocol_action: Optional[str] = None,
    current_msg_files: Optional[List[Dict[str, str]]] = None,
) -> Optional[str]:
    """Generate a response from the appropriate LLM with proper history handling."""
    # Wrap all LLM calls with the appropriate tracing context
    with get_tracing_context(enable_analytics):
        if "openai" in model_type.lower():
            # For OpenAI, we'll need to convert the history format
            # This is a simplified version - OpenAI handling would need more work
            # Cast to expected type since the structure should be compatible
            openai_history = cast(Optional[List[Any]], history_with_attachments)
            return openai.predict(prompt=prompt, chat_completion_message_params=openai_history)

        # Claude models - convert history to proper message format
        converted_history = []
        if history_with_attachments:
            for msg in history_with_attachments:
                converted_history.append({"role": msg["role"], "content": msg["content"]})

        # Use existing Claude logic with all files
        if protocol_format == ProtocolFormat.PROTOCOL_DESIGNER:
            return await claude.create_pd(user_id=user_id, prompt=prompt, history=cast(Optional[List[MessageParam]], converted_history))

        # For regular chat, use the new history-aware method or fallback to create
        if protocol_action == "create":
            return await claude.create(user_id=user_id, prompt=prompt, history=cast(Optional[List[MessageParam]], converted_history))
        else:
            return await claude.process_chat_with_attachments(
                user_id=user_id,
                prompt=prompt,
                history_with_attachments=history_with_attachments,
                message_type="update",
                current_msg_files=current_msg_files,
            )


async def _generate_llm_response(
    model_type: str,
    user_id: str,
    prompt: str,
    enable_analytics: bool,
    history: Optional[List[Any]] = None,
    protocol_format: Optional[ProtocolFormat] = None,
    protocol_action: Optional[str] = None,
    file_references: Optional[List[Dict[str, str]]] = None,
) -> Optional[str]:
    """Generate a response from the appropriate LLM based on context."""
    # Wrap all LLM calls with the appropriate tracing context
    with get_tracing_context(enable_analytics):
        if "openai" in model_type.lower():
            return openai.predict(prompt=prompt, chat_completion_message_params=history)

        # Claude models
        if protocol_format == ProtocolFormat.PROTOCOL_DESIGNER:
            return await claude.create_pd(user_id=user_id, prompt=prompt, history=cast(Optional[List[MessageParam]], history))

        # For regular chat, we use the process_message method directly with file references
        if file_references and protocol_action != "create":
            return await claude.process_message(
                user_id=user_id,
                prompt=prompt,
                history=cast(Optional[List[MessageParam]], history),
                message_type="update",
                file_references=file_references,
            )

        if protocol_action == "create":
            return await claude.create(user_id=user_id, prompt=prompt, history=cast(Optional[List[MessageParam]], history))

        # Default to update for chat completion and update_protocol
        return await claude.update(user_id=user_id, prompt=prompt, history=cast(Optional[List[MessageParam]], history))


def _format_response(
    response: Optional[str], protocol_format: Optional[ProtocolFormat], is_fake: bool, file_token_warning: Optional[str] = None
) -> ChatResponse:
    """Format the LLM response according to the protocol format."""
    if response is None or response == "":
        return ChatResponse(reply="No response was generated, please try again.", fake=bool(is_fake), file_token_warning=file_token_warning)

    if protocol_format == ProtocolFormat.PROTOCOL_DESIGNER:
        logger.debug("Formatting response for Protocol Designer")
        _, pd_json_content, comments = parse_tagged_content(response)
        try:
            # Case 1: No PD JSON content, but comments are present.
            if pd_json_content is None and comments is not None:
                return ChatResponse(reply=comments, fake=bool(is_fake), file_token_warning=file_token_warning)

            # Case 2: PD JSON content is present (comments may or may not be).
            elif pd_json_content is not None:
                pd_content_str = claude.fillup_pd(pd_json_content)
                parsed_protocol_json = json.loads(pd_content_str)  # Can raise JSONDecodeError

                reply_text = comments if comments is not None else ""  # Avoid literal "None"
                return ChatResponse(
                    reply=reply_text, fake=bool(is_fake), protocol_content=parsed_protocol_json, file_token_warning=file_token_warning
                )

            # Case 3: No PD JSON content AND no comments.
            else:
                logger.info(
                    "Formatting PD response: No PD_JSON and no comments found in LLM output.",
                    extra={"llm_response_preview": str(response)[:250] if response else "None"},
                )
                return ChatResponse(
                    reply="""The AI's response did not contain a parsable protocol or any specific
                    comments. Please try rephrasing your request.""",
                    fake=bool(is_fake),
                    file_token_warning=file_token_warning,
                )

        except json.JSONDecodeError as e:
            logger.error(
                f"JSON parsing error: {str(e)}",
                extra={"pd_json_content_preview": str(pd_json_content)[:250] if pd_json_content else "None", "comments": comments},
            )
            if comments:
                error_message = f"\nComments: {comments}"
            else:
                error_message = "Failed to generate a protocol. Please try again."

            return ChatResponse(reply=error_message, fake=bool(is_fake), file_token_warning=file_token_warning)

        except Exception as e:
            logger.error(
                f"Error processing PD content: {str(e)}",
                extra={"pd_json_content_preview": str(pd_json_content)[:250] if pd_json_content else "None", "comments": comments},
                exc_info=True,
            )
            if comments:
                error_message = f"\nComments: {comments}"
            else:
                error_message = "An unexpected error occurred while preparing the protocol. Please try again."
            return ChatResponse(reply=error_message, fake=bool(is_fake), file_token_warning=file_token_warning)

    return ChatResponse(reply=response, fake=bool(is_fake), file_token_warning=file_token_warning)


@app.post(
    "/api/chat/completion",
    response_model=Union[ChatResponse, ErrorResponse],
    response_model_by_alias=True,
    summary="Create Chat Completion",
    description="Generate a chat response based on the provided prompt.",
)
async def create_chat_completion(
    body: ChatRequest, user: Annotated[User, Security(auth.verify)], request: Request
) -> Union[ChatResponse, ErrorResponse]:  # noqa: B008
    """
    Generate a chat completion response using LLM.

    - **request**: The HTTP request containing the chat message.
    - **returns**: A chat response or an error message.
    """
    logger.info("POST /api/chat/completion")
    try:
        # Setup Weave analytics based on frontend preference
        enable_analytics = _get_analytics_preference(request)
        setup_weave_analytics(enable_analytics)

        _validate_request(body, "message")

        fake_response = _handle_fake_response(body.fake, getattr(body, "fake_key", None))
        if fake_response:
            return fake_response

        protocol_format = getattr(body, "protocol_format", ProtocolFormat.PYTHON)
        protocol_action = _determine_protocol_action(body)

        # Convert history format - extract files from messages and handle new attachments
        history_with_attachments = []
        if body.history:
            for msg in body.history:
                # Handle both old format (dict with role/content) and new format (with attachments)
                if isinstance(msg, dict):
                    history_msg = {
                        "role": msg.get("role", ""),
                        "content": msg.get("content", ""),
                        "attachments": msg.get("attachments", []),
                    }
                    history_with_attachments.append(history_msg)

        response = await _generate_llm_response_with_history(
            model_type=settings.model,
            user_id=str(user.sub),
            prompt=body.message,
            enable_analytics=enable_analytics,
            history_with_attachments=history_with_attachments,
            protocol_format=protocol_format,
            protocol_action=protocol_action,
            current_msg_files=[],
        )
        return _format_response(response, protocol_format, bool(body.fake))

    except anthropic.APIError:
        raise
    except Exception as e:
        logger.exception("Error processing chat completion")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=InternalServerError(exception_object=e).model_dump(by_alias=True)
        ) from e


@app.post(
    "/api/chat/completion-multipart",
    response_model=Union[ChatResponse, ErrorResponse],
    response_model_by_alias=True,
    summary="Create Chat Completion with File Uploads",
    description="Generate a chat response with multipart file uploads (more efficient than base64).",
)
async def create_chat_completion_multipart(
    request: Request,  # FastAPI auto-injects this
    user: Annotated[User, Security(auth.verify)],
    message: str = Form(..., description="The chat message"),
    history: str = Form(default="[]", description="Chat history as JSON string with attachments"),
    fake: bool = Form(default=False, description="Whether this is a fake request for testing"),
    protocol_format: str = Form(default="python", description="Protocol format"),
    files: List[UploadFile] = File(default=[]),  # noqa: B008
) -> Union[ChatResponse, ErrorResponse]:
    """
    Generate a chat completion response using multipart/form-data for file uploads.
    This is more efficient than base64 encoding for binary files like PDFs.
    """
    logger.info("POST /api/chat/completion-multipart", extra={"num_files": len(files)})
    try:
        # Setup Weave analytics based on frontend preference
        enable_analytics = _get_analytics_preference(request) if request else False
        setup_weave_analytics(enable_analytics)

        # Parse history from JSON string (now includes attachments in each message)

        try:
            parsed_history_with_attachments = json.loads(history) if history else []
        except json.JSONDecodeError:
            parsed_history_with_attachments = []

        # Process uploaded files with message mapping
        files_by_message, token_warning = await _process_multipart_files_with_mapping(files)

        # Reconstruct conversation history with file content
        history_with_attachments = reconstruct_conversation_history(parsed_history_with_attachments, files_by_message)

        # Get current message files. history_with_attachments contains messages without current message
        # The files for current message are in files_by_message[N]. 0 to N-1 are the previous messages.
        # N is the current message index.
        # For example, when history_with_attachments=[], files_by_message={0: [file1, file2]}.
        current_msg_idx = len(history_with_attachments)
        current_msg_files = files_by_message.get(current_msg_idx, [])

        protocol_format_enum = ProtocolFormat.PYTHON
        if protocol_format.lower() == "protocol_designer":
            protocol_format_enum = ProtocolFormat.PROTOCOL_DESIGNER

        response = await _generate_llm_response_with_history(
            model_type=settings.model,
            user_id=str(user.sub),
            prompt=message,
            enable_analytics=enable_analytics,
            history_with_attachments=history_with_attachments,
            protocol_format=protocol_format_enum,
            protocol_action="update",
            current_msg_files=current_msg_files,
        )
        return _format_response(response, protocol_format_enum, fake, token_warning)

    except anthropic.APIError:
        raise
    except Exception as e:
        logger.exception("Error processing multipart chat completion")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=InternalServerError(exception_object=e).model_dump(by_alias=True)
        ) from e


async def _process_multipart_files_with_mapping(files: List[UploadFile]) -> tuple[Dict[int, List[Dict[str, str]]], Optional[str]]:
    """Process uploaded files and group them by message index."""
    if not files or not any(f.filename for f in files):
        return {}, None

    files_by_message: Dict[int, List[Dict[str, str]]] = {}

    for file in files:
        if not file.filename:
            continue

        message_index, original_filename = extract_message_index_from_filename(file.filename)

        # Initialize message group if needed
        if message_index not in files_by_message:
            files_by_message[message_index] = []

        try:
            file_count = len(files_by_message[message_index])
            file_ref = await process_single_multipart_file(file, message_index, file_count)
            file_ref["name"] = original_filename  # Use extracted original filename
            files_by_message[message_index].append(file_ref)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    # Check token count for all files
    all_files = [file for file_list in files_by_message.values() for file in file_list]
    token_warning = None
    if all_files:
        token_warning = await asyncio.to_thread(
            FileProcessor.check_files_token_warning,
            all_files,
            claude._sync_client,
            settings.anthropic_model_name,
        )

    return files_by_message, token_warning


def _determine_protocol_action(body: ChatRequest) -> str:
    """Determine protocol action based on message content."""
    # Default action is update
    protocol_action = "update"

    # Check if first history message indicates a create action
    if body.history:
        message = body.history[0]
        if isinstance(message, dict) and message.get("content") is not None:
            first_message_content = str(message["content"])
            if "Write a protocol using" in first_message_content:
                protocol_action = "create"

    return protocol_action


@app.post(
    "/api/chat/create-protocol",
    response_model=Union[ChatResponse, ErrorResponse],
    response_model_by_alias=True,
    summary="Creates protocol",
    description="Generate a chat response based on the provided prompt that will create a new protocol with the required changes.",
)
async def create_protocol(
    body: CreateProtocol, user: Annotated[User, Security(auth.verify)], request: Request
) -> Union[ChatResponse, ErrorResponse]:  # noqa: B008
    """
    Generate an updated protocol using LLM.

    - **request**: The HTTP request containing the chat message.
    - **returns**: A chat response or an error message.
    """
    logger.info("POST /api/chat/create-protocol")
    try:
        # Setup Weave analytics based on frontend preference
        enable_analytics = _get_analytics_preference(request)
        setup_weave_analytics(enable_analytics)

        _validate_request(body, "prompt")

        fake_response = _handle_fake_response(bool(body.fake), body.fake_key)
        if fake_response:
            return fake_response

        protocol_format = body.protocol_format
        logger.debug(f"Received protocol_format: {protocol_format.value}")

        response = await _generate_llm_response(
            model_type=settings.model,
            user_id=str(user.sub),
            prompt=body.prompt,
            enable_analytics=enable_analytics,
            protocol_format=protocol_format,
            protocol_action="create",
        )

        # Special handling for Protocol Designer with null response
        if protocol_format == ProtocolFormat.PROTOCOL_DESIGNER and response is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=InternalServerError(exception_object=Exception("No response received from LLM")).model_dump(by_alias=True),
            )

        return _format_response(response, protocol_format, bool(body.fake))

    except anthropic.APIError:
        raise
    except Exception as e:
        logger.error(
            f"Unhandled error in create_protocol: {str(e)}", extra={"error_details": str(e), "exception_type": e.__class__.__name__}
        )

        payload = {
            "message": "Internal server error",
            "exception_type": type(e).__name__,
            "error": str(e),
        }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=jsonable_encoder(payload),
        ) from e


@app.post(
    "/api/chat/update-protocol",
    response_model=Union[ChatResponse, ErrorResponse],
    response_model_by_alias=True,
    summary="Updates protocol",
    description="Generate a chat response based on the provided prompt that will update an existing protocol with the required changes.",
)
async def update_protocol(
    body: UpdateProtocol, user: Annotated[User, Security(auth.verify)], request: Request
) -> Union[ChatResponse, ErrorResponse]:  # noqa: B008
    """
    Generate an updated protocol using LLM.

    - **request**: The HTTP request containing the existing protocol and other relevant parameters.
    - **returns**: A chat response or an error message.
    """
    logger.info("POST /api/chat/update-protocol")
    try:
        # Setup Weave analytics based on frontend preference
        enable_analytics = _get_analytics_preference(request)
        setup_weave_analytics(enable_analytics)

        _validate_request(body, "protocol_text")

        fake_response = _handle_fake_response(bool(body.fake))
        if fake_response:
            return fake_response

        response = await _generate_llm_response(
            model_type=settings.model,
            user_id=str(user.sub),
            prompt=body.prompt,
            enable_analytics=enable_analytics,
            protocol_action="update",
        )

        # Handle empty response specifically for update protocol
        if response is None or response == "":
            return ChatResponse(reply="No response was generated", fake=bool(body.fake))

        return ChatResponse(reply=response, fake=bool(body.fake))

    except anthropic.APIError:
        raise
    except Exception as e:
        logger.exception("Error processing protocol update")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=InternalServerError(exception_object=e).model_dump(by_alias=True)
        ) from e


@app.get(
    "/health",
    response_model=Status,
    summary="Load Balancer Health Check",
    description="Check the health and version of the API.",
    include_in_schema=False,
)
@app.get("/api/health", response_model=Status, summary="Health Check", description="Check the health and version of the API.")
async def get_health(request: Request) -> Status:
    """
    Perform a health check of the API.

    - **returns**: A Status containing the version of the API.
    """
    if request.url.path == "/health":
        pass  # This is a health check from the load balancer
    else:
        logger.info(f"{request.method} {request.url.path}", extra={"requestMethod": request.method, "requestPath": request.url.path})
    return Status(status="ok", version=settings.service_version)


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


@app.post(
    "/api/chat/feedback",
    response_model=Union[FeedbackResponse, ErrorResponse],
    response_model_by_alias=True,
    summary="Feedback",
    description="Send feedback to the team.",
)
async def feedback(
    body: FeedbackRequest, user: Annotated[User, Security(auth.verify)], background_tasks: BackgroundTasks
) -> FeedbackResponse:
    logger.info("POST /api/feedback")
    try:
        if body.fake:
            return FeedbackResponse(reply="Fake response", fake=bool(body.fake))
        feedback_text = body.feedback_text
        logger.info("Feedback received")
        background_tasks.add_task(google_sheets_client.append_feedback_to_sheet, user_id=str(user.sub), feedback=feedback_text)
        return FeedbackResponse(
            reply=f"Feedback Received and sanitized: {google_sheets_client.sanitize_for_google_sheets(feedback_text)}", fake=False
        )

    except Exception as e:
        logger.exception("Error processing feedback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=InternalServerError(exception_object=e).model_dump(by_alias=True)
        ) from e


@app.get("/api/doc", include_in_schema=False)
async def swagger_html() -> HTMLResponse:
    return get_swagger_ui_html(openapi_url="/api/openapi.json", title="Opentrons API Documentation")


@app.options(
    "/{path:path}", response_model=CorsHeadersResponse, summary="CORS Preflight Request", description="Handle CORS preflight requests."
)
async def handle_options(request: Request) -> JSONResponse:
    """
    Handle CORS preflight requests.

    This endpoint responds to CORS preflight requests with the appropriate headers.

    - **returns**: CORS headers.
    """
    logger.info(f"{request.method} {request.url.path}")
    response = CorsHeadersResponse.model_validate(
        {
            "Access-Control-Allow-Origin": settings.allowed_origins,
            "Access-Control-Allow-Methods": ALLOWED_METHODS,
            "Access-Control-Allow-Headers": ALLOWED_HEADERS,
            "Access-Control-Expose-Headers": ALLOWED_ACCESS_CONTROL_EXPOSE_HEADERS,
            "Access-Control-Max-Age": ALLOWED_ACCESS_CONTROL_MAX_AGE,
        }
    )
    return JSONResponse(response.model_dump(by_alias=True))


# Catch all Anthropic SDK errors at the app level so they are always serializable
# and never reach FastAPI's default http_exception_handler as a raw Python object.
# BadRequestError and RateLimitError are expected operational errors (warning);
# everything else is unexpected (error + traceback).
@app.exception_handler(anthropic.APIError)
async def anthropic_error_handler(request: Request, exc: anthropic.APIError) -> JSONResponse:
    message = _extract_anthropic_error_message(exc)
    error_type = type(exc).__name__
    if isinstance(exc, (anthropic.BadRequestError, anthropic.RateLimitError)):
        logger.warning("Anthropic API error", extra={"error_type": error_type, "message": message})
    else:
        logger.error("Anthropic API error", extra={"error_type": error_type, "message": message}, exc_info=True)
    return _anthropic_error_to_json_response(exc)


# General exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation errors.

    - **request**: The HTTP request that caused the error.
    - **exc**: The validation exception that was raised.
    - **returns**: A JSON response with a 422 status code and error details.
    """
    logger.error(f"Validation error for route {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": "Validation error", "details": exc.errors()})


@app.middleware("http")
async def custom_404_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    try:
        response = await call_next(request)
        if response.status_code in (status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED):
            logger.info(f"Route not found: {request.url.path}")
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": f"Route '{request.url.path}' not found"})
        return response
    except Exception as exc:
        logger.error(f"Error processing request: {exc}", exc_info=True)
        raise exc from None


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
        return await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled error for route {request.url.path}: {exc}")
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"message": "Internal server error"})

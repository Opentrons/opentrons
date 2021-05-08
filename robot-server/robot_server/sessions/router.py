"""Router for /sessions endpoints."""
from fastapi import APIRouter, Depends, status
from datetime import datetime
from typing import Optional
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.json_api import (
    RequestModel,
    ResponseModel,
    MultiResponseModel,
)

from .session_store import SessionStore, SessionNotFoundError
from .session_runner import SessionRunner
from .session_models import Session, CreateSessionData, SessionType
from .session_inputs import SessionInput, CreateSessionInputData

from .dependencies import (
    get_session_store,
    get_session_runner,
    get_unique_id,
    get_current_time,
)

sessions_router = APIRouter()


class SessionNotFound(ErrorDetails):
    """An error response for when a given session is not found."""

    id: Literal["SessionNotFound"] = "SessionNotFound"
    title: str = "Session Not Found"


@sessions_router.post(
    path="/sessions",
    summary="Create a session",
    description="Create a new session to track robot interaction.",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[Session],
)
async def create_session(
    request_body: Optional[RequestModel[CreateSessionData]] = None,
    session_store: SessionStore = Depends(get_session_store),
    session_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[Session]:
    """Create a new session.

    Args:
        request_body: Optional request body with session creation data.
        session_store: Session storage interface.
        session_id: Generated ID to assign to the session.
        created_at: Timestamp to attach to created session
    """
    session_data = (
        request_body.data
        if request_body is not None
        else CreateSessionData(sessionType=SessionType.BASIC)
    )
    session = session_store.create_session(
        session_data=session_data,
        session_id=session_id,
        created_at=created_at,
    )

    return ResponseModel(data=session)


@sessions_router.get(
    path="/sessions",
    summary="Get all sessions",
    description="Get a list of all active and inactive sessions.",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Session],
)
async def get_sessions(
    session_store: SessionStore = Depends(get_session_store),
) -> MultiResponseModel[Session]:
    """Get all sessions.

    Args:
        session_store: Session storage interface
    """
    sessions = session_store.get_all_sessions()
    return MultiResponseModel(data=sessions)


@sessions_router.get(
    path="/sessions/{sessionId}",
    summary="Get a session",
    description="Get a specific session by its unique identifier.",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Session],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
async def get_session(
    sessionId: str,
    session_store: SessionStore = Depends(get_session_store),
) -> ResponseModel[Session]:
    """Get a session by its ID.

    Args:
        sessionId: Session ID pulled from URL
        session_store: Session storage interface
    """
    try:
        session = session_store.get_session(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=session)


@sessions_router.delete(
    path="/sessions/{sessionId}",
    summary="Delete a session",
    description="Delete a specific session by its unique identifier.",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Session],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
async def remove_session_by_id(
    sessionId: str,
    session_store: SessionStore = Depends(get_session_store),
) -> ResponseModel[Session]:
    """Delete a session by its ID.

    Args:
        sessionId: Session ID pulled from URL
        session_store: Session storage interface
    """
    try:
        session = session_store.remove_session_by_id(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=session)


@sessions_router.post(
    path="/sessions/{sessionId}/inputs",
    summary="Create a session control input.",
    description=(
        "Provide input data to the session in order to control the"
        "execution of the run."
    ),
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[SessionInput],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
async def create_session_input(
    sessionId: str,
    request_body: RequestModel[CreateSessionInputData],
    session_runner: SessionRunner = Depends(get_session_runner),
    input_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[SessionInput]:
    """Create a session input.

    Args:
        sessionId: Session ID pulled from the URL.
        request_body: Input payload from the request body.
        session_runner: Session control interface.
        input_id: Generated ID to assign to the input data.
        created_at: Timestamp to attach to the input data.
    """
    try:
        data = session_runner.handle_input(
            session_id=sessionId,
            input_data=request_body.data,
            input_id=input_id,
            created_at=created_at,
        )
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=data)

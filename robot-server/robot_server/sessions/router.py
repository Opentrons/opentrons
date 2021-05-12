"""Router for /sessions endpoints."""
from fastapi import APIRouter, Depends, Request, status
from typing import Optional
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.json_api import ResponseModel, MultiResponseModel

from .dependencies import get_session_store, get_unique_id
from .session_store import SessionStore, SessionNotFoundError
from .session_type import SessionType
from .session_models import Session, CreateSessionData
from .command_models import SessionCommand


sessions_router = APIRouter()


class SessionNotFound(ErrorDetails):
    """An error response for when a given session is not found."""

    id: Literal["SessionNotFound"] = "SessionNotFound"
    title: str = "Session Not Found"


@sessions_router.post(
    path="/sessions",
    summary="Create a session",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[Session],
)
def create_session(
    session_data: Optional[CreateSessionData] = None,
    session_store: SessionStore = Depends(get_session_store),
    session_id: str = Depends(get_unique_id),
) -> ResponseModel[Session]:
    """Create a new session."""
    session_data = session_data or CreateSessionData(sessionType=SessionType.BASIC)
    session = session_store.create_session(
        session_data=session_data,
        session_id=session_id,
    )

    return ResponseModel(data=session)


@sessions_router.get(
    path="/sessions",
    summary="Get all sessions",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Session],
)
def get_sessions(
    session_store: SessionStore = Depends(get_session_store),
) -> MultiResponseModel[Session]:
    """Get a list of all active and inactive sessions."""
    sessions = session_store.get_all_sessions()
    return MultiResponseModel(data=sessions)


@sessions_router.get(
    path="/sessions/{sessionId}",
    summary="Get a session",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Session],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
def get_session(
    sessionId: str,
    session_store: SessionStore = Depends(get_session_store),
) -> ResponseModel[Session]:
    """Get a specific session by its unique identifier."""
    try:
        session = session_store.get_session(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=session)


@sessions_router.get(
    path="/sessions/{sessionId}/commands",
    summary="Get a session's commands",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[SessionCommand],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
def get_session_commands(
    sessionId: str,
    request: Request,
    session_store: SessionStore = Depends(get_session_store),
) -> MultiResponseModel[SessionCommand]:
    """Get the state of the sessions commands."""
    try:
        commands = session_store.get_session_commands(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return MultiResponseModel(data=commands)


@sessions_router.delete(
    path="/sessions/{sessionId}",
    summary="Delete a session",
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[Session],
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
def remove_session_by_id(
    sessionId: str,
    session_store: SessionStore = Depends(get_session_store),
) -> ResponseModel[Session]:
    """Delete a specific session by its unique identifier."""
    try:
        session = session_store.remove_session_by_id(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=session)

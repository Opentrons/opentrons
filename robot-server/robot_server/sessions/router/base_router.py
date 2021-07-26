"""Base router for /sessions endpoints.

Contains routes dealing primarily with `Session` models.
"""
from fastapi import APIRouter, Depends, status
from datetime import datetime
from typing import Optional
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.json_api import (
    ResponseModel,
    EmptyResponseModel,
    MultiResponseModel,
)

from robot_server.protocols import (
    ProtocolStore,
    ProtocolNotFound,
    ProtocolNotFoundError,
    get_protocol_store,
)

from ..session_store import SessionStore, SessionNotFoundError
from ..session_view import SessionView
from ..session_models import Session, ProtocolSessionCreateData
from ..schema_models import CreateSessionRequest, SessionResponse
from ..engine_store import EngineStore, EngineConflictError
from ..dependencies import get_session_store, get_engine_store

base_router = APIRouter()


class SessionNotFound(ErrorDetails):
    """An error if a given session is not found."""

    id: Literal["SessionNotFound"] = "SessionNotFound"
    title: str = "Session Not Found"


# TODO(mc, 2021-05-28): evaluate multi-session logic
class SessionAlreadyActive(ErrorDetails):
    """An error if one tries to create a new session while one is already active."""

    id: Literal["SessionAlreadyActive"] = "SessionAlreadyActive"
    title: str = "Session Already Active"


@base_router.post(
    path="/sessions",
    summary="Create a session",
    description="Create a new session to track robot interaction.",
    status_code=status.HTTP_201_CREATED,
    # TODO(mc, 2021-06-23): mypy >= 0.780 broke Unions as `response_model`
    # see https://github.com/tiangolo/fastapi/issues/2279
    response_model=SessionResponse,  # type: ignore[arg-type]
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse[SessionAlreadyActive]},
    },
)
async def create_session(
    request_body: Optional[CreateSessionRequest] = None,
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
    engine_store: EngineStore = Depends(get_engine_store),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    session_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[Session]:
    """Create a new session.

    Arguments:
        request_body: Optional request body with session creation data.
        session_view: Session model construction interface.
        session_store: Session storage interface.
        engine_store: ProtocolEngine storage and control.
        protocol_store: Protocol resource storage.
        session_id: Generated ID to assign to the session.
        created_at: Timestamp to attach to created session
    """
    create_data = request_body.data if request_body is not None else None
    session = session_view.as_resource(
        session_id=session_id,
        created_at=created_at,
        create_data=create_data,
    )
    protocol = None

    try:
        if isinstance(create_data, ProtocolSessionCreateData):
            protocol = protocol_store.get(
                protocol_id=create_data.createParams.protocolId
            )

        # TODO(mc, 2021-05-28): return engine state to build response model
        await engine_store.create(protocol=protocol)
    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)
    except EngineConflictError as e:
        raise SessionAlreadyActive(detail=str(e)).as_error(status.HTTP_409_CONFLICT)

    session_store.upsert(session=session)
    commands = engine_store.engine.state_view.commands.get_all()
    engine_status = engine_store.engine.state_view.commands.get_status()
    data = session_view.as_response(
        session=session,
        commands=commands,
        engine_status=engine_status,
    )

    return ResponseModel(data=data)


@base_router.get(
    path="/sessions",
    summary="Get all sessions",
    description="Get a list of all active and inactive sessions.",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Session],
)
async def get_sessions(
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> MultiResponseModel[Session]:
    """Get all sessions.

    Args:
        session_view: Session model construction interface.
        session_store: Session storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    data = []

    for session in session_store.get_all():
        # TODO(mc, 2021-06-23): add multi-engine support
        commands = engine_store.engine.state_view.commands.get_all()
        engine_status = engine_store.engine.state_view.commands.get_status()
        session_data = session_view.as_response(
            session=session,
            commands=commands,
            engine_status=engine_status,
        )
        data.append(session_data)

    return MultiResponseModel(data=data)


@base_router.get(
    path="/sessions/{sessionId}",
    summary="Get a session",
    description="Get a specific session by its unique identifier.",
    status_code=status.HTTP_200_OK,
    # TODO(mc, 2021-06-23): mypy >= 0.780 broke Unions as `response_model`
    # see https://github.com/tiangolo/fastapi/issues/2279
    response_model=SessionResponse,  # type: ignore[arg-type]
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
async def get_session(
    sessionId: str,
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> ResponseModel[Session]:
    """Get a session by its ID.

    Args:
        sessionId: Session ID pulled from URL.
        session_view: Session model construction interface.
        session_store: Session storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    try:
        session = session_store.get(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    commands = engine_store.engine.state_view.commands.get_all()
    engine_status = engine_store.engine.state_view.commands.get_status()
    data = session_view.as_response(
        session=session,
        commands=commands,
        engine_status=engine_status,
    )

    return ResponseModel(data=data)


@base_router.delete(
    path="/sessions/{sessionId}",
    summary="Delete a session",
    description="Delete a specific session by its unique identifier.",
    status_code=status.HTTP_200_OK,
    response_model=EmptyResponseModel,
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]}},
)
async def remove_session_by_id(
    sessionId: str,
    session_store: SessionStore = Depends(get_session_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> EmptyResponseModel:
    """Delete a session by its ID.

    Arguments:
        sessionId: Session ID pulled from URL.
        session_store: Session storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    try:
        engine_store.clear()
        session_store.remove(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return EmptyResponseModel()

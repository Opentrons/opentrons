"""Router for /sessions endpoints."""
from fastapi import APIRouter, Depends, status
from datetime import datetime
from typing import Optional
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse

from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.json_api import (
    RequestModel,
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

from .session_store import SessionStore, SessionNotFoundError
from .session_view import SessionView
from .session_models import Session, SessionCreateData, ProtocolSessionCreateData
from .action_models import SessionAction, SessionActionCreateData
from .engine_store import EngineStore, EngineConflictError, EngineMissingError
from .dependencies import get_session_store, get_engine_store

sessions_router = APIRouter()


class SessionNotFound(ErrorDetails):
    """An error if a given session is not found."""

    id: Literal["SessionNotFound"] = "SessionNotFound"
    title: str = "Session Not Found"


# TODO(mc, 2021-05-28): evaluate multi-session logic
class SessionAlreadyActive(ErrorDetails):
    """An error if one tries to create a new session while one is already active."""

    id: Literal["SessionAlreadyActive"] = "SessionAlreadyActive"
    title: str = "Session Already Active"


class SessionActionNotAllowed(ErrorDetails):
    """An error if one tries to issue an unsupported session action."""

    id: Literal["SessionActionNotAllowed"] = "SessionActionNotAllowed"
    title: str = "Session Action Not Allowed"


@sessions_router.post(
    path="/sessions",
    summary="Create a session",
    description="Create a new session to track robot interaction.",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[Session],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse[SessionAlreadyActive]},
    },
)
async def create_session(
    request_body: Optional[RequestModel[SessionCreateData]] = None,
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
    data = session_view.as_response(session=session)

    return ResponseModel(data=data)


@sessions_router.get(
    path="/sessions",
    summary="Get all sessions",
    description="Get a list of all active and inactive sessions.",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Session],
)
async def get_sessions(
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
) -> MultiResponseModel[Session]:
    """Get all sessions.

    Args:
        session_view: Session model construction interface.
        session_store: Session storage interface
    """
    data = [
        session_view.as_response(session=session) for session in session_store.get_all()
    ]

    return MultiResponseModel(data=data)


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
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
) -> ResponseModel[Session]:
    """Get a session by its ID.

    Args:
        sessionId: Session ID pulled from URL
        session_view: Session model construction interface.
        session_store: Session storage interface
    """
    try:
        session = session_store.get(session_id=sessionId)
    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    data = session_view.as_response(session=session)

    return ResponseModel(data=data)


@sessions_router.delete(
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


@sessions_router.post(
    path="/sessions/{sessionId}/actions",
    summary="Issue a control action to the session",
    description=(
        "Provide an action to the session in order to control execution of the run."
    ),
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseModel[SessionAction],
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse[SessionActionNotAllowed]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]},
    },
)
async def create_session_action(
    sessionId: str,
    request_body: RequestModel[SessionActionCreateData],
    session_view: SessionView = Depends(SessionView),
    session_store: SessionStore = Depends(get_session_store),
    engine_store: EngineStore = Depends(get_engine_store),
    action_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
) -> ResponseModel[SessionAction]:
    """Create a session control action.

    Arguments:
        sessionId: Session ID pulled from the URL.
        request_body: Input payload from the request body.
        session_view: Resource model builder.
        session_store: Session storage interface.
        engine_store: Protocol engine and runner storage.
        action_id: Generated ID to assign to the control action.
        created_at: Timestamp to attach to the control action.
    """
    try:
        prev_session = session_store.get(session_id=sessionId)

        action, next_session = session_view.with_action(
            session=prev_session,
            action_id=action_id,
            action_data=request_body.data,
            created_at=created_at,
        )

        # TODO(mc, 2021-06-11): support actions other than `start`
        # TODO(mc, 2021-06-24): ensure the engine homes pipette plungers
        # before starting the protocol run
        engine_store.runner.play()

    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)
    except EngineMissingError as e:
        raise SessionActionNotAllowed(detail=str(e)).as_error(
            status.HTTP_400_BAD_REQUEST
        )

    session_store.upsert(session=next_session)

    return ResponseModel(data=action)

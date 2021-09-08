"""Router for /sessions actions endpoints."""
from fastapi import APIRouter, Depends, status
from datetime import datetime
from typing_extensions import Literal

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.json_api import RequestModel, ResponseModel

from ..session_store import SessionStore, SessionNotFoundError
from ..session_view import SessionView
from ..action_models import SessionAction, SessionActionType, SessionActionCreateData
from ..engine_store import EngineStore, EngineMissingError
from ..dependencies import get_session_store, get_engine_store
from .base_router import SessionNotFound

actions_router = APIRouter()


class SessionActionNotAllowed(ErrorDetails):
    """An error if one tries to issue an unsupported session action."""

    id: Literal["SessionActionNotAllowed"] = "SessionActionNotAllowed"
    title: str = "Session Action Not Allowed"


@actions_router.post(
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

        # TODO(mc, 2021-07-06): add a dependency to verify that a given
        # action is allowed
        if action.actionType == SessionActionType.PLAY:
            engine_store.runner.play()
        elif action.actionType == SessionActionType.PAUSE:
            engine_store.runner.pause()
        if action.actionType == SessionActionType.STOP:
            await engine_store.runner.stop()

    except SessionNotFoundError as e:
        raise SessionNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)
    except EngineMissingError as e:
        raise SessionActionNotAllowed(detail=str(e)).as_error(
            status.HTTP_400_BAD_REQUEST
        )

    session_store.upsert(session=next_session)

    return ResponseModel(data=action)

"""Tests for the /sessions router."""
import pytest
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.helpers import verify_response
from robot_server.service.task_runner import TaskRunner
from robot_server.sessions.session_view import SessionView, BasicSessionCreateData
from robot_server.sessions.engine_store import EngineStore

from robot_server.sessions.session_store import (
    SessionStore,
    SessionNotFoundError,
    SessionResource,
)

from robot_server.sessions.action_models import (
    SessionAction,
    SessionActionType,
    SessionActionCreateData,
)

from robot_server.sessions.router.base_router import SessionNotFound

from robot_server.sessions.router.actions_router import (
    actions_router,
    SessionActionNotAllowed,
)


@pytest.fixture(autouse=True)
def setup_app(app: FastAPI) -> None:
    """Setup the FastAPI app with actions routes."""
    app.include_router(actions_router)


def test_create_session_action(
    decoy: Decoy,
    task_runner: TaskRunner,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a start input."""
    session_created_at = datetime.now()

    actions = SessionAction(
        actionType=SessionActionType.START,
        createdAt=current_time,
        id=unique_id,
    )

    prev_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    next_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[actions],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(prev_session)

    decoy.when(
        session_view.with_action(
            session=prev_session,
            action_id=unique_id,
            action_data=SessionActionCreateData(actionType=SessionActionType.START),
            created_at=current_time,
        ),
    ).then_return((actions, next_session))

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(response, expected_status=201, expected_data=actions)
    decoy.verify(task_runner.run(engine_store.runner.run))


def test_create_session_action_with_missing_id(
    decoy: Decoy,
    session_store: SessionStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 404 if the session ID does not exist."""
    not_found_error = SessionNotFoundError(session_id="session-id")

    decoy.when(session_store.get(session_id="session-id")).then_raise(not_found_error)

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=SessionNotFound(detail=str(not_found_error)),
    )


@pytest.mark.xfail(strict=True)
def test_create_session_action_without_runner(
    decoy: Decoy,
    session_view: SessionView,
    session_store: SessionStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a start input."""
    session_created_at = datetime.now()

    actions = SessionAction(
        actionType=SessionActionType.START,
        createdAt=current_time,
        id=unique_id,
    )

    prev_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    next_session = SessionResource(
        session_id="unique-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[actions],
    )

    decoy.when(session_store.get(session_id="session-id")).then_return(prev_session)

    decoy.when(
        session_view.with_action(
            session=prev_session,
            action_id=unique_id,
            action_data=SessionActionCreateData(actionType=SessionActionType.START),
            created_at=current_time,
        ),
    ).then_return((actions, next_session))

    # TODO(mc, 2021-07-06): in reality, it will be the engine_store.runner
    # property access that triggers this raise. Explore adding property access
    # rehearsals to decoy
    # decoy.when(
    #     await engine_store.runner.run()
    # ).then_raise(EngineMissingError("oh no"))

    response = client.post(
        "/sessions/session-id/actions",
        json={"data": {"actionType": "start"}},
    )

    verify_response(
        response,
        expected_status=400,
        expected_errors=SessionActionNotAllowed(detail="oh no"),
    )

"""Tests for base /sessions routes."""
import pytest
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient

from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_engine import commands as pe_commands, types as pe_types
from opentrons.protocol_runner import JsonPreAnalysis

from robot_server.service.task_runner import TaskRunner
from robot_server.protocols import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolNotFound,
)

from robot_server.sessions.run_view import RunView

from robot_server.sessions.run_models import (
    RunCommandSummary,
    BasicRun,
    BasicRunCreateData,
    ProtocolRun,
    ProtocolRunCreateData,
    ProtocolRunCreateParams,
)

from robot_server.sessions.engine_store import (
    EngineStore,
    EngineConflictError,
    EngineMissingError,
)

from robot_server.sessions.run_store import (
    RunStore,
    RunNotFoundError,
    RunResource,
)

from robot_server.sessions.router.base_router import (
    base_router,
    RunNotFound,
    RunAlreadyActive,
    RunNotIdle,
)

from tests.helpers import verify_response


@pytest.fixture(autouse=True)
def setup_app(app: FastAPI) -> None:
    """Setup the FastAPI app with /sessions routes."""
    app.include_router(base_router)


async def test_create_run(
    decoy: Decoy,
    task_runner: TaskRunner,
    session_view: RunView,
    session_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should be able to create a basic run."""
    session = RunResource(
        session_id=unique_id,
        created_at=current_time,
        create_data=BasicRunCreateData(),
        actions=[],
    )
    expected_response = BasicRun(
        id=unique_id,
        createdAt=current_time,
        status=pe_types.EngineStatus.READY_TO_RUN,
        actions=[],
        commands=[],
        pipettes=[],
        labware=[],
    )

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.pipettes.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.labware.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        pe_types.EngineStatus.READY_TO_RUN
    )

    decoy.when(
        session_view.as_resource(
            create_data=BasicRunCreateData(),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[],
            pipettes=[],
            labware=[],
            engine_status=pe_types.EngineStatus.READY_TO_RUN,
        ),
    ).then_return(expected_response)

    response = await async_client.post(
        "/runs",
        json={"data": {"runType": "basic"}},
    )

    verify_response(response, expected_status=201, expected_data=expected_response)

    decoy.verify(
        await engine_store.create(),
        task_runner.run(engine_store.runner.join),
        session_store.upsert(session=session),
    )


async def test_create_protocol_run(
    decoy: Decoy,
    session_view: RunView,
    session_store: RunStore,
    protocol_store: ProtocolStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should be able to create a protocol run."""
    session = RunResource(
        session_id=unique_id,
        created_at=current_time,
        create_data=ProtocolRunCreateData(
            createParams=ProtocolRunCreateParams(protocolId="protocol-id")
        ),
        actions=[],
    )
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
        created_at=datetime.now(),
        files=[],
    )
    expected_response = ProtocolRun(
        id=unique_id,
        createdAt=current_time,
        status=pe_types.EngineStatus.READY_TO_RUN,
        createParams=ProtocolRunCreateParams(protocolId="protocol-id"),
        actions=[],
        commands=[],
        pipettes=[],
        labware=[],
    )

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_return(
        protocol_resource
    )

    decoy.when(
        session_view.as_resource(
            create_data=ProtocolRunCreateData(
                createParams=ProtocolRunCreateParams(protocolId="protocol-id")
            ),
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.pipettes.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.labware.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        pe_types.EngineStatus.READY_TO_RUN
    )

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[],
            pipettes=[],
            labware=[],
            engine_status=pe_types.EngineStatus.READY_TO_RUN,
        ),
    ).then_return(expected_response)

    response = await async_client.post(
        "/runs",
        json={
            "data": {
                "runType": "protocol",
                "createParams": {"protocolId": "protocol-id"},
            }
        },
    )

    verify_response(response, expected_status=201, expected_data=expected_response)

    decoy.verify(
        await engine_store.create(),
        engine_store.runner.load(protocol_resource),
        session_store.upsert(session=session),
    )


async def test_create_protocol_run_missing_protocol(
    decoy: Decoy,
    session_view: RunView,
    session_store: RunStore,
    protocol_store: ProtocolStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should 404 if a protocol for a run does not exist."""
    error = ProtocolNotFoundError("protocol-id")

    decoy.when(protocol_store.get(protocol_id="protocol-id")).then_raise(error)

    response = await async_client.post(
        "/runs",
        json={
            "data": {
                "runType": "protocol",
                "createParams": {"protocolId": "protocol-id"},
            }
        },
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=ProtocolNotFound(detail=str(error)),
    )


async def test_create_run_conflict(
    decoy: Decoy,
    session_view: RunView,
    session_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should respond with a conflict error if multiple engines are created."""
    session = RunResource(
        session_id=unique_id,
        create_data=BasicRunCreateData(),
        created_at=current_time,
        actions=[],
    )

    decoy.when(
        session_view.as_resource(
            create_data=None,
            session_id=unique_id,
            created_at=current_time,
        )
    ).then_return(session)

    decoy.when(await engine_store.create()).then_raise(EngineConflictError("oh no"))

    response = await async_client.post("/runs")

    verify_response(
        response,
        expected_status=409,
        expected_errors=RunAlreadyActive(detail="oh no"),
    )


def test_get_run(
    decoy: Decoy,
    session_view: RunView,
    session_store: RunStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should be able to get a run by ID."""
    created_at = datetime.now()
    create_data = BasicRunCreateData()
    session = RunResource(
        session_id="run-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )

    command = pe_commands.Pause(
        id="command-id",
        status=pe_commands.CommandStatus.QUEUED,
        createdAt=datetime(year=2021, month=1, day=1),
        data=pe_commands.PauseData(message="hello world"),
    )

    labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slot=DeckSlotName.SLOT_1),
    )

    pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    expected_response = BasicRun(
        id="run-id",
        createdAt=created_at,
        status=pe_types.EngineStatus.READY_TO_RUN,
        actions=[],
        commands=[
            RunCommandSummary(
                id=command.id,
                commandType=command.commandType,
                status=command.status,
            ),
        ],
        pipettes=[pipette],
        labware=[labware],
    )

    decoy.when(session_store.get(session_id="run-id")).then_return(session)

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([command])
    decoy.when(engine_store.engine.state_view.pipettes.get_all()).then_return([pipette])
    decoy.when(engine_store.engine.state_view.labware.get_all()).then_return([labware])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        pe_types.EngineStatus.READY_TO_RUN
    )

    decoy.when(
        session_view.as_response(
            session=session,
            commands=[command],
            pipettes=[pipette],
            labware=[labware],
            engine_status=pe_types.EngineStatus.READY_TO_RUN,
        ),
    ).then_return(expected_response)

    response = client.get("/runs/run-id")

    verify_response(response, expected_status=200, expected_data=expected_response)


def test_get_run_with_missing_id(
    decoy: Decoy,
    session_store: RunStore,
    client: TestClient,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(session_id="run-id")

    decoy.when(session_store.get(session_id="run-id")).then_raise(not_found_error)

    response = client.get("/runs/run-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=RunNotFound(detail=str(not_found_error)),
    )


def test_get_runs_empty(
    decoy: Decoy,
    session_store: RunStore,
    client: TestClient,
) -> None:
    """It should return an empty collection response when no runs exist."""
    decoy.when(session_store.get_all()).then_return([])

    response = client.get("/runs")

    verify_response(response, expected_status=200, expected_data=[])


def test_get_runs_not_empty(
    decoy: Decoy,
    session_view: RunView,
    session_store: RunStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should return a collection response when a run exists."""
    # TODO(mc, 2021-06-23): add actual multi-session support
    created_at_1 = datetime.now()

    session_1 = RunResource(
        session_id="unique-id-1",
        create_data=BasicRunCreateData(),
        created_at=created_at_1,
        actions=[],
    )

    response_1 = BasicRun(
        id="unique-id-1",
        createdAt=created_at_1,
        status=pe_types.EngineStatus.SUCCEEDED,
        actions=[],
        commands=[],
        pipettes=[],
        labware=[],
    )

    decoy.when(session_store.get_all()).then_return([session_1])

    decoy.when(engine_store.engine.state_view.commands.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.pipettes.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.labware.get_all()).then_return([])
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(
        pe_types.EngineStatus.SUCCEEDED
    )

    decoy.when(
        session_view.as_response(
            session=session_1,
            commands=[],
            pipettes=[],
            labware=[],
            engine_status=pe_types.EngineStatus.SUCCEEDED,
        ),
    ).then_return(response_1)

    response = client.get("/runs")

    verify_response(response, expected_status=200, expected_data=[response_1])


def test_delete_run_by_id(
    decoy: Decoy,
    session_store: RunStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should be able to remove a run by ID."""
    decoy.when(engine_store.engine.state_view.commands.get_is_stopped()).then_return(
        True
    )

    response = client.delete("/runs/unique-id")

    decoy.verify(
        engine_store.clear(),
        session_store.remove(session_id="unique-id"),
    )

    assert response.status_code == 200
    assert response.json()["data"] is None


def test_delete_run_with_bad_id(
    decoy: Decoy,
    session_store: RunStore,
    engine_store: EngineStore,
    client: TestClient,
) -> None:
    """It should 404 if the run ID does not exist."""
    key_error = RunNotFoundError(session_id="run-id")

    decoy.when(engine_store.engine.state_view.commands.get_is_stopped()).then_return(
        True
    )
    decoy.when(session_store.remove(session_id="run-id")).then_raise(key_error)

    response = client.delete("/runs/run-id")

    verify_response(
        response,
        expected_status=404,
        expected_errors=RunNotFound(detail=str(key_error)),
    )


def test_delete_active_run(
    decoy: Decoy,
    engine_store: EngineStore,
    session_store: RunStore,
    client: TestClient,
) -> None:
    """It should 409 if the run is not finished."""
    decoy.when(engine_store.engine.state_view.commands.get_is_stopped()).then_return(
        False
    )

    response = client.delete("/runs/run-id")

    verify_response(
        response,
        expected_status=409,
        expected_errors=RunNotIdle(),
    )


def test_delete_active_run_no_engine(
    decoy: Decoy,
    engine_store: EngineStore,
    session_store: RunStore,
    client: TestClient,
) -> None:
    """It should no-op if no engine is present."""
    decoy.when(engine_store.engine.state_view.commands.get_is_stopped()).then_raise(
        EngineMissingError()
    )

    response = client.delete("/runs/run-id")

    assert response.status_code == 200

"""Tests for RunDataManager."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import EngineStatus, ProtocolRunData

from robot_server.runs.engine_store import EngineStore, EngineConflictError
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import Run
from robot_server.runs.run_store import RunStore, RunResource


@pytest.fixture
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture
def subject(mock_engine_store: EngineStore, mock_run_store: RunStore) -> RunDataManager:
    """Get a RunDataManager test subject."""
    return RunDataManager(engine_store=mock_engine_store, run_store=mock_run_store)


@pytest.fixture
def protocol_run_data() -> ProtocolRunData:
    """Get a ProtocolRunData value object."""
    return ProtocolRunData(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
    )


@pytest.fixture
def run_resource() -> RunResource:
    """Get a ProtocolRunData value object."""
    return RunResource(
        run_id="the other side",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
        is_current=True,
    )


async def test_create_and_get_active(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should create an engine and a persisted run resource."""
    run_id = "hello from"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(await mock_engine_store.create(run_id)).then_return(protocol_run_data)
    decoy.when(
        mock_run_store.insert(
            RunResource(
                run_id=run_id,
                protocol_id=None,
                created_at=created_at,
                actions=[],
                is_current=True,
            )
        )
    ).then_return(run_resource)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[],
        protocol=None,
    )

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_create_engine_error(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should not create a resource if engine creation fails."""
    run_id = "hello from"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(await mock_engine_store.create(run_id)).then_raise(
        EngineConflictError("oh no")
    )

    with pytest.raises(EngineConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
            protocol=None,
        )

    decoy.verify(mock_run_store.insert(matchers.Anything()), times=0)


async def test_get_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello from"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        protocol_run_data
    )
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)

    result = subject.get(run_id)

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_get_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello from"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_run_data(run_id)).then_return(protocol_run_data)
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id)

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )

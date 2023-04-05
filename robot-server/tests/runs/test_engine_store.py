"""Tests for the EngineStore interface."""
from datetime import datetime
from pathlib import Path
from typing import cast
import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.state import StateStore
from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI
from opentrons import protocol_engine
from opentrons.protocol_engine import ProtocolEngine, StateSummary, types as pe_types
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_runner import (
    RunResult,
    LiveRunner,
    RunnerType,
    protocol_runner,
    JsonRunner,
)
from opentrons.protocol_reader import ProtocolReader, ProtocolSource

from robot_server.protocols import ProtocolResource
from robot_server.runs.engine_store import EngineStore, EngineConflictError


@pytest.fixture
def hardware_api(
    decoy: Decoy,
) -> HardwareControlAPI:
    """Return a mock in the shape of a HardwareControlAPI."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def subject(decoy: Decoy, hardware_api: HardwareControlAPI) -> EngineStore:
    """Get a EngineStore test subject."""
    return EngineStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot_type. Tests where robot_type matters should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
    )


@pytest.fixture
async def json_protocol_source(tmp_path: Path) -> ProtocolSource:
    """Get a protocol source fixture."""
    simple_protocol = (
        get_shared_data_root() / "protocol" / "fixtures" / "6" / "simpleV6.json"
    )
    return await ProtocolReader().read_saved(files=[simple_protocol], directory=None)


@pytest.fixture(autouse=True)
def mock_patch_create_protocol_runner(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock patch a runner creator."""
    mock_run_creator = decoy.mock(func=protocol_runner.create_protocol_runner)
    monkeypatch.setattr(protocol_runner, "create_protocol_runner", mock_run_creator)


@pytest.fixture(autouse=True)
def mock_patch_create_engine(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock patch an engine creator."""
    mock_engine_creator = decoy.mock(func=protocol_engine.create_protocol_engine)
    monkeypatch.setattr(protocol_engine, "create_protocol_engine", mock_engine_creator)


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert isinstance(subject.runner, LiveRunner)
    assert isinstance(subject.engine, ProtocolEngine)


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
async def test_create_engine_uses_robot_type(
    decoy: Decoy, robot_type: RobotType
) -> None:
    """It should create ProtocolEngines with the given robot type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareControlAPI)
    subject = EngineStore(hardware_api=hardware_api, robot_type=robot_type)

    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    assert subject.engine.state_view.config.robot_type == robot_type


async def test_create_engine_with_labware_offsets(subject: EngineStore) -> None:
    """It should create an engine for a run with labware offsets."""
    labware_offset = pe_types.LabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[labware_offset],
        protocol=None,
    )

    assert result.labwareOffsets == [
        pe_types.LabwareOffset.construct(
            id=matchers.IsA(str),
            createdAt=matchers.IsA(datetime),
            definitionUri="namespace/load_name/version",
            location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
            vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
        )
    ]


async def test_create_engine_with_protocol_loads_protocol_source(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    subject: EngineStore,
    json_protocol_source: ProtocolSource,
) -> None:
    """It should create an engine-runner pair for a run with JSONv6 protocol source."""
    protocol = ProtocolResource(
        protocol_id="my cool protocol",
        protocol_key=None,
        created_at=datetime(year=2021, month=1, day=1),
        source=json_protocol_source,
    )
    mock_engine = decoy.mock(cls=ProtocolEngine)
    mock_runner = decoy.mock(cls=JsonRunner)
    assert isinstance(mock_runner, JsonRunner)
    decoy.when(
        await protocol_engine.create_protocol_engine(
            hardware_api=hardware_api,
            config=Config(robot_type="OT-2 Standard", block_on_door_open=False),
        )
    ).then_return(mock_engine)
    decoy.when(
        protocol_runner.create_protocol_runner(
            protocol_config=json_protocol_source.config,
            protocol_engine=mock_engine,
            hardware_api=hardware_api,
        )
    ).then_return(mock_runner)

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        protocol=protocol,
    )
    decoy.verify(
        await protocol_engine.create_protocol_engine(
            hardware_api=hardware_api,
            config=Config(
                robot_type=cast(RobotType, "OT-2 Standard"),
                block_on_door_open=False,
            ),
        )
    )
    decoy.verify(await mock_runner.load(json_protocol_source), times=1)


async def test_create_engine_for_live_protocol(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    state_store: StateStore,
    subject: EngineStore,
) -> None:
    """It should create an engine-runner for a run with no protocol."""
    mock_engine = decoy.mock(cls=ProtocolEngine)
    mock_runner = decoy.mock(cls=LiveRunner)
    decoy.when(
        await protocol_engine.create_protocol_engine(
            hardware_api=hardware_api,
            config=Config(robot_type="OT-2 Standard", block_on_door_open=False),
        )
    ).then_return(mock_engine)
    decoy.when(
        protocol_runner.create_protocol_runner(
            protocol_config=None, protocol_engine=mock_engine, hardware_api=hardware_api
        )
    ).then_return(mock_runner)

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        protocol=None,
    )
    decoy.verify(mock_runner.set_task_queue_wait(), times=1)


async def test_archives_state_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create(run_id="run-id-1", labware_offsets=[], protocol=None)

    with pytest.raises(EngineConflictError):
        await subject.create(run_id="run-id-2", labware_offsets=[], protocol=None)

    assert subject.current_run_id == "run-id-1"


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    await subject.runner.run()
    result = await subject.clear()

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(AssertionError):
        subject.engine

    with pytest.raises(AssertionError):
        subject.runner


async def test_clear_engine_not_stopped_or_idle(
    subject: EngineStore, json_protocol_source: ProtocolSource
) -> None:
    """It should raise a conflict if the engine is not stopped."""
    protocol_resource = ProtocolResource(
        protocol_id="123",
        created_at=datetime.now(),
        source=json_protocol_source,
        protocol_key=None,
    )
    await subject.create(
        run_id="run-id", labware_offsets=[], protocol=protocol_resource
    )
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: EngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    assert subject.engine is not None
    assert subject.runner is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(AssertionError):
        subject.engine
    with pytest.raises(AssertionError):
        subject.runner


async def test_get_default_engine_idempotent(subject: EngineStore) -> None:
    """It should create and retrieve the same default ProtocolEngine."""
    result = await subject.get_default_engine()
    repeated_result = await subject.get_default_engine()

    assert isinstance(result, ProtocolEngine)
    assert repeated_result is result


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
async def test_get_default_engine_robot_type(
    decoy: Decoy, robot_type: RobotType
) -> None:
    """It should create default ProtocolEngines with the given robot type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareControlAPI)
    subject = EngineStore(hardware_api=hardware_api, robot_type=robot_type)

    result = await subject.get_default_engine()

    assert result.state_view.config.robot_type == robot_type


async def test_get_default_engine_current_unstarted(subject: EngineStore) -> None:
    """It should allow a default engine if another engine current but unstarted."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    result = await subject.get_default_engine()
    assert isinstance(result, ProtocolEngine)


async def test_get_default_engine_conflict(subject: EngineStore) -> None:
    """It should not allow a default engine if another engine is executing commands."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    subject.engine.play()

    with pytest.raises(EngineConflictError):
        await subject.get_default_engine()


async def test_get_default_engine_run_stopped(subject: EngineStore) -> None:
    """It allow a default engine if another engine is terminal."""
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
    await subject.engine.finish()

    result = await subject.get_default_engine()
    assert isinstance(result, ProtocolEngine)

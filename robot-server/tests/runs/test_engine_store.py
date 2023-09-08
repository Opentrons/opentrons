"""Tests for the EngineStore interface."""
from datetime import datetime
from pathlib import Path
import pytest
from decoy import Decoy, matchers

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI, API
from opentrons.hardware_control.types import EstopStateNotification, EstopState
from opentrons.protocol_engine import ProtocolEngine, StateSummary, types as pe_types
from opentrons.protocol_runner import (
    RunResult,
    LiveRunner,
    JsonRunner,
)
from opentrons.protocol_reader import ProtocolReader, ProtocolSource

from robot_server.protocols import ProtocolResource
from robot_server.runs.engine_store import (
    EngineStore,
    EngineConflictError,
    get_estop_listener,
)


@pytest.fixture
def subject(decoy: Decoy, hardware_api: HardwareControlAPI) -> EngineStore:
    """Get a EngineStore test subject."""
    return EngineStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot and deck type. Tests where these matter should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
        deck_type=pe_types.DeckType.OT2_SHORT_TRASH,
    )


@pytest.fixture
async def json_protocol_source(tmp_path: Path) -> ProtocolSource:
    """Get a protocol source fixture."""
    simple_protocol = (
        get_shared_data_root() / "protocol" / "fixtures" / "6" / "simpleV6.json"
    )
    return await ProtocolReader().read_saved(files=[simple_protocol], directory=None)


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(run_id="run-id", labware_offsets=[], protocol=None)

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert isinstance(subject.runner, LiveRunner)
    assert isinstance(subject.engine, ProtocolEngine)


async def test_create_engine_with_protocol(
    decoy: Decoy,
    subject: EngineStore,
    json_protocol_source: ProtocolSource,
) -> None:
    """It should create an engine for a run with protocol.

    Tests only basic engine & runner creation with creation result.
    Loading of protocols/ live run commands is tested in integration test.
    """
    protocol = ProtocolResource(
        protocol_id="my cool protocol",
        protocol_key=None,
        created_at=datetime(year=2021, month=1, day=1),
        source=json_protocol_source,
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[],
        protocol=protocol,
    )
    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert isinstance(subject.runner, JsonRunner)
    assert isinstance(subject.engine, ProtocolEngine)


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_create_engine_uses_robot_type(
    decoy: Decoy, robot_type: RobotType, deck_type: pe_types.DeckType
) -> None:
    """It should create ProtocolEngines with the given robot and deck type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = EngineStore(
        hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
    )

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
    await subject.create(run_id="run-id", labware_offsets=[], protocol=None)
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
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_get_default_engine_robot_type(
    decoy: Decoy, robot_type: RobotType, deck_type: pe_types.DeckType
) -> None:
    """It should create default ProtocolEngines with the given robot and deck type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = EngineStore(
        hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
    )

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


async def test_estop_callback(
    decoy: Decoy,
) -> None:
    """The callback should stop an active engine."""
    engine_store = decoy.mock(cls=EngineStore)

    subject = get_estop_listener(engine_store=engine_store)

    decoy.when(engine_store.current_run_id).then_return(None, "fake_run_id")

    disengage_event = EstopStateNotification(
        old_state=EstopState.PHYSICALLY_ENGAGED, new_state=EstopState.LOGICALLY_ENGAGED
    )

    subject(disengage_event)

    engage_event = EstopStateNotification(
        old_state=EstopState.LOGICALLY_ENGAGED, new_state=EstopState.PHYSICALLY_ENGAGED
    )

    subject(engage_event)

    subject(engage_event)

    decoy.verify(engine_store.engine.estop(maintenance_run=False), times=1)

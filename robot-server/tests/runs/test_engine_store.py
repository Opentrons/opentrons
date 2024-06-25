"""Tests for the EngineStore interface."""
from datetime import datetime
import pytest
from decoy import Decoy, matchers

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI, API
from opentrons.hardware_control.types import EstopStateNotification, EstopState
from opentrons.protocol_engine import (
    StateSummary,
    types as pe_types,
)
from opentrons.protocol_runner import RunResult, RunOrchestrator
from opentrons.protocol_reader import ProtocolReader, ProtocolSource

from robot_server.runs.engine_store import (
    EngineStore,
    EngineConflictError,
    NoRunOrchestrator,
    handle_estop_event,
)


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
async def subject(decoy: Decoy, hardware_api: HardwareControlAPI) -> EngineStore:
    """Get a EngineStore test subject."""
    return EngineStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot and deck type. Tests where these matter should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
        deck_type=pe_types.DeckType.OT2_SHORT_TRASH,
    )


@pytest.fixture
async def json_protocol_source() -> ProtocolSource:
    """Get a protocol source fixture."""
    simple_protocol = (
        get_shared_data_root() / "protocol" / "fixtures" / "6" / "simpleV6.json"
    )
    return await ProtocolReader().read_saved(files=[simple_protocol], directory=None)


async def test_create_engine(decoy: Decoy, subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(
        run_id="run-id",
        labware_offsets=[],
        protocol=None,
        deck_configuration=[],
        notify_publishers=mock_notify_publishers,
    )

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert subject._run_orchestrator is not None
    assert isinstance(subject._run_orchestrator, RunOrchestrator)


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

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )

    assert subject._run_orchestrator is not None


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
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
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
    await subject.create(
        run_id="run-id-1",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )

    with pytest.raises(EngineConflictError):
        await subject.create(
            run_id="run-id-2",
            labware_offsets=[],
            deck_configuration=[],
            protocol=None,
            notify_publishers=mock_notify_publishers,
        )

    assert subject.current_run_id == "run-id-1"


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None
    result = await subject.clear()

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_clear_engine_not_stopped_or_idle(
    subject: EngineStore, json_protocol_source: ProtocolSource
) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None
    subject._run_orchestrator.play(deck_configuration=[])
    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: EngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_get_default_orchestrator_idempotent(subject: EngineStore) -> None:
    """It should create and retrieve the same default ProtocolEngine."""
    result = await subject.get_default_orchestrator()
    repeated_result = await subject.get_default_orchestrator()

    assert isinstance(result, RunOrchestrator)
    assert repeated_result is result


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_get_default_orchestrator_robot_type(
    decoy: Decoy, robot_type: RobotType, deck_type: pe_types.DeckType
) -> None:
    """It should create default ProtocolEngines with the given robot and deck type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = EngineStore(
        hardware_api=hardware_api,
        robot_type=robot_type,
        deck_type=deck_type,
    )

    result = await subject.get_default_orchestrator()

    assert result.get_robot_type() == robot_type


async def test_get_default_orchestrator_current_unstarted(subject: EngineStore) -> None:
    """It should allow a default engine if another engine current but unstarted."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )

    result = await subject.get_default_orchestrator()
    assert isinstance(result, RunOrchestrator)


async def test_get_default_orchestrator_conflict(subject: EngineStore) -> None:
    """It should not allow a default engine if another engine is executing commands."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )
    subject.play()

    with pytest.raises(EngineConflictError):
        await subject.get_default_orchestrator()


async def test_get_default_orchestrator_run_stopped(subject: EngineStore) -> None:
    """It allow a default engine if another engine is terminal."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        deck_configuration=[],
        protocol=None,
        notify_publishers=mock_notify_publishers,
    )
    await subject.finish(error=None)

    result = await subject.get_default_orchestrator()
    assert isinstance(result, RunOrchestrator)


async def test_estop_callback(
    decoy: Decoy,
) -> None:
    """The callback should stop an active engine."""
    engine_store = decoy.mock(cls=EngineStore)

    disengage_event = EstopStateNotification(
        old_state=EstopState.PHYSICALLY_ENGAGED, new_state=EstopState.LOGICALLY_ENGAGED
    )
    engage_event = EstopStateNotification(
        old_state=EstopState.LOGICALLY_ENGAGED, new_state=EstopState.PHYSICALLY_ENGAGED
    )

    decoy.when(engine_store.current_run_id).then_return(None)
    await handle_estop_event(engine_store, disengage_event)
    assert engine_store.run_orchestrator is not None
    decoy.verify(
        engine_store.run_orchestrator.estop(),
        ignore_extra_args=True,
        times=0,
    )
    decoy.verify(
        await engine_store.finish(error=None),
        ignore_extra_args=True,
        times=0,
    )

    decoy.when(engine_store.current_run_id).then_return("fake-run-id")
    await handle_estop_event(engine_store, engage_event)
    assert engine_store._run_orchestrator is not None
    decoy.verify(
        engine_store.run_orchestrator.estop(),
        await engine_store.run_orchestrator.finish(
            error=matchers.IsA(EStopActivatedError)
        ),
        times=1,
    )

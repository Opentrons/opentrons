"""Tests for the MaintenanceEngineStore interface."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.types import DeckSlotName
from opentrons.hardware_control import API
from opentrons.hardware_control.types import EstopStateNotification, EstopState
from opentrons.protocol_engine import (
    StateSummary,
    types as pe_types,
)
from opentrons.protocol_runner import RunResult

from robot_server.maintenance_runs.maintenance_engine_store import (
    MaintenanceEngineStore,
    EngineConflictError,
    handle_estop_event,
    NoRunOrchestrator,
)


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
async def subject(decoy: Decoy) -> MaintenanceEngineStore:
    """Get a MaintenanceEngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    return MaintenanceEngineStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot and deck type. Tests where these matter should
        # construct their own MaintenanceEngineStore.
        robot_type="OT-2 Standard",
        deck_type=pe_types.DeckType.OT2_SHORT_TRASH,
    )


async def test_create_engine(subject: MaintenanceEngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(
        run_id="run-id",
        labware_offsets=[],
        created_at=datetime(2023, 1, 1),
        notify_publishers=mock_notify_publishers,
    )

    assert subject.current_run_id == "run-id"
    assert subject.current_run_created_at is not None
    assert isinstance(result, StateSummary)
    assert subject.run_orchestrator.get_protocol_runner() is None


def test_run_created_at_raises(subject: MaintenanceEngineStore) -> None:
    """Should raise that the run has not yet created."""
    with pytest.raises(AssertionError):
        subject.current_run_created_at


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_create_engine_uses_robot_and_deck_type(
    decoy: Decoy, robot_type: RobotType, deck_type: pe_types.DeckType
) -> None:
    """It should create ProtocolEngines with the given robot and deck type."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = MaintenanceEngineStore(
        hardware_api=hardware_api,
        robot_type=robot_type,
        deck_type=deck_type,
    )

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        created_at=datetime(2023, 4, 1),
        notify_publishers=mock_notify_publishers,
    )

    assert subject.run_orchestrator.get_robot_type() == robot_type
    assert subject.run_orchestrator.get_deck_type() == deck_type


async def test_create_engine_with_labware_offsets(
    subject: MaintenanceEngineStore,
) -> None:
    """It should create an engine for a run with labware offsets."""
    labware_offset = pe_types.LabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[labware_offset],
        created_at=datetime(2023, 1, 1),
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


async def test_clear_engine(subject: MaintenanceEngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        created_at=datetime(2023, 5, 1),
        notify_publishers=mock_notify_publishers,
    )
    await subject.run_orchestrator.run(deck_configuration=[])
    result = await subject.clear()

    assert subject.current_run_id is None
    assert subject._created_at is None
    assert isinstance(result, RunResult)

    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_clear_engine_not_stopped_or_idle(
    subject: MaintenanceEngineStore,
) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        created_at=datetime(2023, 6, 1),
        notify_publishers=mock_notify_publishers,
    )
    subject.run_orchestrator.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: MaintenanceEngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        created_at=datetime(2023, 7, 1),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_estop_callback(
    decoy: Decoy,
) -> None:
    """The callback should stop an active engine."""
    engine_store = decoy.mock(cls=MaintenanceEngineStore)

    disengage_event = EstopStateNotification(
        old_state=EstopState.PHYSICALLY_ENGAGED, new_state=EstopState.LOGICALLY_ENGAGED
    )
    engage_event = EstopStateNotification(
        old_state=EstopState.LOGICALLY_ENGAGED, new_state=EstopState.PHYSICALLY_ENGAGED
    )

    decoy.when(engine_store.current_run_id).then_return(None)
    await handle_estop_event(engine_store, disengage_event)
    decoy.verify(
        engine_store.run_orchestrator.estop(),
        ignore_extra_args=True,
        times=0,
    )
    decoy.verify(
        await engine_store.run_orchestrator.finish(),
        ignore_extra_args=True,
        times=0,
    )

    decoy.when(engine_store.current_run_id).then_return("fake-run-id")
    await handle_estop_event(engine_store, engage_event)
    decoy.verify(
        engine_store.run_orchestrator.estop(),
        await engine_store.run_orchestrator.finish(
            error=matchers.IsA(EStopActivatedError)
        ),
        times=1,
    )

"""Tests for the MaintenanceEngineStore interface."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName
from opentrons.hardware_control import API
from opentrons.hardware_control.types import EstopStateNotification, EstopState
from opentrons.protocol_engine import (
    ProtocolEngine,
    StateSummary,
    types as pe_types,
)
from opentrons.protocol_runner import LiveRunner, RunResult

from robot_server.maintenance_runs.maintenance_engine_store import (
    MaintenanceEngineStore,
    EngineConflictError,
    NoRunnerEnginePairError,
    get_estop_listener,
)


@pytest.fixture
def subject(decoy: Decoy) -> MaintenanceEngineStore:
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
        run_id="run-id", labware_offsets=[], created_at=datetime(2023, 1, 1)
    )

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert isinstance(subject.runner, LiveRunner)
    assert isinstance(subject.engine, ProtocolEngine)


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
        run_id="run-id", labware_offsets=[], created_at=datetime(2023, 4, 1)
    )

    assert subject.engine.state_view.config.robot_type == robot_type
    assert subject.engine.state_view.config.deck_type == deck_type


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
        run_id="run-id", labware_offsets=[], created_at=datetime(2023, 5, 1)
    )
    await subject.runner.run(deck_configuration=[])
    result = await subject.clear()

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(NoRunnerEnginePairError):
        subject.engine

    with pytest.raises(NoRunnerEnginePairError):
        subject.runner


async def test_clear_engine_not_stopped_or_idle(
    subject: MaintenanceEngineStore,
) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(
        run_id="run-id", labware_offsets=[], created_at=datetime(2023, 6, 1)
    )
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: MaintenanceEngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(
        run_id="run-id", labware_offsets=[], created_at=datetime(2023, 7, 1)
    )
    assert subject.engine is not None
    assert subject.runner is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(NoRunnerEnginePairError):
        subject.engine
    with pytest.raises(NoRunnerEnginePairError):
        subject.runner


async def test_estop_callback(
    decoy: Decoy,
) -> None:
    """The callback should stop an active engine."""
    engine_store = decoy.mock(cls=MaintenanceEngineStore)

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

    decoy.verify(engine_store.engine.estop(maintenance_run=True), times=1)

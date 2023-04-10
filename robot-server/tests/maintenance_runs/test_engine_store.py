"""Tests for the EngineStore interface."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import ProtocolEngine, StateSummary, types as pe_types
from opentrons.protocol_runner import LiveRunner, RunResult

from robot_server.maintenance_runs.maintenance_engine_store import (
    EngineStore,
    EngineConflictError,
)


@pytest.fixture
def subject(decoy: Decoy) -> EngineStore:
    """Get a EngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareControlAPI)
    return EngineStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot_type. Tests where robot_type matters should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
    )


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(run_id="run-id", labware_offsets=[])

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

    await subject.create(run_id="run-id", labware_offsets=[])

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
    await subject.create(run_id="run-id-1", labware_offsets=[])

    with pytest.raises(EngineConflictError):
        await subject.create(run_id="run-id-2", labware_offsets=[])

    assert subject.current_run_id == "run-id-1"


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(run_id="run-id", labware_offsets=[])
    await subject.runner.run()
    result = await subject.clear()

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(AssertionError):
        subject.engine

    with pytest.raises(AssertionError):
        subject.runner


async def test_clear_engine_not_stopped_or_idle(subject: EngineStore) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(run_id="run-id", labware_offsets=[])
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: EngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(run_id="run-id", labware_offsets=[])
    assert subject.engine is not None
    assert subject.runner is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(AssertionError):
        subject.engine
    with pytest.raises(AssertionError):
        subject.runner

"""Tests for the EngineStore interface."""

from datetime import datetime
from textwrap import dedent
from pathlib import Path
import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.robot.types import RobotType

from opentrons.protocol_engine.error_recovery_policy import never_recover
from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.types import DeckSlotName
from opentrons.hardware_control import HardwareControlAPI, API
from opentrons.hardware_control.types import EstopStateNotification, EstopState
from opentrons.protocol_engine import (
    StateSummary,
    types as pe_types,
)
from opentrons.protocol_runner import RunResult, RunOrchestrator
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_engine.resources import FileProvider

from robot_server.runs.run_orchestrator_store import (
    RunOrchestratorStore,
    RunConflictError,
    NoRunOrchestrator,
    handle_estop_event,
)
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.protocols.protocol_models import ProtocolKind


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
async def subject(
    decoy: Decoy, hardware_api: HardwareControlAPI
) -> RunOrchestratorStore:
    """Get a EngineStore test subject."""
    return RunOrchestratorStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot and deck type. Tests where these matter should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
        deck_type=pe_types.DeckType.OT2_SHORT_TRASH,
    )


@pytest.fixture
async def bad_python_protocol_source(tmp_path: Path) -> ProtocolResource:
    """Get a protocol source for a bad python protocol."""
    with open(tmp_path / "bad_protocol.py", "w") as proto:
        proto.write(
            dedent(
                """
    requirements = {'apiLevel': '2.20', 'robotType': 'Flex'}
    a = 1/0

    def run(ctx):
        pass
    """
            )
        )
    return ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime.now(),
        source=(
            await ProtocolReader().read_saved(
                files=[tmp_path / "bad_protocol.py"], directory=None
            )
        ),
        protocol_kind=ProtocolKind.STANDARD,
        protocol_key="some-name",
    )


async def test_create_engine(decoy: Decoy, subject: RunOrchestratorStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        protocol=None,
        file_provider=FileProvider(),
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
    subject = RunOrchestratorStore(
        hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
    )

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )

    assert subject._run_orchestrator is not None


async def test_create_engine_with_labware_offsets(
    subject: RunOrchestratorStore,
) -> None:
    """It should create an engine for a run with labware offsets."""
    labware_offset = pe_types.LegacyLabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[labware_offset],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )

    assert result.labwareOffsets == [
        pe_types.LabwareOffset.model_construct(
            id=matchers.IsA(str),
            createdAt=matchers.IsA(datetime),
            definitionUri="namespace/load_name/version",
            location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
            locationSequence=[
                pe_types.OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="5"
                )
            ],
            vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
        )
    ]


async def test_archives_state_if_engine_already_exists(
    subject: RunOrchestratorStore,
) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create(
        run_id="run-id-1",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )

    with pytest.raises(RunConflictError):
        await subject.create(
            run_id="run-id-2",
            labware_offsets=[],
            initial_error_recovery_policy=never_recover,
            deck_configuration=[],
            protocol=None,
            file_provider=FileProvider(),
            notify_publishers=mock_notify_publishers,
        )

    assert subject.current_run_id == "run-id-1"


async def test_create_does_not_store_orchestrator_on_load_failure(
    subject: RunOrchestratorStore, bad_python_protocol_source: ProtocolResource
) -> None:
    """It should not store an orchestrator unless it could be loaded."""
    with pytest.raises(ZeroDivisionError):
        await subject.create(
            run_id="run-id",
            labware_offsets=[],
            initial_error_recovery_policy=never_recover,
            deck_configuration=[],
            protocol=bad_python_protocol_source,
            file_provider=FileProvider(),
            notify_publishers=mock_notify_publishers,
        )
    assert subject.current_run_id is None


async def test_clear_engine(subject: RunOrchestratorStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None
    engine = subject._run_orchestrator._protocol_engine
    engine.state_view.state.commands.command_history._queued_command_ids.add("1231")
    result = await subject.clear()
    assert (
        len(engine.state_view.state.commands.command_history._queued_command_ids) == 0
    )

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_clear_engine_not_stopped_or_idle(subject: RunOrchestratorStore) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None
    subject._run_orchestrator.play(deck_configuration=[])
    with pytest.raises(RunConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: RunOrchestratorStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_orchestrator is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(NoRunOrchestrator):
        subject.run_orchestrator


async def test_get_default_orchestrator_idempotent(
    subject: RunOrchestratorStore,
) -> None:
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
    subject = RunOrchestratorStore(
        hardware_api=hardware_api,
        robot_type=robot_type,
        deck_type=deck_type,
    )

    result = await subject.get_default_orchestrator()

    assert result.get_robot_type() == robot_type


async def test_get_default_orchestrator_current_unstarted(
    subject: RunOrchestratorStore,
) -> None:
    """It should allow a default engine if another engine current but unstarted."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )

    result = await subject.get_default_orchestrator()
    assert isinstance(result, RunOrchestrator)


async def test_get_default_orchestrator_conflict(subject: RunOrchestratorStore) -> None:
    """It should not allow a default engine if another engine is executing commands."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )
    subject.play()

    with pytest.raises(RunConflictError):
        await subject.get_default_orchestrator()


async def test_get_default_orchestrator_run_stopped(
    subject: RunOrchestratorStore,
) -> None:
    """It allow a default engine if another engine is terminal."""
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        notify_publishers=mock_notify_publishers,
    )
    await subject.finish(error=None)

    result = await subject.get_default_orchestrator()
    assert isinstance(result, RunOrchestrator)


async def test_estop_callback(
    decoy: Decoy,
) -> None:
    """The callback should stop an active engine."""
    run_orchestrator_store = decoy.mock(cls=RunOrchestratorStore)

    disengage_event = EstopStateNotification(
        old_state=EstopState.PHYSICALLY_ENGAGED, new_state=EstopState.LOGICALLY_ENGAGED
    )
    engage_event = EstopStateNotification(
        old_state=EstopState.LOGICALLY_ENGAGED, new_state=EstopState.PHYSICALLY_ENGAGED
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return(None)
    await handle_estop_event(run_orchestrator_store, disengage_event)
    assert run_orchestrator_store.run_orchestrator is not None
    decoy.verify(
        run_orchestrator_store.run_orchestrator.estop(),
        ignore_extra_args=True,
        times=0,
    )
    decoy.verify(
        await run_orchestrator_store.finish(error=None),
        ignore_extra_args=True,
        times=0,
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return("fake-run-id")
    await handle_estop_event(run_orchestrator_store, engage_event)
    assert run_orchestrator_store._run_orchestrator is not None
    decoy.verify(
        run_orchestrator_store.run_orchestrator.estop(),
        await run_orchestrator_store.run_orchestrator.finish(
            error=matchers.IsA(EStopActivatedError)
        ),
        times=1,
    )

"""Tests for the EngineStore interface."""

from datetime import datetime
from pathlib import Path
from textwrap import dedent

import pytest
from decoy import Decoy, matchers

from opentrons.config import feature_flags
from opentrons.hardware_control import API, HardwareControlAPI
from opentrons.hardware_control.modules.types import TemperatureModuleModel
from opentrons.hardware_control.types import (
    AsynchronousModuleErrorNotification,
    EstopState,
    EstopStateNotification,
)
from opentrons.protocol_engine import (
    StateSummary,
)
from opentrons.protocol_engine import (
    types as pe_types,
)
from opentrons.protocol_engine.error_recovery_policy import never_recover
from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.protocol_engine.resources import CameraProvider, FileProvider
from opentrons.protocol_reader import ProtocolReader
from opentrons.protocol_runner import RunOrchestrator, RunResult
from opentrons.types import DeckSlotName
from opentrons_shared_data.errors.exceptions import ModuleCommunicationError
from opentrons_shared_data.robot.types import RobotType

from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs.run_orchestrator_store import (
    NoRunCoordinator,
    RunConflictError,
    RunOrchestratorStore,
    handle_hardware_event,
)
from robot_server.runs.run_process_pyro_provider import RunProcessPyroProvider


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def mock_run_process_pyro_provider(decoy: Decoy) -> RunProcessPyroProvider:
    """A mock RunProcessPyroProvider."""
    return decoy.mock(cls=RunProcessPyroProvider)


@pytest.fixture
async def subject(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
) -> RunOrchestratorStore:
    """Get a EngineStore test subject."""
    return RunOrchestratorStore(
        hardware_api=hardware_api,
        # Arbitrary choice of robot and deck type. Tests where these matter should
        # construct their own EngineStore.
        robot_type="OT-2 Standard",
        deck_type=pe_types.DeckType.OT2_SHORT_TRASH,
        run_process_pyro_provider=mock_run_process_pyro_provider,
        access_control_status=False,
    )


@pytest.fixture
async def bad_python_protocol_source(tmp_path: Path) -> ProtocolResource:
    """Get a protocol source for a bad python protocol."""
    with open(tmp_path / "bad_protocol.py", "w") as proto:
        proto.write(
            dedent("""
    requirements = {'apiLevel': '2.20', 'robotType': 'Flex'}
    a = 1/0

    def run(ctx):
        pass
    """)
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


async def test_create_engine(
    decoy: Decoy, subject: RunOrchestratorStore, mock_feature_flags: None
) -> None:
    """It should create an engine for a run."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    result = await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        deck_configuration=[],
        notify_publishers=mock_notify_publishers,
    )

    assert subject.current_run_id == "run-id"
    assert isinstance(result, StateSummary)
    assert subject._run_coordinator is not None
    assert isinstance(subject._run_coordinator, RunOrchestrator)


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_create_engine_uses_robot_type(
    decoy: Decoy,
    robot_type: RobotType,
    deck_type: pe_types.DeckType,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    mock_feature_flags: None,
) -> None:
    """It should create ProtocolEngines with the given robot and deck type."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = RunOrchestratorStore(
        hardware_api=hardware_api,
        robot_type=robot_type,
        deck_type=deck_type,
        run_process_pyro_provider=mock_run_process_pyro_provider,
        access_control_status=False,
    )

    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )

    assert subject._run_coordinator is not None


async def test_create_engine_with_labware_offsets(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should create an engine for a run with labware offsets."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    labware_offset = pe_types.LegacyLabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    result = await subject.create(
        run_id="run-id",
        labware_offsets=[labware_offset],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
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
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should not create more than one engine / runner pair."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id-1",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )

    with pytest.raises(RunConflictError):
        await subject.create(
            run_id="run-id-2",
            labware_offsets=[],
            initial_error_recovery_policy=never_recover,
            error_recovery_rules=[],
            error_recovery_is_enabled=False,
            deck_configuration=[],
            protocol=None,
            file_provider=FileProvider(),
            camera_provider=CameraProvider(),
            notify_publishers=mock_notify_publishers,
        )

    assert subject.current_run_id == "run-id-1"


async def test_create_does_not_store_orchestrator_on_load_failure(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    bad_python_protocol_source: ProtocolResource,
    mock_feature_flags: None,
) -> None:
    """It should not store an orchestrator unless it could be loaded."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    with pytest.raises(ZeroDivisionError):
        await subject.create(
            run_id="run-id",
            labware_offsets=[],
            initial_error_recovery_policy=never_recover,
            error_recovery_rules=[],
            error_recovery_is_enabled=False,
            deck_configuration=[],
            protocol=bad_python_protocol_source,
            file_provider=FileProvider(),
            camera_provider=CameraProvider(),
            notify_publishers=mock_notify_publishers,
        )
    assert subject.current_run_id is None


async def test_clear_engine(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should clear a stored engine entry."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_coordinator is not None
    subject._run_result = RunResult(
        commands=await subject._run_coordinator.get_all_commands(),
        state_summary=await subject._run_coordinator.get_state_summary(),
        parameters=await subject._run_coordinator.get_run_time_parameters(),
        command_annotations=await subject._run_coordinator.get_all_command_annotations(),
        command_preconditions=await subject._run_coordinator.get_preconditions(),
    )
    engine = subject._run_coordinator._protocol_engine  # type: ignore[union-attr]
    engine.state_view.state.commands.command_history._queued_command_ids.add("1231")
    result = await subject.clear()
    assert (
        len(engine.state_view.state.commands.command_history._queued_command_ids) == 0
    )

    assert subject.current_run_id is None
    assert isinstance(result, RunResult)

    with pytest.raises(NoRunCoordinator):
        subject.run_coordinator


async def test_clear_engine_not_stopped_or_idle(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should raise a conflict if the engine is not stopped."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_coordinator is not None
    await subject._run_coordinator.play(deck_configuration=[])
    with pytest.raises(RunConflictError):
        await subject.clear()


async def test_clear_idle_engine(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should successfully clear engine if idle (not started)."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )
    assert subject._run_coordinator is not None
    subject._run_result = RunResult(
        commands=await subject._run_coordinator.get_all_commands(),
        state_summary=await subject._run_coordinator.get_state_summary(),
        parameters=await subject._run_coordinator.get_run_time_parameters(),
        command_annotations=await subject._run_coordinator.get_all_command_annotations(),
        command_preconditions=await subject._run_coordinator.get_preconditions(),
    )

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(NoRunCoordinator):
        subject.run_coordinator


async def test_get_default_orchestrator_idempotent(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should create and retrieve the same default ProtocolEngine."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    result = await subject.get_default_orchestrator()
    repeated_result = await subject.get_default_orchestrator()

    assert isinstance(result, RunOrchestrator)
    assert repeated_result is result


@pytest.mark.parametrize("robot_type", ["OT-2 Standard", "OT-3 Standard"])
@pytest.mark.parametrize("deck_type", pe_types.DeckType)
async def test_get_default_orchestrator_robot_type(
    decoy: Decoy,
    robot_type: RobotType,
    deck_type: pe_types.DeckType,
    mock_run_process_pyro_provider: RunProcessPyroProvider,
    mock_feature_flags: None,
) -> None:
    """It should create default ProtocolEngines with the given robot and deck type."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=API)
    subject = RunOrchestratorStore(
        hardware_api=hardware_api,
        robot_type=robot_type,
        deck_type=deck_type,
        run_process_pyro_provider=mock_run_process_pyro_provider,
        access_control_status=False,
    )

    result = await subject.get_default_orchestrator()

    assert result.get_robot_type() == robot_type


async def test_get_default_orchestrator_current_unstarted(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should allow a default engine if another engine current but unstarted."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )

    result = await subject.get_default_orchestrator()
    assert isinstance(result, RunOrchestrator)


async def test_get_default_orchestrator_conflict(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It should not allow a default engine if another engine is executing commands."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
        notify_publishers=mock_notify_publishers,
    )
    await subject.play()

    with pytest.raises(RunConflictError):
        await subject.get_default_orchestrator()


async def test_get_default_orchestrator_run_stopped(
    decoy: Decoy,
    subject: RunOrchestratorStore,
    mock_feature_flags: None,
) -> None:
    """It allow a default engine if another engine is terminal."""
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    await subject.create(
        run_id="run-id",
        labware_offsets=[],
        initial_error_recovery_policy=never_recover,
        error_recovery_rules=[],
        error_recovery_is_enabled=False,
        deck_configuration=[],
        protocol=None,
        file_provider=FileProvider(),
        camera_provider=CameraProvider(),
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
    decoy.when(run_orchestrator_store.run_coordinator).then_return(
        decoy.mock(cls=RunOrchestrator)
    )

    disengage_event = EstopStateNotification(
        old_state=EstopState.PHYSICALLY_ENGAGED, new_state=EstopState.LOGICALLY_ENGAGED
    )
    engage_event = EstopStateNotification(
        old_state=EstopState.LOGICALLY_ENGAGED, new_state=EstopState.PHYSICALLY_ENGAGED
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return(None)
    await handle_hardware_event(run_orchestrator_store, disengage_event)
    assert run_orchestrator_store.run_coordinator is not None
    decoy.verify(
        await run_orchestrator_store.run_coordinator.estop(),
        ignore_extra_args=True,
        times=0,
    )
    decoy.verify(
        await run_orchestrator_store.finish(error=None),
        ignore_extra_args=True,
        times=0,
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return("fake-run-id")
    await handle_hardware_event(run_orchestrator_store, engage_event)
    assert run_orchestrator_store._run_coordinator is not None
    decoy.verify(
        await run_orchestrator_store.run_coordinator.estop(),
        await run_orchestrator_store.run_coordinator.finish(
            error=matchers.IsA(EStopActivatedError)
        ),
        times=1,
    )


async def test_async_module_callback_noops_with_no_engine(decoy: Decoy) -> None:
    """It should noop without a run."""
    run_orchestrator_store = decoy.mock(cls=RunOrchestratorStore)
    decoy.when(run_orchestrator_store.run_coordinator).then_return(
        decoy.mock(cls=RunOrchestrator)
    )

    exc = ModuleCommunicationError()
    error_event = AsynchronousModuleErrorNotification(
        exception=exc,
        module_serial="some-serial",
        module_model=TemperatureModuleModel.TEMPERATURE_V2,
        port="some-port",
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return(None)
    await handle_hardware_event(run_orchestrator_store, error_event)
    assert run_orchestrator_store.run_coordinator is not None
    decoy.verify(
        await run_orchestrator_store.run_coordinator.asynchronous_module_error(
            module_model=matchers.Anything(), module_serial=matchers.Anything()
        ),
        times=0,
    )
    decoy.verify(
        await run_orchestrator_store.finish(error=None),
        ignore_extra_args=True,
        times=0,
    )


async def test_async_module_callback_noops_if_engine_says_no(decoy: Decoy) -> None:
    """It shouldn't finish if the engine doesn't want it to."""
    run_orchestrator_store = decoy.mock(cls=RunOrchestratorStore)
    decoy.when(run_orchestrator_store.run_coordinator).then_return(
        decoy.mock(cls=RunOrchestrator)
    )

    exc = ModuleCommunicationError()
    error_event = AsynchronousModuleErrorNotification(
        exception=exc,
        module_serial="some-serial",
        module_model=TemperatureModuleModel.TEMPERATURE_V2,
        port="some-port",
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return("fake-run-id")
    decoy.when(
        await run_orchestrator_store.run_coordinator.asynchronous_module_error(
            module_model=TemperatureModuleModel.TEMPERATURE_V2,
            module_serial="some-serial",
            error=exc,
        )
    ).then_return(False)
    await handle_hardware_event(run_orchestrator_store, error_event)
    assert run_orchestrator_store._run_coordinator is not None
    decoy.verify(
        await run_orchestrator_store.run_coordinator.finish(error=None),
        ignore_extra_args=True,
        times=0,
    )


async def test_async_module_callback_finishes_if_engine_says_so(decoy: Decoy) -> None:
    """It should finish with the error if the engine says it should."""
    run_orchestrator_store = decoy.mock(cls=RunOrchestratorStore)
    decoy.when(run_orchestrator_store.run_coordinator).then_return(
        decoy.mock(cls=RunOrchestrator)
    )

    exc = ModuleCommunicationError()
    error_event = AsynchronousModuleErrorNotification(
        exception=exc,
        module_serial="some-serial",
        module_model=TemperatureModuleModel.TEMPERATURE_V2,
        port="some-port",
    )
    decoy.when(run_orchestrator_store.current_run_id).then_return("fake-run-id")

    decoy.when(
        await run_orchestrator_store.run_coordinator.asynchronous_module_error(
            module_model=TemperatureModuleModel.TEMPERATURE_V2,
            module_serial="some-serial",
            error=exc,
        )
    ).then_return(True)
    await handle_hardware_event(run_orchestrator_store, error_event)
    assert run_orchestrator_store._run_coordinator is not None
    decoy.verify(
        await run_orchestrator_store.run_coordinator.finish(error=exc),
    )

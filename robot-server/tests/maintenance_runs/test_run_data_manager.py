"""Tests for RunDataManager."""

import inspect
from datetime import datetime

import pytest
from decoy import Decoy

from opentrons.config import feature_flags
from opentrons.protocol_engine import (
    CommandSlice,
    EngineStatus,
    ErrorOccurrence,
    LabwareOffset,
    Liquid,
    LoadedLabware,
    LoadedModule,
    LoadedPeripheral,
    LoadedPipette,
    StateSummary,
    commands,
)
from opentrons.protocol_engine import (
    types as pe_types,
)
from opentrons.protocol_engine.resources import CameraProvider
from opentrons.types import DeckSlotName
from opentrons_shared_data.robot.types import RobotTypeEnum

from robot_server.camera.provider import CameraProviderWrapper
from robot_server.maintenance_runs.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from robot_server.maintenance_runs.maintenance_run_models import (
    MaintenanceRun,
    MaintenanceRunNotFoundError,
)
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
    RunConflictError,
)
from robot_server.service.notifications import (
    MaintenanceRunsPublisher,
)


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def mock_maintenance_run_orchestrator_store(
    decoy: Decoy,
) -> MaintenanceRunOrchestratorStore:
    """Get a mock MaintenanceRunOrchestratorStore."""
    mock = decoy.mock(cls=MaintenanceRunOrchestratorStore)
    decoy.when(mock.current_run_id).then_return(None)
    return mock


@pytest.fixture
def mock_maintenance_runs_publisher(decoy: Decoy) -> MaintenanceRunsPublisher:
    """Get a mock MaintenanceRunsPublisher."""
    mock = decoy.mock(cls=MaintenanceRunsPublisher)
    return mock


@pytest.fixture
def engine_state_summary() -> StateSummary:
    """Get a StateSummary value object."""
    return StateSummary(
        status=EngineStatus.IDLE,
        errors=[ErrorOccurrence.model_construct(id="some-error-id")],  # type: ignore[call-arg]
        hasEverEnteredErrorRecovery=False,
        labware=[LoadedLabware.model_construct(id="some-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.model_construct(id="some-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.model_construct(id="some-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.model_construct(id="some-module-id")],  # type: ignore[call-arg]
        peripherals=[LoadedPeripheral.model_construct(id="some-module-id")],  # type: ignore[call-arg]
        liquids=[
            Liquid.model_construct(
                id="some-liquid-id", displayName="liquid", description="desc"
            )
        ],
        liquidClasses=[],
        wells=[],
    )


@pytest.fixture
def run_command() -> commands.Command:
    """Get a ProtocolEngine Command value object."""
    return commands.WaitForResume(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=commands.CommandStatus.SUCCEEDED,
        params=commands.WaitForResumeParams(message="Hello"),
    )


@pytest.fixture
def subject(
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_maintenance_runs_publisher: MaintenanceRunsPublisher,
) -> MaintenanceRunDataManager:
    """Get a MaintenanceRunDataManager test subject."""
    return MaintenanceRunDataManager(
        run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        maintenance_runs_publisher=mock_maintenance_runs_publisher,
    )


@pytest.fixture()
def mock_camera_provider_wrapper(decoy: Decoy) -> CameraProviderWrapper:
    """Return a mock CameraProviderWrapper."""
    return decoy.mock(cls=CameraProviderWrapper)


@pytest.fixture()
def mock_camera_provider(
    decoy: Decoy, mock_camera_provider_wrapper: CameraProviderWrapper
) -> CameraProvider:
    """Return a mock CameraProvider."""
    return decoy.mock(cls=CameraProvider)


@pytest.fixture
def mock_feature_flags(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Get a mocked feature flags."""
    for name, func in inspect.getmembers(feature_flags, inspect.isfunction):
        params = inspect.getfullargspec(func)
        mock_get_ff = decoy.mock(func=func)
        if any("robot_type" in p for p in params.args):
            decoy.when(mock_get_ff(RobotTypeEnum.FLEX)).then_return(False)
        else:
            decoy.when(mock_get_ff()).then_return(False)
        monkeypatch.setattr(feature_flags, name, mock_get_ff)


async def test_create(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
    mock_camera_provider: CameraProvider,
    mock_feature_flags: None,
) -> None:
    """It should create an engine and a persisted run resource."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.create(
            run_id=run_id,
            labware_offsets=[],
            created_at=created_at,
            deck_configuration=[],
            notify_publishers=mock_notify_publishers,
            proxy_of_callback_for_handling_door_events=None,
        )
    ).then_return(engine_state_summary)
    decoy.when(
        mock_maintenance_run_orchestrator_store.current_run_created_at
    ).then_return(created_at)
    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[],
        deck_configuration=[],
        notify_publishers=mock_notify_publishers,
        camera_provider=mock_camera_provider,
    )

    assert result == MaintenanceRun(
        id=run_id,
        createdAt=created_at,
        current=True,
        status=engine_state_summary.status,
        actions=[],
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
    )


async def test_create_with_options(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
    mock_camera_provider: CameraProvider,
    mock_feature_flags: None,
) -> None:
    """It should handle creation with labware offsets."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    labware_offset = pe_types.LegacyLabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    decoy.when(
        await mock_maintenance_run_orchestrator_store.create(
            run_id=run_id,
            labware_offsets=[labware_offset],
            created_at=created_at,
            deck_configuration=[],
            notify_publishers=mock_notify_publishers,
            proxy_of_callback_for_handling_door_events=None,
        )
    ).then_return(engine_state_summary)
    decoy.when(
        mock_maintenance_run_orchestrator_store.current_run_created_at
    ).then_return(created_at)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[labware_offset],
        deck_configuration=[],
        notify_publishers=mock_notify_publishers,
        camera_provider=mock_camera_provider,
    )

    assert result == MaintenanceRun(
        id=run_id,
        createdAt=created_at,
        current=True,
        status=engine_state_summary.status,
        actions=[],
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
    )


async def test_create_engine_error(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    subject: MaintenanceRunDataManager,
    mock_camera_provider: CameraProvider,
    mock_feature_flags: None,
) -> None:
    """It should not create a resource if engine creation fails."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_maintenance_run_orchestrator_store.create(
            run_id,
            labware_offsets=[],
            created_at=created_at,
            deck_configuration=[],
            notify_publishers=mock_notify_publishers,
            proxy_of_callback_for_handling_door_events=None,
        )
    ).then_raise(RunConflictError("oh no"))
    decoy.when(
        mock_maintenance_run_orchestrator_store.current_run_created_at
    ).then_return(created_at)

    with pytest.raises(RunConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
            deck_configuration=[],
            notify_publishers=mock_notify_publishers,
            camera_provider=mock_camera_provider,
        )


async def test_get_current_run(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
    mock_feature_flags: None,
) -> None:
    """It should get the current run from the engine."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"

    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        run_id
    )
    decoy.when(mock_maintenance_run_orchestrator_store.get_state_summary()).then_return(
        engine_state_summary
    )
    decoy.when(
        mock_maintenance_run_orchestrator_store.current_run_created_at
    ).then_return(datetime(2023, 1, 1))

    result = subject.get(run_id=run_id)

    assert result == MaintenanceRun(
        current=True,
        id=run_id,
        createdAt=datetime(2023, 1, 1),
        status=engine_state_summary.status,
        actions=[],
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
    )
    assert subject.current_run_id == run_id


async def test_get_run_not_current(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
    mock_feature_flags: None,
) -> None:
    """It should raise a MaintenanceRunNotFoundError."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"

    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        "not-current-id"
    )
    with pytest.raises(MaintenanceRunNotFoundError):
        subject.get(run_id=run_id)


async def test_delete_current_run(
    decoy: Decoy,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_camera_provider: CameraProvider,
    subject: MaintenanceRunDataManager,
    mock_feature_flags: None,
) -> None:
    """It should delete the current run from the engine."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        run_id
    )

    await subject.delete(
        run_id=run_id, camera_settings=None, camera_provider=mock_camera_provider
    )

    decoy.verify(
        await mock_maintenance_run_orchestrator_store.clear(),
    )


def test_get_commands_slice_current_run(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    run_command: commands.Command,
    mock_feature_flags: None,
) -> None:
    """Should get a sliced command list from engine store."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    expected_commands_result = [
        commands.WaitForResume(
            id="command-id-2",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            status=commands.CommandStatus.SUCCEEDED,
            params=commands.WaitForResumeParams(message="Hello"),
        ),
        run_command,
    ]

    expected_command_slice = CommandSlice(
        commands=expected_commands_result, cursor=1, total_length=3
    )
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        "run-id"
    )
    decoy.when(
        mock_maintenance_run_orchestrator_store.get_command_slice(1, 2)
    ).then_return(expected_command_slice)

    result = subject.get_commands_slice("run-id", 1, 2)

    assert expected_command_slice == result

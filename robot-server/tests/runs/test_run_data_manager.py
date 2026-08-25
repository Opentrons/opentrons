"""Tests for RunDataManager."""

from datetime import datetime
from typing import Dict, List
from unittest.mock import Mock, sentinel

import pytest
from decoy import Decoy, matchers

from opentrons import config
from opentrons.config import feature_flags
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine import (
    CommandErrorSlice,
    CommandPointer,
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
from opentrons.protocol_engine.resources import CameraProvider, FileProvider
from opentrons.protocol_engine.state.commands import CommandAnnotationsSlice
from opentrons.protocol_engine.types import (
    BooleanParameter,
    CommandAnnotation,
    CommandPreconditions,
    CSVParameter,
)
from opentrons.protocol_reader import ProtocolSource
from opentrons.protocol_runner import RunResult
from opentrons_shared_data.data_files import RunFileNameMetadata
from opentrons_shared_data.errors.exceptions import InvalidStoredData
from opentrons_shared_data.labware.labware_definition import LabwareDefinition2

from robot_server.access_control.settings.models import ResponseData
from robot_server.access_control.settings.store import AccessControlSettingStore
from robot_server.camera.provider import CameraProviderWrapper
from robot_server.camera.settings.store import CameraSettingStore
from robot_server.error_recovery.settings.store import ErrorRecoverySettingStore
from robot_server.file_provider.provider import (
    FileProviderExecutor,
)
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs import error_recovery_mapping
from robot_server.runs.error_recovery_models import ErrorRecoveryRule
from robot_server.runs.run_data_manager import (
    PreSerializedCommandsNotAvailableError,
    RunDataManager,
    RunNotCurrentError,
    RunSignoffRequiredError,
)
from robot_server.runs.run_models import BadRun, Run, RunDataError, RunNotFoundError
from robot_server.runs.run_orchestrator_store import (
    RunConflictError,
    RunOrchestratorStore,
)
from robot_server.runs.run_store import (
    BadStateSummary,
    CommandNotFoundError,
    RunResource,
    RunStore,
)
from robot_server.service.notifications import RunsPublisher


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def mock_run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=RunOrchestratorStore)
    decoy.when(mock.current_run_id).then_return(None)
    return mock


@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture
def mock_error_recovery_setting_store(decoy: Decoy) -> ErrorRecoverySettingStore:
    """Get a mock ErrorRecoverySettingStore."""
    return decoy.mock(cls=ErrorRecoverySettingStore)


@pytest.fixture
def mock_camera_setting_store(decoy: Decoy) -> CameraSettingStore:
    """Get a mock CameraSettingStore."""
    return decoy.mock(cls=CameraSettingStore)


@pytest.fixture
def mock_access_control_setting_store(decoy: Decoy) -> AccessControlSettingStore:
    """Get a mock AccessControlSettingStore."""
    return decoy.mock(cls=AccessControlSettingStore)


@pytest.fixture()
def mock_runs_publisher(decoy: Decoy) -> RunsPublisher:
    """Get a mock RunsPublisher."""
    return decoy.mock(cls=RunsPublisher)


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


@pytest.fixture(autouse=True)
def patch_error_recovery_mapping(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace the members of the error_recovery_mapping module with mocks."""
    monkeypatch.setattr(
        error_recovery_mapping,
        "create_error_recovery_policy_from_rules",
        decoy.mock(
            func=decoy.mock(
                func=error_recovery_mapping.create_error_recovery_policy_from_rules
            )
        ),
    )


@pytest.fixture
def run_time_parameters() -> List[pe_types.RunTimeParameter]:
    """Get a RunTimeParameter list."""
    return [
        pe_types.BooleanParameter(
            displayName="Display Name",
            variableName="variable_name",
            value=False,
            default=True,
        )
    ]


@pytest.fixture
def command_annotations() -> List[pe_types.CommandAnnotation]:
    """Get a CommandAnnotation list."""
    return [
        pe_types.CommandAnnotation(
            id="annotation-id",
            source="userCommand",
            name="My command annotation",
            description="This is a command annotation",
            params={},
        )
    ]


@pytest.fixture
def command_preconditions() -> CommandPreconditions:
    """Get a CommandPreconditions result."""
    return CommandPreconditions(isCameraUsed=False)


@pytest.fixture
def mock_nozzle_maps(decoy: Decoy) -> Dict[str, NozzleMap]:
    """Get a mock NozzleMap."""
    mock_nozzle_map = decoy.mock(cls=NozzleMap)
    return {"mock-pipette-id": mock_nozzle_map}


@pytest.fixture()
def mock_file_provider_wrapper(decoy: Decoy) -> FileProviderExecutor:
    """Return a mock FileProviderExecutor."""
    return decoy.mock(cls=FileProviderExecutor)


@pytest.fixture()
def mock_file_provider(
    decoy: Decoy, mock_file_provider_wrapper: FileProvider
) -> FileProvider:
    """Return a mock FileProvider."""
    return decoy.mock(cls=FileProvider)


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
def run_resource() -> RunResource:
    """Get a StateSummary value object."""
    return RunResource(
        ok=True,
        run_id="hello from the other side",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
        signed_by="Alice Example",
        log_period_id="123",
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
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    mock_camera_setting_store: CameraSettingStore,
    mock_access_control_setting_store: AccessControlSettingStore,
    mock_runs_publisher: RunsPublisher,
    mock_file_provider: FileProvider,
) -> RunDataManager:
    """Get a RunDataManager test subject."""
    return RunDataManager(
        run_orchestrator_store=mock_run_orchestrator_store,
        run_store=mock_run_store,
        error_recovery_setting_store=mock_error_recovery_setting_store,
        camera_setting_store=mock_camera_setting_store,
        access_control_setting_store=mock_access_control_setting_store,
        runs_publisher=mock_runs_publisher,
        file_provider=mock_file_provider,
    )


async def test_create(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
    mock_feature_flags: None,
) -> None:
    """It should create an engine and a persisted run resource."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)
    protocol_source = ProtocolSource.model_construct(
        directory=sentinel.directory,
        main_file=sentinel.main_file,
        content_hash=sentinel.content_hash,
        files=[Mock()],
        robot_type=sentinel.robot_type,
        config=sentinel.config,
        metadata={"protocolName": "test_protocol"},
    )
    protocol = ProtocolResource.model_construct(
        protocol_id=sentinel.protocol_id,
        created_at=datetime(year=2022, month=2, day=2),
        source=protocol_source,
        protocol_key=None,
        protocol_kind=ProtocolKind.STANDARD,
    )

    decoy.when(
        await mock_run_orchestrator_store.create(
            run_id=run_id,
            labware_offsets=sentinel.labware_offsets,
            initial_error_recovery_policy=sentinel.initial_error_recovery_policy,
            error_recovery_rules=[],
            error_recovery_is_enabled=sentinel.error_recovery_enabled,
            protocol=protocol,
            deck_configuration=sentinel.deck_configuration,
            file_provider=mock_file_provider,
            camera_provider=mock_camera_provider,
            run_time_param_values=sentinel.run_time_param_values,
            run_time_param_paths=sentinel.run_time_param_paths,
            notify_publishers=mock_notify_publishers,
        )
    ).then_return(engine_state_summary)

    decoy.when(await mock_run_orchestrator_store.get_run_time_parameters()).then_return(
        []
    )

    decoy.when(
        mock_run_store.insert(
            run_id=run_id,
            protocol_id=protocol.protocol_id,
            created_at=created_at,
            log_period_id="123",
        )
    ).then_return(run_resource)

    bool_parameter = BooleanParameter(
        displayName="foo", variableName="bar", default=True, value=False
    )
    file_parameter = CSVParameter(displayName="my_file", variableName="file-id")
    decoy.when(await mock_run_orchestrator_store.get_run_time_parameters()).then_return(
        [bool_parameter, file_parameter]
    )

    expected_initial_error_recovery_rules: list[ErrorRecoveryRule] = []
    decoy.when(mock_error_recovery_setting_store.get_is_enabled()).then_return(
        sentinel.error_recovery_enabled
    )
    decoy.when(
        error_recovery_mapping.create_error_recovery_policy_from_rules(
            rules=expected_initial_error_recovery_rules,
            enabled=sentinel.error_recovery_enabled,
        )
    ).then_return(sentinel.initial_error_recovery_policy)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=sentinel.labware_offsets,
        protocol=protocol,
        deck_configuration=sentinel.deck_configuration,
        camera_provider=mock_camera_provider,
        run_time_param_values=sentinel.run_time_param_values,
        run_time_param_paths=sentinel.run_time_param_paths,
        notify_publishers=mock_notify_publishers,
        access_control_status=False,
        log_period_id="123",
    )

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        logPeriodId="123",
        createdAt=run_resource.created_at,
        current=True,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
        runTimeParameters=[bool_parameter, file_parameter],
        outputFileIds=engine_state_summary.files,
        signedBy=run_resource.signed_by,
    )
    decoy.verify(
        mock_file_provider.set_run_metadata(
            RunFileNameMetadata(
                robot_name=config.name(),
                run_id=run_id,
                run_created_at=created_at,
                protocol_name="test_protocol",
            )
        )
    )
    decoy.verify(
        mock_run_store.insert_csv_rtp(
            run_id=run_id, run_time_parameters=[bool_parameter, file_parameter]
        )
    )


async def test_create_engine_error(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    subject: RunDataManager,
    mock_feature_flags: None,
) -> None:
    """It should not create a resource if engine creation fails."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    expected_initial_error_recovery_rules: list[ErrorRecoveryRule] = []
    decoy.when(mock_error_recovery_setting_store.get_is_enabled()).then_return(
        sentinel.error_recovery_enabled
    )
    decoy.when(
        error_recovery_mapping.create_error_recovery_policy_from_rules(
            rules=expected_initial_error_recovery_rules,
            enabled=sentinel.error_recovery_enabled,
        )
    ).then_return(sentinel.initial_error_recovery_policy)

    decoy.when(
        await mock_run_orchestrator_store.create(
            run_id,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            file_provider=mock_file_provider,
            camera_provider=mock_camera_provider,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
            initial_error_recovery_policy=matchers.Anything(),
            error_recovery_rules=[],
            error_recovery_is_enabled=sentinel.error_recovery_enabled,
        )
    ).then_raise(RunConflictError("oh no"))

    with pytest.raises(RunConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            log_period_id=None,
        )

    decoy.verify(
        mock_run_store.insert(
            run_id=run_id,
            created_at=matchers.Anything(),
            protocol_id=matchers.Anything(),
            log_period_id=matchers.Anything(),
        ),
        times=0,
    )


async def test_get_current_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)
    decoy.when(await mock_run_orchestrator_store.get_state_summary()).then_return(
        engine_state_summary
    )
    decoy.when(await mock_run_orchestrator_store.get_run_time_parameters()).then_return(
        run_time_parameters
    )

    result = await subject.get(run_id=run_id)

    assert result == Run(
        current=True,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        logPeriodId=run_resource.log_period_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
        runTimeParameters=run_time_parameters,
        outputFileIds=engine_state_summary.files,
        signedBy=run_resource.signed_by,
    )
    assert subject.current_run_id == run_id


async def test_get_historical_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_state_summary(run_id=run_id)).then_return(
        engine_state_summary
    )
    decoy.when(mock_run_store.get_run_time_parameters(run_id=run_id)).then_return(
        run_time_parameters
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("some other id")

    result = await subject.get(run_id=run_id)

    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        logPeriodId=run_resource.log_period_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
        runTimeParameters=run_time_parameters,
        outputFileIds=engine_state_summary.files,
        signedBy=run_resource.signed_by,
    )


async def test_get_historical_run_no_data(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    run_resource: RunResource,
    run_time_parameters: List[pe_types.RunTimeParameter],
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    state_exc = InvalidStoredData("Oh no!")
    run_error = RunDataError.from_exc(state_exc)
    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_state_summary(run_id=run_id)).then_return(
        BadStateSummary(dataError=state_exc)
    )
    decoy.when(mock_run_store.get_run_time_parameters(run_id=run_id)).then_return(
        run_time_parameters
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("some other id")

    result = await subject.get(run_id=run_id)

    assert result == BadRun(
        dataError=run_error,
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        logPeriodId=run_resource.log_period_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=EngineStatus.STOPPED,
        errors=[],
        hasEverEnteredErrorRecovery=False,
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
        liquids=[],
        liquidClasses=[],
        runTimeParameters=run_time_parameters,
        outputFileIds=[],
        signedBy=run_resource.signed_by,
    )


async def test_get_all_runs(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should get all runs, including current and historical."""
    current_run_data = StateSummary(
        status=EngineStatus.IDLE,
        errors=[ErrorOccurrence.model_construct(id="current-error-id")],  # type: ignore[call-arg]
        hasEverEnteredErrorRecovery=False,
        labware=[LoadedLabware.model_construct(id="current-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.model_construct(id="current-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.model_construct(id="current-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.model_construct(id="current-module-id")],  # type: ignore[call-arg]
        peripherals=[LoadedPeripheral.model_construct(id="some-module-id")],  # type: ignore[call-arg]
        liquids=[
            Liquid.model_construct(
                id="some-liquid-id", displayName="liquid", description="desc"
            )
        ],
        liquidClasses=[],
        wells=[],
    )
    current_run_time_parameters: List[pe_types.RunTimeParameter] = [
        pe_types.BooleanParameter(
            displayName="Current Bool",
            variableName="current bool",
            value=False,
            default=True,
        )
    ]

    historical_run_data = StateSummary(
        status=EngineStatus.STOPPED,
        errors=[ErrorOccurrence.model_construct(id="old-error-id")],  # type: ignore[call-arg]
        hasEverEnteredErrorRecovery=False,
        labware=[LoadedLabware.model_construct(id="old-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.model_construct(id="old-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.model_construct(id="old-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.model_construct(id="old-module-id")],  # type: ignore[call-arg]
        peripherals=[LoadedPeripheral.model_construct(id="old-module-id")],  # type: ignore[call-arg]
        liquids=[],
        liquidClasses=[],
        wells=[],
    )
    historical_run_time_parameters: List[pe_types.RunTimeParameter] = [
        pe_types.BooleanParameter(
            displayName="Old Bool",
            variableName="Old bool",
            value=True,
            default=False,
        )
    ]

    current_run_resource = RunResource(
        ok=True,
        run_id="current-run",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
        signed_by=None,
        log_period_id=None,
    )

    historical_run_resource = RunResource(
        ok=True,
        run_id="historical-run",
        protocol_id=None,
        created_at=datetime(year=2023, month=3, day=3),
        actions=[],
        signed_by=None,
        log_period_id=None,
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("current-run")
    decoy.when(await mock_run_orchestrator_store.get_state_summary()).then_return(
        current_run_data
    )
    decoy.when(await mock_run_orchestrator_store.get_run_time_parameters()).then_return(
        current_run_time_parameters
    )
    decoy.when(mock_run_store.get_state_summary("historical-run")).then_return(
        historical_run_data
    )
    decoy.when(mock_run_store.get_run_time_parameters("historical-run")).then_return(
        historical_run_time_parameters
    )
    decoy.when(mock_run_store.get_all(length=20)).then_return(
        [historical_run_resource, current_run_resource]
    )

    result = await subject.get_all(length=20)

    assert result == [
        Run(
            current=False,
            id=historical_run_resource.run_id,
            protocolId=historical_run_resource.protocol_id,
            logPeriodId=historical_run_resource.log_period_id,
            createdAt=historical_run_resource.created_at,
            actions=historical_run_resource.actions,
            status=historical_run_data.status,
            errors=historical_run_data.errors,
            hasEverEnteredErrorRecovery=historical_run_data.hasEverEnteredErrorRecovery,
            labware=historical_run_data.labware,
            labwareOffsets=historical_run_data.labwareOffsets,
            pipettes=historical_run_data.pipettes,
            modules=historical_run_data.modules,
            liquids=historical_run_data.liquids,
            liquidClasses=historical_run_data.liquidClasses,
            runTimeParameters=historical_run_time_parameters,
            outputFileIds=historical_run_data.files,
        ),
        Run(
            current=True,
            id=current_run_resource.run_id,
            protocolId=current_run_resource.protocol_id,
            logPeriodId=current_run_resource.log_period_id,
            createdAt=current_run_resource.created_at,
            actions=current_run_resource.actions,
            status=current_run_data.status,
            errors=current_run_data.errors,
            hasEverEnteredErrorRecovery=current_run_data.hasEverEnteredErrorRecovery,
            labware=current_run_data.labware,
            labwareOffsets=current_run_data.labwareOffsets,
            pipettes=current_run_data.pipettes,
            modules=current_run_data.modules,
            liquids=current_run_data.liquids,
            liquidClasses=current_run_data.liquidClasses,
            runTimeParameters=current_run_time_parameters,
            outputFileIds=current_run_data.files,
        ),
    ]


async def test_delete_current_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should delete the current run from the engine."""
    run_id = "hello world"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)

    await subject.delete(run_id=run_id, access_control_status=False)

    decoy.verify(
        await mock_run_orchestrator_store.clear(),
        mock_run_store.remove(run_id=run_id),
    )


async def test_delete_historical_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should delete a historical run from the store."""
    run_id = "hello world"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("some other id")

    await subject.delete(run_id=run_id, access_control_status=False)

    decoy.verify(await mock_run_orchestrator_store.clear(), times=0)
    decoy.verify(mock_run_store.remove(run_id=run_id), times=1)


@pytest.mark.parametrize(
    ("signed_by", "access_control_status", "expect_signoff_required", "current_run_id"),
    [
        pytest.param(None, True, True, "test-run-id", id="signoff_required"),
        pytest.param("Alice Example", True, False, "test-run-id", id="already_signed"),
        pytest.param(None, False, False, "test-run-id", id="access_control_disabled"),
        pytest.param(None, True, False, "not-run-id", id="not_current_run"),
    ],
)
async def test_delete_signoff_enforcement(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_access_control_setting_store: AccessControlSettingStore,
    subject: RunDataManager,
    signed_by: str | None,
    access_control_status: bool,
    expect_signoff_required: bool,
    current_run_id: str,
) -> None:
    """It should enforce signoff before deleting a run when required."""
    run_id = "test-run-id"
    decoy.when(mock_access_control_setting_store.get_all()).then_return(
        ResponseData(requireSignoffForProtocolLog=True)
    )
    decoy.when(mock_run_store.get(run_id=run_id)).then_return(
        RunResource(
            ok=True,
            run_id=run_id,
            protocol_id=None,
            created_at=datetime(year=2022, month=2, day=2),
            actions=[],
            signed_by=signed_by,
            log_period_id=None,
        )
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(current_run_id)

    if expect_signoff_required:
        with pytest.raises(RunSignoffRequiredError, match=run_id):
            await subject.delete(
                run_id=run_id, access_control_status=access_control_status
            )

        decoy.verify(await mock_run_orchestrator_store.clear(), times=0)
        decoy.verify(mock_run_store.remove(run_id=run_id), times=0)
    else:
        await subject.delete(run_id=run_id, access_control_status=access_control_status)
        if current_run_id == run_id:
            decoy.verify(
                await mock_run_orchestrator_store.clear(),
                mock_run_store.remove(run_id=run_id),
            )
        else:
            decoy.verify(mock_run_store.remove(run_id=run_id))


async def test_uncurrent(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    command_annotations: List[pe_types.CommandAnnotation],
    command_preconditions: CommandPreconditions,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_runs_publisher: RunsPublisher,
    mock_file_provider: FileProvider,
    subject: RunDataManager,
) -> None:
    """It should persist the current run and clear the engine."""
    run_id = "hello world"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)
    decoy.when(await mock_run_orchestrator_store.clear()).then_return(
        RunResult(
            commands=[run_command],
            state_summary=engine_state_summary,
            parameters=run_time_parameters,
            command_annotations=command_annotations,
            command_preconditions=command_preconditions,
        )
    )

    decoy.when(
        mock_run_store.update_run_state(
            run_id=run_id,
            summary=engine_state_summary,
            commands=[run_command],
            command_annotations=command_annotations,
            run_time_parameters=run_time_parameters,
        )
    ).then_return(run_resource)

    result = await subject.uncurrent(run_id=run_id, access_control_status=False)

    decoy.verify(
        mock_runs_publisher.publish_pre_serialized_commands_notification(run_id),
        times=1,
    )
    decoy.verify(
        mock_runs_publisher.publish_runs_advise_refetch(run_id),
        times=1,
    )
    decoy.verify(
        mock_file_provider.clear_run_metadata(),
        times=1,
    )
    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        logPeriodId=run_resource.log_period_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        hasEverEnteredErrorRecovery=engine_state_summary.hasEverEnteredErrorRecovery,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        liquidClasses=engine_state_summary.liquidClasses,
        runTimeParameters=run_time_parameters,
        outputFileIds=engine_state_summary.files,
        signedBy=run_resource.signed_by,
    )


async def test_uncurrent_not_allowed(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should raise if the run is not current."""
    run_id = "hello world"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("some other id")

    with pytest.raises(RunNotCurrentError):
        await subject.uncurrent(run_id=run_id, access_control_status=False)


@pytest.mark.parametrize(
    ("signed_by", "access_control_status", "expect_signoff_required"),
    [
        pytest.param(None, True, True, id="signoff_required"),
        pytest.param("Alice Example", True, False, id="already_signed"),
        pytest.param(None, False, False, id="access_control_disabled"),
    ],
)
async def test_uncurrent_signoff_enforcement(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    command_annotations: List[pe_types.CommandAnnotation],
    command_preconditions: CommandPreconditions,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_access_control_setting_store: AccessControlSettingStore,
    mock_runs_publisher: RunsPublisher,
    mock_file_provider: FileProvider,
    subject: RunDataManager,
    signed_by: str | None,
    access_control_status: bool,
    expect_signoff_required: bool,
) -> None:
    """It should enforce signoff before un-currenting a run when required."""
    run_id = "test-run-id"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)
    decoy.when(mock_access_control_setting_store.get_all()).then_return(
        ResponseData(requireSignoffForProtocolLog=True)
    )
    decoy.when(mock_run_store.get(run_id=run_id)).then_return(
        RunResource(
            ok=True,
            run_id=run_id,
            protocol_id=None,
            created_at=datetime(year=2022, month=2, day=2),
            actions=[],
            signed_by=signed_by,
            log_period_id=None,
        )
    )

    if expect_signoff_required:
        with pytest.raises(RunSignoffRequiredError, match=run_id):
            await subject.uncurrent(
                run_id=run_id, access_control_status=access_control_status
            )

        decoy.verify(await mock_run_orchestrator_store.clear(), times=0)
    else:
        decoy.when(await mock_run_orchestrator_store.clear()).then_return(
            RunResult(
                commands=[run_command],
                state_summary=engine_state_summary,
                parameters=run_time_parameters,
                command_annotations=command_annotations,
                command_preconditions=command_preconditions,
            )
        )
        decoy.when(
            mock_run_store.update_run_state(
                run_id=run_id,
                summary=engine_state_summary,
                commands=[run_command],
                command_annotations=command_annotations,
                run_time_parameters=run_time_parameters,
            )
        ).then_return(run_resource)

        await subject.uncurrent(
            run_id=run_id, access_control_status=access_control_status
        )

        decoy.verify(
            mock_runs_publisher.publish_pre_serialized_commands_notification(run_id),
            times=1,
        )
        decoy.verify(
            mock_runs_publisher.publish_runs_advise_refetch(run_id),
            times=1,
        )
        decoy.verify(
            mock_file_provider.clear_run_metadata(),
            times=1,
        )


async def test_create_archives_existing(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    command_annotations: List[pe_types.CommandAnnotation],
    command_preconditions: CommandPreconditions,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    subject: RunDataManager,
    mock_feature_flags: None,
) -> None:
    """It should persist the previously current run when a new run is created."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id_old = "hello world"
    run_id_new = "hello is it me you're looking for"

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id_old)
    decoy.when(await mock_run_orchestrator_store.clear()).then_return(
        RunResult(
            commands=[run_command],
            state_summary=engine_state_summary,
            parameters=run_time_parameters,
            command_annotations=command_annotations,
            command_preconditions=command_preconditions,
        )
    )

    expected_initial_error_recovery_rules: list[ErrorRecoveryRule] = []
    decoy.when(mock_error_recovery_setting_store.get_is_enabled()).then_return(
        sentinel.error_recovery_enabled
    )
    decoy.when(
        error_recovery_mapping.create_error_recovery_policy_from_rules(
            rules=expected_initial_error_recovery_rules,
            enabled=sentinel.error_recovery_enabled,
        )
    ).then_return(sentinel.initial_error_recovery_policy)

    decoy.when(
        await mock_run_orchestrator_store.create(
            run_id=run_id_new,
            labware_offsets=[],
            protocol=None,
            initial_error_recovery_policy=sentinel.initial_error_recovery_policy,
            error_recovery_rules=[],
            error_recovery_is_enabled=sentinel.error_recovery_enabled,
            deck_configuration=[],
            file_provider=mock_file_provider,
            camera_provider=mock_camera_provider,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
        )
    ).then_return(engine_state_summary)

    decoy.when(
        mock_run_store.insert(
            run_id=run_id_new,
            created_at=datetime(year=2021, month=1, day=1),
            protocol_id=None,
            log_period_id=None,
        )
    ).then_return(run_resource)

    await subject.create(
        run_id=run_id_new,
        created_at=datetime(year=2021, month=1, day=1),
        labware_offsets=[],
        protocol=None,
        deck_configuration=[],
        camera_provider=mock_camera_provider,
        run_time_param_values=None,
        run_time_param_paths=None,
        notify_publishers=mock_notify_publishers,
        access_control_status=False,
        log_period_id=None,
    )

    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id_old,
            summary=engine_state_summary,
            commands=[run_command],
            command_annotations=command_annotations,
            run_time_parameters=run_time_parameters,
        )
    )


@pytest.mark.parametrize(
    ("signed_by", "access_control_status", "expect_signoff_required"),
    [
        pytest.param(None, True, True, id="signoff_required"),
        pytest.param("Alice Example", True, False, id="already_signed"),
        pytest.param(None, False, False, id="access_control_disabled"),
    ],
)
async def test_create_replacement_signoff_enforcement(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    command_annotations: List[pe_types.CommandAnnotation],
    command_preconditions: CommandPreconditions,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    mock_access_control_setting_store: AccessControlSettingStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    subject: RunDataManager,
    mock_feature_flags: None,
    signed_by: str | None,
    access_control_status: bool,
    expect_signoff_required: bool,
) -> None:
    """It should enforce signoff before replacing the current run when required."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(feature_flags.protocol_subprocess_enabled()).then_return(False)
    run_id_old = "test-run-id"
    run_id_new = "other-test-run-id"
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id_old)
    decoy.when(mock_access_control_setting_store.get_all()).then_return(
        ResponseData(requireSignoffForProtocolLog=True)
    )
    decoy.when(mock_run_store.get(run_id=run_id_old)).then_return(
        RunResource(
            ok=True,
            run_id=run_id_old,
            protocol_id=None,
            created_at=datetime(year=2022, month=2, day=2),
            actions=[],
            signed_by=signed_by,
            log_period_id=None,
        )
    )

    if expect_signoff_required:
        with pytest.raises(RunSignoffRequiredError, match=run_id_old):
            await subject.create(
                run_id=run_id_new,
                created_at=datetime(year=2021, month=1, day=1),
                labware_offsets=[],
                protocol=None,
                deck_configuration=[],
                camera_provider=mock_camera_provider,
                run_time_param_values=None,
                run_time_param_paths=None,
                notify_publishers=mock_notify_publishers,
                access_control_status=access_control_status,
                log_period_id=None,
            )

        decoy.verify(await mock_run_orchestrator_store.clear(), times=0)
        decoy.verify(
            mock_run_store.insert(
                run_id=run_id_new,
                created_at=matchers.Anything(),
                protocol_id=matchers.Anything(),
                log_period_id=matchers.Anything(),
            ),
            times=0,
        )
    else:
        decoy.when(await mock_run_orchestrator_store.clear()).then_return(
            RunResult(
                commands=[run_command],
                state_summary=engine_state_summary,
                parameters=run_time_parameters,
                command_annotations=command_annotations,
                command_preconditions=command_preconditions,
            )
        )

        expected_initial_error_recovery_rules: list[ErrorRecoveryRule] = []
        decoy.when(mock_error_recovery_setting_store.get_is_enabled()).then_return(
            sentinel.error_recovery_enabled
        )
        decoy.when(
            error_recovery_mapping.create_error_recovery_policy_from_rules(
                rules=expected_initial_error_recovery_rules,
                enabled=sentinel.error_recovery_enabled,
            )
        ).then_return(sentinel.initial_error_recovery_policy)

        decoy.when(
            await mock_run_orchestrator_store.create(
                run_id=run_id_new,
                labware_offsets=[],
                protocol=None,
                initial_error_recovery_policy=sentinel.initial_error_recovery_policy,
                error_recovery_rules=[],
                error_recovery_is_enabled=sentinel.error_recovery_enabled,
                deck_configuration=[],
                file_provider=mock_file_provider,
                camera_provider=mock_camera_provider,
                run_time_param_values=None,
                run_time_param_paths=None,
                notify_publishers=mock_notify_publishers,
            )
        ).then_return(engine_state_summary)

        decoy.when(
            mock_run_store.insert(
                run_id=run_id_new,
                created_at=datetime(year=2021, month=1, day=1),
                protocol_id=None,
                log_period_id=None,
            )
        ).then_return(run_resource)

        await subject.create(
            run_id=run_id_new,
            created_at=datetime(year=2021, month=1, day=1),
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
            access_control_status=access_control_status,
            log_period_id=None,
        )

        decoy.verify(
            mock_run_store.update_run_state(
                run_id=run_id_old,
                summary=engine_state_summary,
                commands=[run_command],
                command_annotations=command_annotations,
                run_time_parameters=run_time_parameters,
            )
        )


async def test_get_commands_slice_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    run_command: commands.Command,
) -> None:
    """Should get a sliced command list from run store."""
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

    decoy.when(
        mock_run_store.get_commands_slice(
            run_id="run_id", cursor=1, length=2, include_fixit_commands=True
        )
    ).then_return(expected_command_slice)
    result = await subject.get_commands_slice(
        run_id="run_id", cursor=1, length=2, include_fixit_commands=True
    )

    assert expected_command_slice == result


async def test_get_commands_slice_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get a sliced command list from engine store."""
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
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(
        await mock_run_orchestrator_store.get_command_slice(1, 2, True)
    ).then_return(expected_command_slice)

    result = await subject.get_commands_slice(
        "run-id", 1, 2, include_fixit_commands=True
    )

    assert expected_command_slice == result


async def test_get_commands_errors_slice_historical_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
) -> None:
    """Should get a sliced command error list from engine store."""
    expected_commands_errors_result = [ErrorOccurrence.model_construct(id="error-id")]  # type: ignore[call-arg]

    command_error_slice = CommandErrorSlice(
        cursor=1, total_length=3, commands_errors=expected_commands_errors_result
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-not-id")

    decoy.when(mock_run_store.get_commands_errors_slice("run-id", 2, 1)).then_return(
        command_error_slice
    )

    result = await subject.get_command_error_slice("run-id", 1, 2)

    assert command_error_slice == result


async def test_get_commands_errors_slice_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get a sliced command error list from engine store."""
    expected_commands_errors_result = [
        ErrorOccurrence.model_construct(id="error-id")  # type: ignore[call-arg]
    ]

    command_error_slice = CommandErrorSlice(
        cursor=1, total_length=3, commands_errors=expected_commands_errors_result
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(
        await mock_run_orchestrator_store.get_command_error_slice(1, 2)
    ).then_return(command_error_slice)

    result = await subject.get_command_error_slice("run-id", 1, 2)

    assert command_error_slice == result


async def test_get_commands_slice_from_db_run_not_found(
    decoy: Decoy, subject: RunDataManager, mock_run_store: RunStore
) -> None:
    """Should get a sliced command list from run store."""
    decoy.when(
        mock_run_store.get_commands_slice(
            run_id="run-id", cursor=1, length=2, include_fixit_commands=True
        )
    ).then_raise(RunNotFoundError(run_id="run-id"))
    with pytest.raises(RunNotFoundError):
        await subject.get_commands_slice(
            run_id="run-id", cursor=1, length=2, include_fixit_commands=True
        )


def test_get_current_command(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get current command from engine store."""
    expected_current = CommandPointer(
        command_id=run_command.id,
        command_key=run_command.key,
        created_at=run_command.createdAt,
        index=0,
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(mock_run_orchestrator_store.get_current_command()).then_return(
        expected_current
    )
    result = subject.get_current_command("run-id")

    assert result == expected_current


def test_get_current_command_not_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get the last command from the run store for a historical run."""
    last_command_slice = commands.WaitForResume(
        id="command-id-1",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=commands.CommandStatus.SUCCEEDED,
        params=commands.WaitForResumeParams(message="Hello"),
    )

    expected_last_command = CommandPointer(
        command_id="command-id-1",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
        index=0,
    )

    command_slice = CommandSlice(
        commands=[last_command_slice], cursor=0, total_length=1
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_commands_slice(
            run_id="run-id", cursor=None, length=1, include_fixit_commands=True
        )
    ).then_return(command_slice)
    result = subject.get_current_command("run-id")

    assert result == expected_last_command


def test_get_last_completed_command_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get the last command from the engine store for the current run."""
    run_id = "current-run-id"
    expected_last_command = CommandPointer(
        command_id=run_command.id,
        command_key=run_command.key,
        created_at=run_command.createdAt,
        index=1,
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)
    decoy.when(
        mock_run_orchestrator_store.get_most_recently_finalized_command()
    ).then_return(expected_last_command)

    result = subject.get_last_completed_command(run_id)

    assert result == expected_last_command


def test_get_last_completed_command_not_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
    run_command: commands.Command,
) -> None:
    """Should get the last command from the run store for a historical run."""
    run_id = "historical-run-id"

    last_command_slice = commands.WaitForResume(
        id="command-id-1",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=commands.CommandStatus.SUCCEEDED,
        params=commands.WaitForResumeParams(message="Hello"),
    )

    expected_last_command = CommandPointer(
        command_id="command-id-1",
        command_key="command-key",
        created_at=datetime(year=2021, month=1, day=1),
        index=1,
    )

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(
        "different-run-id"
    )

    command_slice = CommandSlice(
        commands=[last_command_slice], cursor=1, total_length=1
    )
    decoy.when(
        mock_run_store.get_commands_slice(
            run_id=run_id, cursor=None, length=1, include_fixit_commands=True
        )
    ).then_return(command_slice)

    result = subject.get_last_completed_command(run_id)

    assert result == expected_last_command


async def test_get_command_from_engine(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(await mock_run_orchestrator_store.get_command("command-id")).then_return(
        run_command
    )
    result = await subject.get_command("run-id", "command-id")

    assert result == run_command


async def test_get_command_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_return(run_command)
    result = await subject.get_command("run-id", "command-id")

    assert result == run_command


async def test_get_command_from_db_run_not_found(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_raise(RunNotFoundError("run-id"))

    with pytest.raises(RunNotFoundError):
        await subject.get_command("run-id", "command-id")


async def test_get_command_from_db_command_not_found(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_raise(CommandNotFoundError(command_id="command-id"))

    with pytest.raises(CommandNotFoundError):
        await subject.get_command("run-id", "command-id")


async def test_get_all_commands_as_preserialized_list(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """It should return the pre-serialized commands list."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(None)
    decoy.when(
        mock_run_store.get_all_commands_as_preserialized_list("run-id", True)
    ).then_return(['{"id": command-1}', '{"id": command-2}'])
    assert await subject.get_all_commands_as_preserialized_list("run-id", True) == [
        '{"id": command-1}',
        '{"id": command-2}',
    ]


async def test_get_all_commands_as_preserialized_list_errors_for_active_runs(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """It should raise an error when fetching pre-serialized commands list while run is active."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("current-run-id")
    decoy.when(await mock_run_orchestrator_store.get_is_run_terminal()).then_return(
        False
    )
    with pytest.raises(PreSerializedCommandsNotAvailableError):
        await subject.get_all_commands_as_preserialized_list("current-run-id", True)


async def test_get_command_annotations_slice_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """It should get the specified slice of command annotations."""
    annotations_slice = CommandAnnotationsSlice(
        command_annotations=[
            CommandAnnotation(
                id="annotation-id",
                source="userCommand",
                name="user-specified-name",
                params={},
            )
        ],
        cursor=2,
        total_length=200,
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("current-run-id")
    decoy.when(
        await mock_run_orchestrator_store.get_command_annotations_slice(
            cursor=1, length=10
        )
    ).then_return(annotations_slice)
    result = await subject.get_command_annotations_slice(
        run_id="current-run-id", cursor=1, length=10
    )
    assert result == annotations_slice


async def test_get_command_annotation_from_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """Should get the command annotation by id from run store."""
    cmd_annotation = CommandAnnotation(
        id="annotation-id",
        source="userCommand",
        name="user-specified-name",
        params={},
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(
        await mock_run_orchestrator_store.get_command_annotation("annotation-id")
    ).then_return(cmd_annotation)
    result = await subject.get_command_annotation("run-id", "annotation-id")
    assert result == cmd_annotation


async def test_get_command_annotations_slice_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
) -> None:
    """It should get the specified slice of command annotations."""
    annotations_slice = CommandAnnotationsSlice(
        command_annotations=[
            CommandAnnotation(
                id="annotation-id",
                source="userCommand",
                name="user-specified-name",
                description="user-specified-description",
                params={},
            ),
        ],
        cursor=2,
        total_length=200,
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("current-id")
    decoy.when(
        mock_run_store.get_command_annotations_slice(
            run_id="not-current-id", cursor=1, length=10
        )
    ).then_return(annotations_slice)
    result = await subject.get_command_annotations_slice(
        run_id="not-current-id", cursor=1, length=10
    )
    assert result == annotations_slice


async def test_get_command_annotation_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_run_store: RunStore,
) -> None:
    """Should get the command annotation by id from run store."""
    cmd_annotation = CommandAnnotation(
        id="annotation-id",
        source="userCommand",
        name="user-specified-name",
        description="user-specified-description",
        params={},
    )
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("current-run-id")
    decoy.when(
        mock_run_store.get_command_annotation(
            run_id="not-current-run-id", command_annotation_id="annotation-id"
        )
    ).then_return(cmd_annotation)
    result = await subject.get_command_annotation("not-current-run-id", "annotation-id")
    assert result == cmd_annotation


async def test_get_current_run_labware_definition(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
) -> None:
    """It should get the current run labware definition from the engine."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return("run-id")
    decoy.when(
        await mock_run_orchestrator_store.get_loaded_labware_definitions()
    ).then_return(
        [
            LabwareDefinition2.model_construct(namespace="test_1"),  # type: ignore[call-arg]
            LabwareDefinition2.model_construct(namespace="test_2"),  # type: ignore[call-arg]
        ]
    )

    result = await subject.get_run_loaded_labware_definitions(run_id="run-id")

    assert result == [
        LabwareDefinition2.model_construct(namespace="test_1"),  # type: ignore[call-arg]
        LabwareDefinition2.model_construct(namespace="test_2"),  # type: ignore[call-arg]
    ]


async def test_set_error_recovery_rules_raises_run_not_current(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    subject: RunDataManager,
) -> None:
    """Should raise run not current."""
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(
        "not-current-run-id"
    )
    with pytest.raises(RunNotCurrentError):
        await subject.set_error_recovery_rules(
            run_id="run-id", rules=decoy.mock(cls=List[ErrorRecoveryRule])
        )


async def test_set_error_recovery_rules_translates_and_calls_orchestrator(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    mock_error_recovery_setting_store: ErrorRecoverySettingStore,
    subject: RunDataManager,
) -> None:
    """Should translate rules into policy and call orchestrator."""
    decoy.when(mock_error_recovery_setting_store.get_is_enabled()).then_return(
        sentinel.is_enabled
    )
    decoy.when(
        error_recovery_mapping.create_error_recovery_policy_from_rules(
            rules=sentinel.input_rules,
            enabled=sentinel.is_enabled,
        )
    ).then_return(sentinel.expected_output)
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(
        sentinel.current_run_id
    )
    await subject.set_error_recovery_rules(
        run_id=sentinel.current_run_id, rules=sentinel.input_rules
    )
    decoy.verify(
        await mock_run_orchestrator_store.set_error_recovery_policy(
            sentinel.expected_output, sentinel.input_rules, sentinel.is_enabled
        )
    )


async def test_get_error_recovery_rules(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    subject: RunDataManager,
) -> None:
    """It should return the current run's previously-set list of error recovery rules."""
    # Before there has been any current run, it should raise an exception.
    with pytest.raises(RunNotCurrentError):
        subject.get_error_recovery_rules(run_id="whatever")

    # While there is a current run, it should return its list of rules.
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(
        sentinel.current_run_id
    )
    await subject.set_error_recovery_rules(
        run_id=sentinel.current_run_id, rules=sentinel.input_rules
    )
    assert (
        subject.get_error_recovery_rules(run_id=sentinel.current_run_id)
        == sentinel.input_rules
    )

    # When the run stops being current, it should go back to raising.
    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(None)
    with pytest.raises(RunNotCurrentError):
        subject.get_error_recovery_rules(run_id="whatever")


def test_get_nozzle_map_current_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    subject: RunDataManager,
    mock_nozzle_maps: Dict[str, NozzleMap],
) -> None:
    """It should return the nozzle map for the current run."""
    run_id = "current-run-id"

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(run_id)
    decoy.when(mock_run_orchestrator_store.get_nozzle_maps()).then_return(
        mock_nozzle_maps
    )

    result = subject.get_nozzle_maps(run_id=run_id)

    assert result == mock_nozzle_maps


def test_get_nozzle_map_not_current_run(
    decoy: Decoy,
    mock_run_orchestrator_store: RunOrchestratorStore,
    subject: RunDataManager,
) -> None:
    """It should raise RunNotCurrentError for a non-current run."""
    run_id = "non-current-run-id"

    decoy.when(mock_run_orchestrator_store.current_run_id).then_return(
        "different-run-id"
    )

    with pytest.raises(RunNotCurrentError):
        subject.get_nozzle_maps(run_id=run_id)

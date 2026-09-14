"""Tests for base /runs routes."""

from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.hardware_control.types import DoorState, EstopState
from opentrons.protocol_engine import (
    CommandErrorSlice,
    CommandPointer,
)
from opentrons.protocol_engine import (
    errors as pe_errors,
)
from opentrons.protocol_engine import (
    types as pe_types,
)
from opentrons.protocol_engine.resources.camera_provider import CameraProvider
from opentrons.protocol_engine.resources.file_provider import (
    FileProvider,
)
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerId,
    FlexStackerSubState,
)
from opentrons.protocol_engine.types.module import StackerStoredLabwareGroup
from opentrons.protocol_reader import JsonProtocolConfig, ProtocolSource
from opentrons.types import DeckSlotName, NozzleConfigurationType, Point
from opentrons_shared_data.data_files import DataFileInfo, MimeType
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    labware_definition_type_adapter,
)
from opentrons_shared_data.labware.types import LabwareDefinition as LabwareDefDict
from opentrons_shared_data.robot.types import RobotTypeEnum
from server_utils.audit.audit_server import (
    Client as AuditClient,
)
from server_utils.audit.audit_server import (
    GetLoggingEnabledData,
    GetLogPeriodsData,
)
from server_utils.auth.resource_server.fastapi import AuthorizationError
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
)
from server_utils.auth.scopes import Scope, serialize_scopes
from server_utils.fastapi_utils.app_state import AppState
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    RequestModel,
    ResourceLink,
    SimpleBody,
    SimpleEmptyBody,
)

from robot_server.data_files.data_files_store import (
    DataFilesStore,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.errors.error_responses import ApiError
from robot_server.file_provider.provider import FileProviderExecutor
from robot_server.hardware import HardwareStateStore
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import (
    ProtocolNotFoundError,
    ProtocolResource,
    ProtocolStore,
)
from robot_server.runs.router.base_router import (
    AllRunsLinks,
    CurrentStateLinks,
    create_run,
    get_current_state,
    get_run,
    get_run_commands_error,
    get_run_data_from_url,
    get_runs,
    remove_run,
    update_run,
)
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_data_manager import (
    RunDataManager,
    RunNotCompleteError,
    RunNotCurrentError,
    RunSignoffRequiredError,
)
from robot_server.runs.run_models import (
    ActiveNozzleLayout,
    CommandLinkNoMeta,
    FlexStackerState,
    NozzleLayoutConfig,
    Run,
    RunCreate,
    RunCurrentState,
    RunNotFoundError,
    RunUpdate,
    TipState,
)
from robot_server.runs.run_orchestrator_store import RunConflictError
from robot_server.runs.run_store import RunStore


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def mock_app_state(decoy: Decoy) -> AppState:
    """Get a mock AppState."""
    return decoy.mock(cls=AppState)


@pytest.fixture
def mock_data_files_store(decoy: Decoy) -> DataFilesStore:
    """Get a mock DataFilesStore."""
    return decoy.mock(cls=DataFilesStore)


@pytest.fixture
def mock_data_files_directory(decoy: Decoy) -> Path:
    """Get a mocked out data files directory.

    We could use Path("/dev/null") for this but I worry something will accidentally
    try to use it as an actual path and then we'll get confusing errors on Windows.
    """
    return decoy.mock(cls=Path)


@pytest.fixture
def mock_persistence_directory_root(decoy: Decoy) -> Path:
    """Get a mocked out persistence directory root.

    Mocks Path for the same reasons described above.
    """
    return decoy.mock(cls=Path)


@pytest.fixture
def mock_audit_client(decoy: Decoy) -> AuditClient:
    """Get a mock AuditClient."""
    return decoy.mock(cls=AuditClient)


@pytest.fixture
def labware_offset_create() -> pe_types.LegacyLabwareOffsetCreate:
    """Get a labware offset create request value object."""
    return pe_types.LegacyLabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )


@pytest.fixture()
def labware_definition(minimal_labware_def: LabwareDefDict) -> LabwareDefinition:
    """Create a labware definition fixture."""
    return labware_definition_type_adapter.validate_python(minimal_labware_def)


@pytest.fixture
def mock_disk_monitor(decoy: Decoy) -> DiskMonitor:
    """Get a mock disk monitor."""
    return decoy.mock(cls=DiskMonitor)


async def test_create_run(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    labware_offset_create: pe_types.LegacyLabwareOffsetCreate,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_file_provider_wrapper: FileProviderExecutor,
    mock_protocol_store: ProtocolStore,
    mock_data_files_store: DataFilesStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should be able to create a basic run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)

    expected_response = Run(
        id=run_id,
        createdAt=run_created_at,
        protocolId=None,
        logPeriodId="123",
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        status=pe_types.EngineStatus.IDLE,
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])

    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=True)
    )
    decoy.when(await mock_audit_client.get_current_log_period()).then_return(
        GetLogPeriodsData(
            id="123",
            startedAt=datetime(year=2021, month=1, day=1),
            endedAt=None,
        )
    )
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        False
    )

    decoy.when(
        await mock_run_data_manager.create(
            run_id=run_id,
            created_at=run_created_at,
            labware_offsets=[labware_offset_create],
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            protocol=None,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            log_period_id="123",
        )
    ).then_return(expected_response)

    result = await create_run(
        request_body=RequestModel(
            data=RunCreate(labwareOffsets=[labware_offset_create])
        ),
        run_data_manager=mock_run_data_manager,
        data_files_store=mock_data_files_store,
        data_files_directory=Path("/dev/null"),
        run_id=run_id,
        created_at=run_created_at,
        run_auto_deleter=mock_run_auto_deleter,
        deck_configuration_store=mock_deck_configuration_store,
        camera_provider=mock_camera_provider,
        notify_publishers=mock_notify_publishers,
        protocol_store=mock_protocol_store,
        audit_client=mock_audit_client,
        check_estop=True,
        access_control_status=False,
        disk_monitor=mock_disk_monitor,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201

    decoy.verify(mock_run_auto_deleter.make_room_for_new_run(), times=1)


async def test_create_protocol_run(
    decoy: Decoy,
    mock_protocol_store: ProtocolStore,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_data_files_store: DataFilesStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should be able to create a protocol run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)
    protocol_id = "protocol-id"

    protocol_resource = ProtocolResource(
        protocol_id=protocol_id,
        protocol_key=None,
        protocol_kind=ProtocolKind.STANDARD,
        created_at=datetime(year=2022, month=2, day=2),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="abc123",
        ),
    )

    expected_response = Run(
        id=run_id,
        createdAt=run_created_at,
        protocolId=protocol_id,
        logPeriodId="123",
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        status=pe_types.EngineStatus.IDLE,
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        False
    )
    decoy.when(mock_data_files_store.get("file-id")).then_return(
        DataFileInfo(
            id="123",
            name="abc.xyz",
            file_hash="987",
            created_at=datetime(month=1, day=2, year=2024),
            mime_type=MimeType.TEXT_CSV,
            generated=False,
            stored=True,
            path="/dev/null/123/abc.xyz",
        )
    )
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(mock_protocol_store.get(protocol_id=protocol_id)).then_return(
        protocol_resource
    )
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=True)
    )
    decoy.when(await mock_audit_client.get_current_log_period()).then_return(
        GetLogPeriodsData(
            id="123",
            startedAt=datetime(year=2021, month=1, day=1),
            endedAt=None,
        )
    )

    decoy.when(
        await mock_run_data_manager.create(
            run_id=run_id,
            created_at=run_created_at,
            labware_offsets=[],
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            protocol=protocol_resource,
            run_time_param_values={"foo": "bar"},
            run_time_param_paths={"my-csv-param": Path("/dev/null/file-id/abc.xyz")},
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            log_period_id="123",
        )
    ).then_return(expected_response)

    result = await create_run(
        request_body=RequestModel(
            data=RunCreate(
                protocolId="protocol-id",
                runTimeParameterValues={"foo": "bar"},
                runTimeParameterFiles={"my-csv-param": "file-id"},
            )
        ),
        protocol_store=mock_protocol_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=mock_data_files_store,
        data_files_directory=Path("/dev/null"),
        run_id=run_id,
        created_at=run_created_at,
        run_auto_deleter=mock_run_auto_deleter,
        deck_configuration_store=mock_deck_configuration_store,
        camera_provider=mock_camera_provider,
        notify_publishers=mock_notify_publishers,
        audit_client=mock_audit_client,
        check_estop=True,
        access_control_status=False,
        disk_monitor=mock_disk_monitor,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201

    decoy.verify(mock_run_auto_deleter.make_room_for_new_run(), times=1)


async def test_create_protocol_run_bad_protocol_id(
    decoy: Decoy,
    mock_protocol_store: ProtocolStore,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    mock_data_files_store: DataFilesStore,
    mock_data_files_directory: Path,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should 404 if a protocol for a run does not exist."""
    error = ProtocolNotFoundError("protocol-id")
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=False)
    )
    decoy.when(mock_protocol_store.get(protocol_id="protocol-id")).then_raise(error)
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        False
    )
    with pytest.raises(ApiError) as exc_info:
        await create_run(
            request_body=RequestModel(data=RunCreate(protocolId="protocol-id")),
            protocol_store=mock_protocol_store,
            deck_configuration_store=mock_deck_configuration_store,
            run_data_manager=mock_run_data_manager,
            data_files_store=mock_data_files_store,
            data_files_directory=mock_data_files_directory,
            camera_provider=mock_camera_provider,
            audit_client=mock_audit_client,
            run_id="run-id",
            created_at=datetime.now(),
            run_auto_deleter=mock_run_auto_deleter,
            check_estop=True,
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            disk_monitor=mock_disk_monitor,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolNotFound"


async def test_create_run_conflict(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_protocol_store: ProtocolStore,
    mock_data_files_store: DataFilesStore,
    mock_data_files_directory: Path,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should respond with a conflict error if multiple engines are created."""
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=False)
    )
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        False
    )
    decoy.when(
        await mock_run_data_manager.create(
            run_id="run-id",
            created_at=created_at,
            labware_offsets=[],
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            protocol=None,
            run_time_param_values=None,
            run_time_param_paths=None,
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            log_period_id=None,
        )
    ).then_raise(RunConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await create_run(
            run_id="run-id",
            created_at=created_at,
            request_body=None,
            protocol_store=mock_protocol_store,
            run_data_manager=mock_run_data_manager,
            run_auto_deleter=mock_run_auto_deleter,
            deck_configuration_store=mock_deck_configuration_store,
            data_files_store=mock_data_files_store,
            data_files_directory=mock_data_files_directory,
            camera_provider=mock_camera_provider,
            notify_publishers=mock_notify_publishers,
            audit_client=mock_audit_client,
            check_estop=True,
            access_control_status=False,
            disk_monitor=mock_disk_monitor,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunAlreadyActive"


async def create_run_fails_when_out_of_space_under_acm(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_protocol_store: ProtocolStore,
    mock_data_files_store: DataFilesStore,
    mock_data_files_directory: Path,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should refuse to create a run when out of space and ACM is enabled."""
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=False)
    )
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        True
    )

    with pytest.raises(ApiError) as exc_info:
        await create_run(
            run_id="run-id",
            created_at=created_at,
            request_body=None,
            protocol_store=mock_protocol_store,
            run_data_manager=mock_run_data_manager,
            run_auto_deleter=mock_run_auto_deleter,
            deck_configuration_store=mock_deck_configuration_store,
            data_files_store=mock_data_files_store,
            data_files_directory=mock_data_files_directory,
            camera_provider=mock_camera_provider,
            notify_publishers=mock_notify_publishers,
            audit_client=mock_audit_client,
            check_estop=True,
            access_control_status=True,
            disk_monitor=mock_disk_monitor,
        )

    assert exc_info.value.status_code == 507
    assert exc_info.value.content["errors"][0]["id"] == "NoSpaceForRun"


async def test_create_protocol_run_succeeds_when_out_of_space_with_acm_off(
    decoy: Decoy,
    mock_protocol_store: ProtocolStore,
    mock_run_data_manager: RunDataManager,
    mock_run_auto_deleter: RunAutoDeleter,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_data_files_store: DataFilesStore,
    mock_file_provider: FileProvider,
    mock_camera_provider: CameraProvider,
    mock_audit_client: AuditClient,
    mock_disk_monitor: DiskMonitor,
) -> None:
    """It should be able to create a protocol run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)
    protocol_id = "protocol-id"

    protocol_resource = ProtocolResource(
        protocol_id=protocol_id,
        protocol_key=None,
        protocol_kind=ProtocolKind.STANDARD,
        created_at=datetime(year=2022, month=2, day=2),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null/abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="abc123",
        ),
    )

    expected_response = Run(
        id=run_id,
        createdAt=run_created_at,
        protocolId=protocol_id,
        logPeriodId="123",
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        status=pe_types.EngineStatus.IDLE,
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )
    decoy.when(mock_disk_monitor.is_disk_space_below_run_start_limit()).then_return(
        True
    )
    decoy.when(mock_data_files_store.get("file-id")).then_return(
        DataFileInfo(
            id="123",
            name="abc.xyz",
            file_hash="987",
            created_at=datetime(month=1, day=2, year=2024),
            mime_type=MimeType.TEXT_CSV,
            generated=False,
            stored=True,
            path="/dev/null/123/abc.xyz",
        )
    )
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(mock_protocol_store.get(protocol_id=protocol_id)).then_return(
        protocol_resource
    )
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=True)
    )
    decoy.when(await mock_audit_client.get_current_log_period()).then_return(
        GetLogPeriodsData(
            id="123",
            startedAt=datetime(year=2021, month=1, day=1),
            endedAt=None,
        )
    )

    decoy.when(
        await mock_run_data_manager.create(
            run_id=run_id,
            created_at=run_created_at,
            labware_offsets=[],
            deck_configuration=[],
            camera_provider=mock_camera_provider,
            protocol=protocol_resource,
            run_time_param_values={"foo": "bar"},
            run_time_param_paths={"my-csv-param": Path("/dev/null/file-id/abc.xyz")},
            notify_publishers=mock_notify_publishers,
            access_control_status=False,
            log_period_id="123",
        )
    ).then_return(expected_response)

    result = await create_run(
        request_body=RequestModel(
            data=RunCreate(
                protocolId="protocol-id",
                runTimeParameterValues={"foo": "bar"},
                runTimeParameterFiles={"my-csv-param": "file-id"},
            )
        ),
        protocol_store=mock_protocol_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=mock_data_files_store,
        data_files_directory=Path("/dev/null"),
        run_id=run_id,
        created_at=run_created_at,
        run_auto_deleter=mock_run_auto_deleter,
        deck_configuration_store=mock_deck_configuration_store,
        camera_provider=mock_camera_provider,
        notify_publishers=mock_notify_publishers,
        audit_client=mock_audit_client,
        check_estop=True,
        access_control_status=False,
        disk_monitor=mock_disk_monitor,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201

    decoy.verify(mock_run_auto_deleter.make_room_for_new_run(), times=1)


async def test_get_run_data_from_url(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should be able to get a run by ID."""
    expected_response = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.IDLE,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(await mock_run_data_manager.get("run-id")).then_return(expected_response)

    result = await get_run_data_from_url(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
    )

    assert result == expected_response


async def test_get_run_with_missing_id(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(await mock_run_data_manager.get(run_id="run-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_run_data_from_url(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run() -> None:
    """It should wrap the run data in a response."""
    run_data = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.IDLE,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    result = await get_run(run_data=run_data)

    assert result.content.data == run_data
    assert result.status_code == 200


async def test_get_runs_empty(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should return an empty collection response when no runs exist."""
    decoy.when(await mock_run_data_manager.get_all(length=20)).then_return([])
    decoy.when(mock_run_data_manager.current_run_id).then_return(None)

    result = await get_runs(run_data_manager=mock_run_data_manager, pageLength=20)

    assert result.content.data == []
    assert result.content.links == AllRunsLinks(current=None)
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
    assert result.status_code == 200


async def test_get_runs_not_empty(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should return a collection response when a run exists."""
    created_at_1 = datetime(year=2021, month=1, day=1)
    created_at_2 = datetime(year=2022, month=2, day=2)

    response_1 = Run(
        id="unique-id-1",
        protocolId=None,
        logPeriodId=None,
        createdAt=created_at_1,
        status=pe_types.EngineStatus.SUCCEEDED,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    response_2 = Run(
        id="unique-id-2",
        protocolId=None,
        logPeriodId=None,
        createdAt=created_at_2,
        status=pe_types.EngineStatus.IDLE,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(await mock_run_data_manager.get_all(20)).then_return(
        [response_1, response_2]
    )
    decoy.when(mock_run_data_manager.current_run_id).then_return("unique-id-2")

    result = await get_runs(run_data_manager=mock_run_data_manager, pageLength=20)

    assert result.content.data == [response_1, response_2]
    assert result.content.links == AllRunsLinks(
        current=ResourceLink(href="/runs/unique-id-2")
    )
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=2)
    assert result.status_code == 200


async def test_delete_run_by_id(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should be able to remove a run by ID."""
    result = await remove_run(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        access_control_status=False,
    )

    decoy.verify(
        await mock_run_data_manager.delete("run-id", access_control_status=False),
        times=1,
    )

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_with_bad_id(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    key_error = RunNotFoundError(run_id="run-id")

    decoy.when(
        await mock_run_data_manager.delete("run-id", access_control_status=False)  # type: ignore[func-returns-value]
    ).then_raise(key_error)

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            access_control_status=False,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_delete_active_run(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 409 if the run is not finished."""
    decoy.when(
        await mock_run_data_manager.delete("run-id", access_control_status=False)  # type: ignore[func-returns-value]
    ).then_raise(RunConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            access_control_status=False,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotIdle"


async def test_delete_run_signoff_required(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
) -> None:
    """It should 409 if the run has not been signed off."""
    decoy.when(
        await mock_run_data_manager.delete("run-id", access_control_status=False)  # type: ignore[func-returns-value]
    ).then_raise(RunSignoffRequiredError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            access_control_status=False,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunSignoffRequired"


async def test_update_run_to_not_current(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should update a run to no longer be current."""
    expected_response = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=False,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(
        await mock_run_data_manager.uncurrent("run-id", access_control_status=False)
    ).then_return(expected_response)
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=False)
    )

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(data=RunUpdate(current=False)),
        run_data_manager=mock_run_data_manager,
        run_store=mock_run_store,
        audit_client=mock_audit_client,
        persistence_directory_root=Path(),
        protocol_store=mock_protocol_store,
        access_control_status=False,
        authentication=AuthenticationNotRequiredResult(),
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 200


async def test_update_current_none_noop(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should noop if the update does not request any change to current."""
    expected_response = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(await mock_run_data_manager.get("run-id")).then_return(expected_response)

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(data=RunUpdate()),
        run_data_manager=mock_run_data_manager,
        run_store=mock_run_store,
        audit_client=mock_audit_client,
        persistence_directory_root=Path(),
        protocol_store=mock_protocol_store,
        access_control_status=False,
        authentication=AuthenticationNotRequiredResult(),
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 200


async def test_update_run_signed_by_and_uncurrent(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should sign then un-current in a single PATCH."""
    signed_response = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
        signedBy="Alice Example",
    )
    uncurrent_response = signed_response.model_copy(update={"current": False})

    decoy.when(
        await mock_run_data_manager.set_signed_by(
            run_id="run-id", signed_by="Alice Example"
        )
    ).then_return(signed_response)
    decoy.when(
        await mock_run_data_manager.uncurrent("run-id", access_control_status=False)
    ).then_return(uncurrent_response)
    decoy.when(await mock_audit_client.get_logging_enabled()).then_return(
        GetLoggingEnabledData(loggingEnabled=False)
    )

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(
            data=RunUpdate(signedBy="Alice Example", current=False)
        ),
        run_data_manager=mock_run_data_manager,
        run_store=mock_run_store,
        audit_client=mock_audit_client,
        persistence_directory_root=Path(),
        protocol_store=mock_protocol_store,
        access_control_status=False,
        authentication=AuthenticationNotRequiredResult(),
    )

    assert result.content == SimpleBody(data=uncurrent_response)
    assert result.status_code == 200


async def test_update_run_not_complete(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 409 if signing a run that has not completed."""
    decoy.when(
        await mock_run_data_manager.set_signed_by(
            run_id="run-id", signed_by="Alice Example"
        )
    ).then_raise(RunNotCompleteError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(signedBy="Alice Example")),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticationNotRequiredResult(),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotComplete"


async def test_update_run_signoff_required(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 409 if un-currenting requires signoff."""
    decoy.when(
        await mock_run_data_manager.uncurrent(
            run_id="run-id", access_control_status=False
        )
    ).then_raise(RunSignoffRequiredError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(current=False)),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticationNotRequiredResult(),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunSignoffRequired"


async def test_update_to_current_not_current(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 409 if attempting to update a not current run."""
    decoy.when(
        await mock_run_data_manager.uncurrent(
            run_id="run-id", access_control_status=False
        )
    ).then_raise(RunNotCurrentError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(current=False)),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticationNotRequiredResult(),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_update_to_current_conflict(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 409 if attempting to un-current a run that is not idle."""
    decoy.when(
        await mock_run_data_manager.uncurrent(
            run_id="run-id", access_control_status=False
        )
    ).then_raise(RunConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(current=False)),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticationNotRequiredResult(),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotIdle"


async def test_update_to_current_missing(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 404 if attempting to update a missing run."""
    decoy.when(
        await mock_run_data_manager.uncurrent(
            run_id="run-id", access_control_status=False
        )
    ).then_raise(RunNotFoundError(run_id="run-id"))

    with pytest.raises(ApiError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(current=False)),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticationNotRequiredResult(),
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_update_run_signed_by_requires_run_signoff_write_scope(
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should reject signedBy updates when the token lacks run_signoff.write."""
    with pytest.raises(AuthorizationError) as exc_info:
        await update_run(
            runId="run-id",
            request_body=RequestModel(data=RunUpdate(signedBy="Alice Example")),
            run_data_manager=mock_run_data_manager,
            run_store=mock_run_store,
            audit_client=mock_audit_client,
            persistence_directory_root=Path(),
            protocol_store=mock_protocol_store,
            access_control_status=False,
            authentication=AuthenticatedResult(
                scope=serialize_scopes({Scope.ROBOT_CONTROL_WRITE}),
                username="testuser",
                fullname="Test User",
            ),
        )

    assert exc_info.value.required_scopes == {Scope.RUN_SIGNOFF_WRITE}


async def test_update_run_signed_by(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_run_store: RunStore,
    mock_audit_client: AuditClient,
    mock_persistence_directory_root: Path,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should update signedBy when the request is authorized."""
    expected_response = Run(
        id="run-id",
        protocolId=None,
        logPeriodId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.SUCCEEDED,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        outputFileIds=[],
        hasEverEnteredErrorRecovery=False,
        signedBy="Alice Example",
    )

    decoy.when(
        await mock_run_data_manager.set_signed_by(
            run_id="run-id", signed_by="Alice Example"
        )
    ).then_return(expected_response)

    result = await update_run(
        runId="run-id",
        request_body=RequestModel(data=RunUpdate(signedBy="Alice Example")),
        run_data_manager=mock_run_data_manager,
        run_store=mock_run_store,
        audit_client=mock_audit_client,
        persistence_directory_root=Path(),
        protocol_store=mock_protocol_store,
        access_control_status=False,
        authentication=AuthenticationNotRequiredResult(),
    )

    assert result.content == SimpleBody(data=expected_response)
    assert result.status_code == 200


async def test_get_run_commands_errors(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should return a list of all commands errors in a run."""
    decoy.when(
        await mock_run_data_manager.get_command_error_slice(
            run_id="run-id",
            cursor=0,
            length=42,
        )
    ).then_raise(RunNotCurrentError("oh no!"))

    decoy.when(
        await mock_run_data_manager.get_command_errors_count("run-id")
    ).then_return(1)

    with pytest.raises(ApiError):
        result = await get_run_commands_error(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
            cursor=None,
            pageLength=42,
        )
        assert result.status_code == 409


async def test_get_run_commands_errors_raises_no_run(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should return a list of all commands errors in a run."""
    error = pe_errors.ErrorOccurrence(
        id="error-id",
        errorType="PrettyBadError",
        createdAt=datetime(year=2024, month=4, day=4),
        detail="Things are not looking good.",
    )
    decoy.when(
        await mock_run_data_manager.get_command_errors_count("run-id")
    ).then_return(1)

    command_error_slice = CommandErrorSlice(
        cursor=1, total_length=3, commands_errors=[error]
    )

    decoy.when(
        await mock_run_data_manager.get_command_error_slice(
            run_id="run-id",
            cursor=0,
            length=42,
        )
    ).then_return(command_error_slice)

    result = await get_run_commands_error(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=None,
        pageLength=42,
    )

    assert list(result.content.data) == [
        pe_errors.ErrorOccurrence(
            id="error-id",
            errorType="PrettyBadError",
            createdAt=datetime(year=2024, month=4, day=4),
            detail="Things are not looking good.",
        )
    ]
    assert result.content.meta == MultiBodyMeta(cursor=1, totalLength=3)
    assert result.status_code == 200


@pytest.mark.parametrize(
    "error_list, expected_cursor_result",
    [([], 0), ([pe_errors.ErrorOccurrence.model_construct(id="error-id")], 1)],  # type: ignore[call-arg]
)
async def test_get_run_commands_errors_default_cursor(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    error_list: list[pe_errors.ErrorOccurrence],
    expected_cursor_result: int,
) -> None:
    """It should return a list of all commands errors in a run."""
    decoy.when(
        await mock_run_data_manager.get_command_errors_count("run-id")
    ).then_return(1)

    command_error_slice = CommandErrorSlice(
        cursor=expected_cursor_result, total_length=3, commands_errors=error_list
    )

    decoy.when(
        await mock_run_data_manager.get_command_error_slice(
            run_id="run-id",
            cursor=0,
            length=42,
        )
    ).then_return(command_error_slice)

    result = await get_run_commands_error(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
        cursor=None,
        pageLength=42,
    )

    assert list(result.content.data) == error_list
    assert result.content.meta == MultiBodyMeta(
        cursor=expected_cursor_result, totalLength=3
    )
    assert result.status_code == 200


async def test_get_current_state_success(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_hardware_api: HardwareControlAPI,
    labware_definition: LabwareDefinition,
    mock_app_state: AppState,
) -> None:
    """It should return different state from the current run.

    - the active nozzle layout for a specific pipette.
    - place plate reader state for absorbance reader.
    """
    run_id = "test-run-id"

    decoy.when(mock_run_data_manager.get_tip_attached(run_id=run_id)).then_return(
        {"mock-pipette-id": True}
    )

    decoy.when(mock_run_data_manager.get_nozzle_maps(run_id=run_id)).then_return(
        {
            "mock-pipette-id": NozzleMap(
                configuration=NozzleConfigurationType.FULL,
                columns={"1": ["A1"]},
                rows={"A": ["A1"]},
                map_store={"A1": Point(0, 0, 0)},
                starting_nozzle="A1",
                valid_map_key="mock-key",
                full_instrument_map_store={},
                full_instrument_rows={},
                full_instrument_columns={},
            )
        }
    )
    command_pointer = CommandPointer(
        command_id="command-id",
        command_key="command-key",
        created_at=datetime(year=2024, month=4, day=4),
        index=101,
    )
    decoy.when(
        mock_run_data_manager.get_last_completed_command(run_id=run_id)
    ).then_return(command_pointer)
    decoy.when(mock_run_data_manager.get_current_command(run_id=run_id)).then_return(
        command_pointer
    )

    stacker_substates = {
        "mock-stacker-id": FlexStackerSubState(
            module_id=FlexStackerId("mock-stacker-id"),
            pool_primary_definition=labware_definition,
            pool_adapter_definition=None,
            pool_lid_definition=None,
            max_pool_count=6,
            contained_labware_bottom_first=[
                StackerStoredLabwareGroup(primaryLabwareId="heeheehoohoo")
            ],
            pool_overlap=0,
            pool_height=0,
        ),
    }

    decoy.when(
        mock_run_data_manager.get_flex_stacker_substate(run_id=run_id)
    ).then_return(stacker_substates)

    hardware_store = HardwareStateStore(
        hardware_resource=mock_hardware_api,
        attached_modules=[],
        attached_subsystems={},
        estop_state=EstopState.DISENGAGED,
        door_state=DoorState.CLOSED,
        module_door_serial=None,
    )

    result = await get_current_state(
        runId=run_id,
        run_data_manager=mock_run_data_manager,
        hardware_store=hardware_store,
        robot_type=RobotTypeEnum.FLEX,
    )

    assert result.status_code == 200
    assert result.content.data == RunCurrentState.model_construct(
        estopEngaged=False,
        activeNozzleLayouts={
            "mock-pipette-id": ActiveNozzleLayout(
                startingNozzle="A1",
                activeNozzles=["A1"],
                config=NozzleLayoutConfig.FULL,
            )
        },
        tipStates={"mock-pipette-id": TipState(hasTip=True)},
        placeLabwareState=None,
        flexStackerStates={
            "mock-stacker-id": FlexStackerState(
                primaryLabwareURI=labware_definition.namespace
                + "/"
                + labware_definition.parameters.loadName
                + "/"
                + str(labware_definition.version),
                adapterLabwareURI=None,
                lidLabwareURI=None,
                count=1,
                maxCount=6,
            )
        },
    )
    assert result.content.links == CurrentStateLinks(
        lastCompleted=CommandLinkNoMeta(
            href="/runs/test-run-id/commands/command-id",
            id="command-id",
        )
    )


async def test_get_current_state_run_not_current(
    decoy: Decoy,
    mock_run_data_manager: RunDataManager,
    mock_hardware_api: HardwareControlAPI,
    mock_app_state: AppState,
) -> None:
    """It should raise RunStopped when the run is not current."""
    run_id = "non-current-run-id"

    decoy.when(await mock_run_data_manager.get(run_id=run_id)).then_raise(
        RunNotCurrentError("Run is not current")
    )

    hardware_store = HardwareStateStore(
        hardware_resource=mock_hardware_api,
        attached_modules=[],
        attached_subsystems={},
        estop_state=EstopState.DISENGAGED,
        door_state=DoorState.CLOSED,
        module_door_serial=None,
    )

    with pytest.raises(ApiError) as exc_info:
        await get_current_state(
            runId=run_id,
            run_data_manager=mock_run_data_manager,
            hardware_store=hardware_store,
            robot_type=RobotTypeEnum.FLEX,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"

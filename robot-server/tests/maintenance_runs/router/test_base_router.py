"""Tests for base /runs routes."""

from datetime import datetime

import pytest
from decoy import Decoy

from opentrons.protocol_engine import EngineStatus, StateSummary
from opentrons.protocol_engine import types as pe_types
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
    CameraSettings,
)
from opentrons.types import DeckSlotName
from server_utils.fastapi_utils.models.json_api import (
    RequestModel,
    ResourceLink,
    SimpleEmptyBody,
)

from robot_server.camera.provider import CameraProviderWrapper
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.errors.error_responses import ApiError
from robot_server.maintenance_runs.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from robot_server.maintenance_runs.maintenance_run_models import (
    MaintenanceRun,
    MaintenanceRunCreate,
    MaintenanceRunNotFoundError,
)
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    RunConflictError,
)
from robot_server.maintenance_runs.router.base_router import (
    AllRunsLinks,
    create_run,
    get_current_run,
    get_run,
    get_run_data_from_url,
    remove_run,
)
from robot_server.runs.run_data_manager import RunDataManager


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def labware_offset_create() -> pe_types.LegacyLabwareOffsetCreate:
    """Get a labware offset create request value object."""
    return pe_types.LegacyLabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
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


async def test_create_run(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    labware_offset_create: pe_types.LabwareOffsetCreate,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should be able to create a basic run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)

    expected_response = MaintenanceRun(
        id=run_id,
        createdAt=run_created_at,
        current=True,
        errors=[],
        actions=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        status=pe_types.EngineStatus.IDLE,
        liquids=[],
        liquidClasses=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(
        await mock_maintenance_run_data_manager.create(
            run_id=run_id,
            created_at=run_created_at,
            labware_offsets=[labware_offset_create],
            deck_configuration=[],
            notify_publishers=mock_notify_publishers,
            camera_provider=mock_camera_provider,
        )
    ).then_return(expected_response)

    result = await create_run(
        request_body=RequestModel(
            data=MaintenanceRunCreate(labwareOffsets=[labware_offset_create])
        ),
        run_data_manager=mock_maintenance_run_data_manager,
        run_id=run_id,
        created_at=run_created_at,
        is_ok_to_create_maintenance_run=True,
        deck_configuration_store=mock_deck_configuration_store,
        notify_publishers=mock_notify_publishers,
        camera_provider=mock_camera_provider,
        check_estop=True,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201


async def test_create_maintenance_run_with_protocol_run_conflict(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    mock_deck_configuration_store: DeckConfigurationStore,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should respond with a conflict error if protocol run is active during maintenance run creation."""
    created_at = datetime(year=2021, month=1, day=1)
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    with pytest.raises(ApiError) as exc_info:
        await create_run(
            run_id="run-id",
            created_at=created_at,
            request_body=None,
            run_data_manager=mock_maintenance_run_data_manager,
            is_ok_to_create_maintenance_run=False,
            deck_configuration_store=mock_deck_configuration_store,
            check_estop=True,
            notify_publishers=mock_notify_publishers,
            camera_provider=mock_camera_provider,
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "ProtocolRunIsActive"


async def test_get_run_data_from_url(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should be able to get a run by ID."""
    expected_response = MaintenanceRun(
        id="run-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.IDLE,
        current=False,
        errors=[],
        actions=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
        liquidClasses=[],
        hasEverEnteredErrorRecovery=False,
    )

    decoy.when(mock_maintenance_run_data_manager.get("run-id")).then_return(
        expected_response
    )

    result = await get_run_data_from_url(
        runId="run-id",
        run_data_manager=mock_maintenance_run_data_manager,
    )

    assert result == expected_response


async def test_get_run_with_missing_id(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = MaintenanceRunNotFoundError(run_id="run-id")

    decoy.when(mock_maintenance_run_data_manager.get(run_id="run-id")).then_raise(
        not_found_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_run_data_from_url(
            runId="run-id",
            run_data_manager=mock_maintenance_run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run() -> None:
    """It should wrap the run data in a response."""
    run_data = MaintenanceRun(
        id="run-id",
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
        hasEverEnteredErrorRecovery=False,
    )

    result = await get_run(run_data=run_data)

    assert result.content.data == run_data
    assert result.status_code == 200


async def test_get_current_run(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should wrap the current run data in a response."""
    current_run_data = MaintenanceRun(
        id="current-run-id",
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
        hasEverEnteredErrorRecovery=False,
    )
    decoy.when(mock_maintenance_run_data_manager.current_run_id).then_return(
        "current-run-id"
    )
    decoy.when(mock_maintenance_run_data_manager.get("current-run-id")).then_return(
        current_run_data
    )

    result = await get_current_run(run_data_manager=mock_maintenance_run_data_manager)

    assert result.content.data == current_run_data
    assert result.content.links == AllRunsLinks(
        current=ResourceLink(href="/maintenance_runs/current-run-id")
    )
    assert result.status_code == 200


async def test_get_no_current_run(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should return an empty collection response when no current run exists."""
    decoy.when(mock_maintenance_run_data_manager.current_run_id).then_return(None)

    with pytest.raises(ApiError) as exc_info:
        await get_current_run(run_data_manager=mock_maintenance_run_data_manager)

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "NoCurrentRunFound"


async def test_delete_run_by_id(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    mock_run_data_manager: RunDataManager,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should be able to remove a run by ID."""
    result = await remove_run(
        runId="run-id",
        maintenance_run_data_manager=mock_maintenance_run_data_manager,
        run_data_manager=mock_run_data_manager,
        camera_provider=mock_camera_provider,
    )

    decoy.verify(
        await mock_maintenance_run_data_manager.delete(
            "run-id", None, camera_provider=mock_camera_provider
        ),
        times=1,
    )

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_by_id_with_external_run(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    mock_run_data_manager: RunDataManager,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should pass in external camera settings if an external run exists when deleting a maintenance run."""
    assert mock_run_data_manager.current_run_id is not None
    decoy.when(
        mock_run_data_manager._get_good_state_summary(
            mock_run_data_manager.current_run_id
        )
    ).then_return(
        StateSummary(
            status=EngineStatus.IDLE,
            errors=[],
            labware=[],
            pipettes=[],
            modules=[],
            peripherals=[],
            labwareOffsets=[],
            liquids=[],
            wells=[],
            files=[],
            liquidClasses=[],
            tasks=[],
            cameraSettings=CameraSettings(
                cameraEnabled=True,
                liveStreamEnabled=True,
                errorRecoveryCameraEnabled=True,
            ),
        )
    )
    result = await remove_run(
        runId="run-id",
        maintenance_run_data_manager=mock_maintenance_run_data_manager,
        run_data_manager=mock_run_data_manager,
        camera_provider=mock_camera_provider,
    )

    decoy.verify(
        await mock_maintenance_run_data_manager.delete(
            "run-id",
            CameraSettings(
                cameraEnabled=True,
                liveStreamEnabled=True,
                errorRecoveryCameraEnabled=True,
            ),
            camera_provider=mock_camera_provider,
        ),
        times=1,
    )

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_with_bad_id(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    mock_run_data_manager: RunDataManager,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should 404 if the run ID does not exist."""
    decoy.when(
        await mock_maintenance_run_data_manager.delete(  # type: ignore[func-returns-value]
            "run-id", None, camera_provider=mock_camera_provider
        )
    ).then_raise(MaintenanceRunNotFoundError("uh oh"))

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            maintenance_run_data_manager=mock_maintenance_run_data_manager,
            run_data_manager=mock_run_data_manager,
            camera_provider=mock_camera_provider,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_delete_active_run(
    decoy: Decoy,
    mock_maintenance_run_data_manager: MaintenanceRunDataManager,
    mock_run_data_manager: RunDataManager,
    mock_camera_provider: CameraProvider,
) -> None:
    """It should 409 if the run is not finished."""
    decoy.when(
        await mock_maintenance_run_data_manager.delete(  # type: ignore[func-returns-value]
            "run-id", None, camera_provider=mock_camera_provider
        )
    ).then_raise(RunConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await remove_run(
            runId="run-id",
            maintenance_run_data_manager=mock_maintenance_run_data_manager,
            run_data_manager=mock_run_data_manager,
            camera_provider=mock_camera_provider,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotIdle"

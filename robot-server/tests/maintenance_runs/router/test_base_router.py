"""Tests for base /runs routes."""
import pytest
from datetime import datetime
from decoy import Decoy
from pathlib import Path

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import LabwareOffsetCreate, types as pe_types
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig

from robot_server.errors import ApiError
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    MultiBodyMeta,
    ResourceLink,
)

from robot_server.protocols import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
)


from robot_server.maintenance_run.maintenance_run_models import (
    MaintenanceRun,
    MaintenanceRunCreate,
)
from robot_server.maintenance_run.engine_store import EngineConflictError
from robot_server.maintenance_run.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
    RunNotCurrentError,
)
from robot_server.runs.run_models import RunNotFoundError
from robot_server.maintenance_run.router.base_router import (
    create_run,
    get_run_data_from_url,
    get_run,
    remove_run,
)


@pytest.fixture
def labware_offset_create() -> LabwareOffsetCreate:
    """Get a labware offset create request value object."""
    return pe_types.LabwareOffsetCreate(
        definitionUri="namespace_1/load_name_1/123",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )


async def test_create_run(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
    labware_offset_create: pe_types.LabwareOffsetCreate,
) -> None:
    """It should be able to create a basic run."""
    run_id = "run-id"
    run_created_at = datetime(year=2021, month=1, day=1)

    expected_response = MaintenanceRun(
        id=run_id,
        createdAt=run_created_at,
        current=True,
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        status=pe_types.EngineStatus.IDLE,
        liquids=[],
    )

    decoy.when(
        await mock_run_data_manager.create(
            run_id=run_id,
            created_at=run_created_at,
            labware_offsets=[labware_offset_create],
        )
    ).then_return(expected_response)

    result = await create_run(
        request_body=RequestModel(
            data=MaintenanceRunCreate(labwareOffsets=[labware_offset_create])
        ),
        run_data_manager=mock_run_data_manager,
        run_id=run_id,
        created_at=run_created_at,
    )

    assert result.content.data == expected_response
    assert result.status_code == 201


async def test_create_run_conflict(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should respond with a conflict error if multiple engines are created."""
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_run_data_manager.create(
            run_id="run-id",
            created_at=created_at,
            labware_offsets=[],
        )
    ).then_raise(EngineConflictError("oh no"))

    with pytest.raises(ApiError) as exc_info:
        await create_run(
            run_id="run-id",
            created_at=created_at,
            request_body=None,
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunAlreadyActive"


async def test_get_run_data_from_url(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should be able to get a run by ID."""
    expected_response = MaintenanceRun(
        id="run-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_types.EngineStatus.IDLE,
        current=False,
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
    )

    decoy.when(mock_run_data_manager.get("run-id")).then_return(expected_response)

    result = await get_run_data_from_url(
        runId="run-id",
        run_data_manager=mock_run_data_manager,
    )

    assert result == expected_response


async def test_get_run_with_missing_id(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(mock_run_data_manager.get(run_id="run-id")).then_raise(not_found_error)

    with pytest.raises(ApiError) as exc_info:
        await get_run_data_from_url(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_get_run_not_found(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_current_error = RunNotFoundError(run_id="run-id")

    decoy.when(mock_run_data_manager.get(run_id="run-id")).then_raise(not_current_error)

    with pytest.raises(ApiError) as exc_info:
        await get_run_data_from_url(
            runId="run-id",
            run_data_manager=mock_run_data_manager,
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
        errors=[],
        pipettes=[],
        modules=[],
        labware=[],
        labwareOffsets=[],
        liquids=[],
    )

    result = await get_run(run_data=run_data)

    assert result.content.data == run_data
    assert result.status_code == 200


async def test_delete_run_by_id(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should be able to remove a run by ID."""
    result = await remove_run(runId="run-id", run_data_manager=mock_run_data_manager)

    decoy.verify(await mock_run_data_manager.delete("run-id"), times=1)

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_with_bad_id(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 404 if the run ID does not exist."""
    key_error = RunNotFoundError(run_id="run-id")

    decoy.when(await mock_run_data_manager.delete("run-id")).then_raise(key_error)

    with pytest.raises(ApiError) as exc_info:
        await remove_run(runId="run-id", run_data_manager=mock_run_data_manager)

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_delete_active_run(
    decoy: Decoy,
    mock_run_data_manager: MaintenanceRunDataManager,
) -> None:
    """It should 409 if the run is not finished."""
    decoy.when(await mock_run_data_manager.delete("run-id")).then_raise(
        EngineConflictError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await remove_run(runId="run-id", run_data_manager=mock_run_data_manager)

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunNotIdle"

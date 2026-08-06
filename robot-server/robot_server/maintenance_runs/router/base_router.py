"""Base router for /maintenance_runs endpoints.

Contains routes dealing primarily with `Maintenance Run` models.
"""

import logging
from datetime import datetime
from textwrap import dedent
from typing import Annotated, Callable, Optional

from fastapi import Depends, status
from pydantic import BaseModel, Field
from typing_extensions import Literal

from opentrons.protocol_engine.resources.camera_provider import CameraProvider
from opentrons.protocol_engine.types import EngineStatus
from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    Body,
    PydanticResponse,
    RequestModel,
    ResourceLink,
    SimpleBody,
    SimpleEmptyBody,
)

from ..dependencies import get_maintenance_run_data_manager
from ..maintenance_run_data_manager import MaintenanceRunDataManager
from ..maintenance_run_models import (
    MaintenanceRun,
    MaintenanceRunCreate,
    MaintenanceRunNotFoundError,
)
from ..maintenance_run_orchestrator_store import RunConflictError
from robot_server.camera.fastapi_dependencies import (
    get_camera_provider,
)
from robot_server.deck_configuration.fastapi_dependencies import (
    get_deck_configuration_store,
)
from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.robot.control.dependencies import require_estop_in_good_state
from robot_server.runs.dependencies import (
    get_is_okay_to_create_maintenance_run,
    get_run_data_manager,
)
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.notifications import get_pe_notify_publishers

log = logging.getLogger(__name__)
base_router = LightRouter()


# TODO (spp, 2023-04-10): move all error types from maintenance & regular runs
#  to a shared location
class RunNotFound(ErrorDetails):
    """An error if a given run is not found."""

    id: Literal["RunNotFound"] = "RunNotFound"
    title: str = "Run Not Found"


class NoCurrentRunFound(ErrorDetails):
    """An error if there is no current run to fetch."""

    id: Literal["NoCurrentRunFound"] = "NoCurrentRunFound"
    title: str = "No current run found"


class RunAlreadyActive(ErrorDetails):
    """An error if one tries to create a new run while one is already active."""

    id: Literal["RunAlreadyActive"] = "RunAlreadyActive"
    title: str = "Run Already Active"


class ProtocolRunIsActive(ErrorDetails):
    """An error if one tries to create a maintenance run while a protocol run is active."""

    id: Literal["ProtocolRunIsActive"] = "ProtocolRunIsActive"
    title: str = "Protocol Run Is Active"


class RunNotIdle(ErrorDetails):
    """An error if one tries to delete a run that is not idle."""

    id: Literal["RunNotIdle"] = "RunNotIdle"
    title: str = "Run is not idle."
    detail: str = (
        "Run is currently active. Allow the run to finish or"
        " stop it with a `stop` action before attempting to modify it."
    )


class RunStopped(ErrorDetails):
    """An error if one tries to modify a stopped run."""

    id: Literal["RunStopped"] = "RunStopped"
    title: str = "Run Stopped"


class AllRunsLinks(BaseModel):
    """Links returned along with a collection of runs."""

    current: Optional[ResourceLink] = Field(
        None,
        description="Path to the currently active run, if a run is active.",
    )


async def get_run_data_from_url(
    runId: str,
    run_data_manager: Annotated[
        MaintenanceRunDataManager, Depends(get_maintenance_run_data_manager)
    ],
) -> MaintenanceRun:
    """Get the data of a maintenance run.

    Args:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
    """
    try:
        run_data = run_data_manager.get(runId)
    except MaintenanceRunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return run_data


@PydanticResponse.wrap_route(
    base_router.post,
    path="/maintenance_runs",
    summary="Create a maintenance run",
    description=dedent("""
        Create a new maintenance run to track robot interaction.

        If a maintenance run already exists, it will be cleared
        and a new one will be created.

        Will raise an error if a *protocol* run exists and is not idle.
        """),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[MaintenanceRun]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[ProtocolRunIsActive]},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("create maintenance run")),
    ],
)
async def create_run(
    run_data_manager: Annotated[
        MaintenanceRunDataManager, Depends(get_maintenance_run_data_manager)
    ],
    run_id: Annotated[str, Depends(get_unique_id)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    is_ok_to_create_maintenance_run: Annotated[
        bool, Depends(get_is_okay_to_create_maintenance_run)
    ],
    check_estop: Annotated[bool, Depends(require_estop_in_good_state)],
    deck_configuration_store: Annotated[
        DeckConfigurationStore, Depends(get_deck_configuration_store)
    ],
    notify_publishers: Annotated[Callable[[], None], Depends(get_pe_notify_publishers)],
    camera_provider: Annotated[CameraProvider, Depends(get_camera_provider)],
    request_body: Optional[RequestModel[MaintenanceRunCreate]] = None,
) -> PydanticResponse[SimpleBody[MaintenanceRun]]:
    """Create a new maintenance run.

    Arguments:
        request_body: Optional request body with run creation data.
        run_data_manager: Current run data management.
        run_id: Generated ID to assign to the run.
        created_at: Timestamp to attach to created run.
        is_ok_to_create_maintenance_run: Verify if a maintenance run may be created if a protocol run exists.
        check_estop: Dependency to verify the estop is in a valid state.
        deck_configuration_store: Dependency to fetch the deck configuration.
        camera_provider: Dependency to provide access to the Camera Settings to the run.
        notify_publishers: Utilized by the engine to notify publishers of state changes.
    """
    if not is_ok_to_create_maintenance_run:
        raise ProtocolRunIsActive(
            detail="Cannot create maintenance run when a protocol run is active."
        ).as_error(status.HTTP_409_CONFLICT)

    offsets = request_body.data.labwareOffsets if request_body is not None else []
    deck_configuration = await deck_configuration_store.get_deck_configuration()

    run_data = await run_data_manager.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=offsets,
        deck_configuration=deck_configuration,
        notify_publishers=notify_publishers,
        camera_provider=camera_provider,
    )

    log.info(f'Created an empty run "{run_id}"".')
    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=run_data),
        status_code=status.HTTP_201_CREATED,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/maintenance_runs/current_run",
    summary="Get the current maintenance run",
    description="Get the currently active maintenance run, if any",
    responses={
        status.HTTP_200_OK: {"model": Body[MaintenanceRun, AllRunsLinks]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[NoCurrentRunFound]},
    },
)
async def get_current_run(
    run_data_manager: Annotated[
        MaintenanceRunDataManager, Depends(get_maintenance_run_data_manager)
    ],
) -> PydanticResponse[Body[MaintenanceRun, AllRunsLinks]]:
    """Get the current maintenance run.

    Args:
        run_data_manager: Current run data management.
    """
    current_run_id = run_data_manager.current_run_id
    if current_run_id is None:
        raise NoCurrentRunFound(
            detail="No maintenance run currently running."
        ).as_error(status.HTTP_404_NOT_FOUND)

    data = run_data_manager.get(current_run_id)
    links = AllRunsLinks(
        current=ResourceLink.model_construct(href=f"/maintenance_runs/{current_run_id}")
    )

    return await PydanticResponse.create(
        content=Body.model_construct(data=data, links=links),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.get,
    path="/maintenance_runs/{runId}",
    summary="Get a maintenance run",
    description="Get a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[MaintenanceRun]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_run(
    run_data: Annotated[MaintenanceRun, Depends(get_run_data_from_url)],
) -> PydanticResponse[SimpleBody[MaintenanceRun]]:
    """Get a maintenance run by its ID.

    Args:
        run_data: Data of the run specified in the runId url parameter.
    """
    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=run_data),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    base_router.delete,
    path="/maintenance_runs/{runId}",
    summary="Delete a run",
    description="Delete a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("delete maintenance run")),
    ],
)
async def remove_run(
    runId: str,
    maintenance_run_data_manager: Annotated[
        MaintenanceRunDataManager, Depends(get_maintenance_run_data_manager)
    ],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    camera_provider: Annotated[CameraProvider, Depends(get_camera_provider)],
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a maintenance run by its ID.

    Arguments:
        runId: Run ID pulled from URL.
        maintenance_run_data_manager: Current maintenance run data management.
        run_data_manager: Current run data management.
        camera_provider: Utility for accessing image capture and camera settings.
    """
    try:
        camera_settings = None
        if run_data_manager.current_run_id is not None:
            # Import the camera settings from an external run if one exists
            state_summary = run_data_manager._get_good_state_summary(
                run_data_manager.current_run_id
            )
            if (
                state_summary is not None
                and state_summary.status is not EngineStatus.FINISHING
            ):
                camera_settings = state_summary.cameraSettings

        await maintenance_run_data_manager.delete(
            runId, camera_settings, camera_provider
        )

    except RunConflictError as e:
        raise RunNotIdle().as_error(status.HTTP_409_CONFLICT) from e
    except MaintenanceRunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.model_construct(),
        status_code=status.HTTP_200_OK,
    )

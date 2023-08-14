"""Base router for /runs endpoints.

Contains routes dealing primarily with `Run` models.
"""
import logging
from datetime import datetime
from textwrap import dedent
from typing import Optional, Union
from typing_extensions import Literal

from fastapi import APIRouter, Depends, status, Query
from pydantic import BaseModel, Field

from opentrons_shared_data.errors import ErrorCodes

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.robot.control.dependencies import require_estop_in_good_state

from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    SimpleEmptyBody,
    MultiBody,
    MultiBodyMeta,
    ResourceLink,
    PydanticResponse,
)

from robot_server.protocols import (
    ProtocolStore,
    ProtocolNotFound,
    ProtocolNotFoundError,
    get_protocol_store,
)

from ..run_models import RunNotFoundError
from ..run_auto_deleter import RunAutoDeleter
from ..run_models import Run, RunCreate, RunUpdate
from ..engine_store import EngineConflictError
from ..run_data_manager import RunDataManager, RunNotCurrentError
from ..dependencies import get_run_data_manager, get_run_auto_deleter


log = logging.getLogger(__name__)
base_router = APIRouter()


class RunNotFound(ErrorDetails):
    """An error if a given run is not found."""

    id: Literal["RunNotFound"] = "RunNotFound"
    title: str = "Run Not Found"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class RunAlreadyActive(ErrorDetails):
    """An error if one tries to create a new run while one is already active."""

    id: Literal["RunAlreadyActive"] = "RunAlreadyActive"
    title: str = "Run Already Active"
    errorCode: str = ErrorCodes.ROBOT_IN_USE.value.code


class RunNotIdle(ErrorDetails):
    """An error if one tries to delete a run that is not idle."""

    id: Literal["RunNotIdle"] = "RunNotIdle"
    title: str = "Run is not idle."
    detail: str = (
        "Run is currently active. Allow the run to finish or"
        " stop it with a `stop` action before attempting to modify it."
    )
    errorCode: str = ErrorCodes.ROBOT_IN_USE.value.code


class RunStopped(ErrorDetails):
    """An error if one tries to modify a stopped run."""

    id: Literal["RunStopped"] = "RunStopped"
    title: str = "Run Stopped"
    errorCode: str = ErrorCodes.GENERAL_ERROR.value.code


class AllRunsLinks(BaseModel):
    """Links returned along with a collection of runs."""

    current: Optional[ResourceLink] = Field(
        None,
        description="Path to the currently active run, if a run is active.",
    )


async def get_run_data_from_url(
    runId: str,
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> Run:
    """Get the data of a run.

    Args:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
    """
    try:
        run_data = run_data_manager.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return run_data


@base_router.post(
    path="/runs",
    summary="Create a run",
    description=dedent(
        """
        Create a new run to track robot interaction.

        When too many runs already exist, old ones will be automatically deleted
        to make room for the new one.
        """
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunAlreadyActive]},
    },
)
async def create_run(
    request_body: Optional[RequestModel[RunCreate]] = None,
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    run_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
    run_auto_deleter: RunAutoDeleter = Depends(get_run_auto_deleter),
    check_estop: bool = Depends(require_estop_in_good_state),
) -> PydanticResponse[SimpleBody[Run]]:
    """Create a new run.

    Arguments:
        request_body: Optional request body with run creation data.
        run_data_manager: Current and historical run data management.
        protocol_store: Protocol resource storage.
        run_id: Generated ID to assign to the run.
        created_at: Timestamp to attach to created run.
        run_auto_deleter: An interface to delete old resources to make room for
            the new run.
        check_estop: Dependency to verify the estop is in a valid state.
    """
    protocol_id = request_body.data.protocolId if request_body is not None else None
    offsets = request_body.data.labwareOffsets if request_body is not None else []
    protocol_resource = None

    # TODO (tz, 5-16-22): same error raised twice.
    #  Check if we can consolidate to one place.
    if protocol_id is not None:
        try:
            protocol_resource = protocol_store.get(protocol_id=protocol_id)
        except ProtocolNotFoundError as e:
            raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    # TODO(mc, 2022-05-13): move inside `RunDataManager` or return data
    # to pass to `RunDataManager.create`. Right now, runs may be deleted
    # even if a new create is unable to succeed due to a conflict
    run_auto_deleter.make_room_for_new_run()

    try:
        run_data = await run_data_manager.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=offsets,
            protocol=protocol_resource,
        )
    except EngineConflictError as e:
        raise RunAlreadyActive(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except ProtocolNotFoundError as e:
        raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    log.info(f'Created protocol run "{run_id}" from protocol "{protocol_id}".')

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=run_data),
        status_code=status.HTTP_201_CREATED,
    )


@base_router.get(
    path="/runs",
    summary="Get all runs",
    description="Get a list of all active and inactive runs.",
    responses={
        status.HTTP_200_OK: {"model": MultiBody[Run, AllRunsLinks]},
    },
)
async def get_runs(
    pageLength: Optional[int] = Query(
        None,
        description=(
            "The maximum number of runs to return."
            " If this is less than the total number of runs,"
            " the most-recently created runs will be returned."
            " If this is omitted or `null`, all runs will be returned."
        ),
    ),
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[MultiBody[Run, AllRunsLinks]]:
    """Get all runs, in order from least-recently to most-recently created.

    Args:
        pageLength: Maximum number of items to return.
        run_data_manager: Current and historical run data management.
    """
    data = run_data_manager.get_all(length=pageLength)
    current_run_id = run_data_manager.current_run_id
    meta = MultiBodyMeta(cursor=0, totalLength=len(data))
    links = AllRunsLinks(
        current=ResourceLink.construct(href=f"/runs/{current_run_id}")
        if current_run_id is not None
        else None
    )

    return await PydanticResponse.create(
        content=MultiBody.construct(data=data, links=links, meta=meta),
        status_code=status.HTTP_200_OK,
    )


@base_router.get(
    path="/runs/{runId}",
    summary="Get a run",
    description="Get a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_run(
    run_data: Run = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[Run]]:
    """Get a run by its ID.

    Args:
        run_data: Data of the run specified in the runId url parameter.
    """
    return await PydanticResponse.create(
        content=SimpleBody.construct(data=run_data),
        status_code=status.HTTP_200_OK,
    )


@base_router.delete(
    path="/runs/{runId}",
    summary="Delete a run",
    description="Delete a specific run by its unique identifier.",
    responses={
        status.HTTP_200_OK: {"model": SimpleEmptyBody},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def remove_run(
    runId: str,
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a run by its ID.

    Arguments:
        runId: Run ID pulled from URL.
        run_data_manager: Current and historical run data management.
    """
    try:
        await run_data_manager.delete(runId)

    except EngineConflictError as e:
        raise RunNotIdle().as_error(status.HTTP_409_CONFLICT) from e

    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleEmptyBody.construct(),
        status_code=status.HTTP_200_OK,
    )


@base_router.patch(
    path="/runs/{runId}",
    summary="Update a run",
    description="Update a specific run, returning the updated resource.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[Union[RunStopped, RunNotIdle]]},
    },
)
async def update_run(
    runId: str,
    request_body: RequestModel[RunUpdate],
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[SimpleBody[Run]]:
    """Update a run by its ID.

    Args:
        runId: Run ID pulled from URL.
        request_body: Update data from request body.
        run_data_manager: Current and historical run data management.
    """
    try:
        run_data = await run_data_manager.update(
            runId, current=request_body.data.current
        )
    except EngineConflictError as e:
        raise RunNotIdle(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunNotCurrentError as e:
        raise RunStopped(detail=str(e)).as_error(status.HTTP_409_CONFLICT) from e
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=run_data),
        status_code=status.HTTP_200_OK,
    )

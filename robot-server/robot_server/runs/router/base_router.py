"""Base router for /runs endpoints.

Contains routes dealing primarily with `Run` models.
"""
import logging
from datetime import datetime
from typing import Optional, Union
from typing_extensions import Literal

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.task_runner import TaskRunner
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

from ..run_store import RunStore, RunResource, RunNotFoundError
from ..run_view import RunView
from ..run_models import Run, RunSummary, RunCreate, RunUpdate
from ..engine_store import EngineStore, EngineConflictError
from ..dependencies import get_run_store, get_engine_store


log = logging.getLogger(__name__)
base_router = APIRouter()


class RunNotFound(ErrorDetails):
    """An error if a given run is not found."""

    id: Literal["RunNotFound"] = "RunNotFound"
    title: str = "Run Not Found"


class RunAlreadyActive(ErrorDetails):
    """An error if one tries to create a new run while one is already active."""

    id: Literal["RunAlreadyActive"] = "RunAlreadyActive"
    title: str = "Run Already Active"


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
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> Run:
    """Get the data of a run.

    Args:
        runId: Run ID pulled from URL.
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    try:
        run = run_store.get(run_id=runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    engine_state = engine_store.get_state(run.run_id)

    return Run.construct(
        id=run.run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        errors=engine_state.commands.get_all_errors(),
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )


@base_router.post(
    path="/runs",
    summary="Create a run",
    description="Create a new run to track robot interaction.",
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunAlreadyActive]},
    },
)
async def create_run(
    request_body: Optional[RequestModel[RunCreate]] = None,
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
    protocol_store: ProtocolStore = Depends(get_protocol_store),
    run_id: str = Depends(get_unique_id),
    created_at: datetime = Depends(get_current_time),
    task_runner: TaskRunner = Depends(TaskRunner),
) -> PydanticResponse[SimpleBody[Run]]:
    """Create a new run.

    Arguments:
        request_body: Optional request body with run creation data.
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
        protocol_store: Protocol resource storage.
        run_id: Generated ID to assign to the run.
        created_at: Timestamp to attach to created run.
        task_runner: Background task runner.
    """
    protocol_id = request_body.data.protocolId if request_body is not None else None
    protocol_resource = None

    if protocol_id is not None:
        try:
            protocol_resource = protocol_store.get(protocol_id=protocol_id)
        except ProtocolNotFoundError as e:
            raise ProtocolNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    try:
        engine_state = await engine_store.create(run_id=run_id)
    except EngineConflictError as e:
        raise RunAlreadyActive(detail=str(e)).as_error(status.HTTP_409_CONFLICT)

    if request_body is not None:
        for offset_request in request_body.data.labwareOffsets:
            engine_store.engine.add_labware_offset(offset_request)

    if protocol_resource is not None:
        engine_store.runner.load(protocol_resource.source)

    run = RunResource(
        run_id=run_id,
        protocol_id=protocol_id,
        created_at=created_at,
        is_current=True,
        actions=[],
    )

    run_store.upsert(run=run)
    log.info(f'Created protocol run "{run_id}" from protocol "{protocol_id}".')

    data = Run.construct(
        id=run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        errors=[],
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=data),
        status_code=status.HTTP_201_CREATED,
    )


@base_router.get(
    path="/runs",
    summary="Get all runs",
    description="Get a list of all active and inactive runs.",
    responses={
        status.HTTP_200_OK: {"model": MultiBody[RunSummary, AllRunsLinks]},
    },
)
async def get_runs(
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> PydanticResponse[MultiBody[RunSummary, AllRunsLinks]]:
    """Get all runs.

    Args:
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    data = []
    links = AllRunsLinks()

    for run in run_store.get_all():
        run_id = run.run_id
        engine_state = engine_store.get_state(run_id)
        run_data = RunSummary.construct(
            id=run_id,
            protocolId=run.protocol_id,
            createdAt=run.created_at,
            current=run.is_current,
            status=engine_state.commands.get_status(),
        )

        data.append(run_data)

        if run.is_current:
            links.current = ResourceLink.construct(href=f"/runs/{run.run_id}")

    meta = MultiBodyMeta(cursor=0, totalLength=len(data))

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
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> PydanticResponse[SimpleEmptyBody]:
    """Delete a run by its ID.

    Arguments:
        runId: Run ID pulled from URL.
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    try:
        await engine_store.clear()
    except EngineConflictError:
        raise RunNotIdle().as_error(status.HTTP_409_CONFLICT)

    try:
        run_store.remove(run_id=runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

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
    run_view: RunView = Depends(RunView),
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> PydanticResponse[SimpleBody[Run]]:
    """Update a run by its ID.

    Args:
        runId: Run ID pulled from URL.
        request_body: Update data from request body.
        run_view: Run model manipulation interface.
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    update = request_body.data

    try:
        run = run_store.get(run_id=runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    if run.is_current is False:
        raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )
    elif update.current is False:
        run = run_view.with_update(run=run, update=update)

        try:
            await engine_store.clear()
        except EngineConflictError:
            raise RunNotIdle().as_error(status.HTTP_409_CONFLICT)

        run_store.upsert(run)
        log.info(f'Marked run "{runId}" as not current.')

    engine_state = engine_store.get_state(run.run_id)

    data = Run.construct(
        id=run.run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        errors=engine_state.commands.get_all_errors(),
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=data),
        status_code=status.HTTP_200_OK,
    )

"""Base router for /runs endpoints.

Contains routes dealing primarily with `Run` models.
"""
from fastapi import APIRouter, Depends, status
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Union
from typing_extensions import Literal

from opentrons.protocol_engine import LabwareOffsetCreate

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.dependencies import get_current_time, get_unique_id
from robot_server.service.task_runner import TaskRunner
from robot_server.service.json_api import (
    RequestModel,
    SimpleResponseModel,
    SimpleEmptyResponseModel,
    MultiResponseModel,
    ResourceLink,
)

from robot_server.protocols import (
    ProtocolStore,
    ProtocolNotFound,
    ProtocolNotFoundError,
    get_protocol_store,
)

from ..run_store import RunStore, RunResource, RunNotFoundError
from ..run_view import RunView
from ..run_models import (
    Run,
    RunCreate,
    RunUpdate,
    RunCommandSummary,
)
from ..engine_store import EngineStore, EngineConflictError
from ..dependencies import get_run_store, get_engine_store

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


@base_router.post(
    path="/runs",
    summary="Create a run",
    description="Create a new run to track robot interaction.",
    status_code=status.HTTP_201_CREATED,
    response_model=SimpleResponseModel[Run],
    response_model_exclude_none=True,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[ProtocolNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse[RunAlreadyActive]},
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
) -> SimpleResponseModel[Run]:
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

    # TODO(mc, 2021-08-05): capture errors from `runner.join` and place
    # them in the run resource
    task_runner.run(engine_store.runner.join)

    run = RunResource(
        run_id=run_id,
        protocol_id=protocol_id,
        created_at=created_at,
        is_current=True,
        actions=[],
    )

    run_store.upsert(run=run)

    data = Run(
        id=run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        commands=[
            RunCommandSummary(id=c.id, commandType=c.commandType, status=c.status)
            for c in engine_state.commands.get_all()
        ],
        errors=[],
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return SimpleResponseModel(data=data)


@base_router.get(
    path="/runs",
    summary="Get all runs",
    description="Get a list of all active and inactive runs.",
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[Run, AllRunsLinks],
    response_model_exclude_none=True,
)
async def get_runs(
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> MultiResponseModel[Run, AllRunsLinks]:
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
        run_data = Run(
            id=run_id,
            protocolId=run.protocol_id,
            createdAt=run.created_at,
            current=run.is_current,
            actions=run.actions,
            commands=[
                RunCommandSummary(
                    id=c.id,
                    commandType=c.commandType,
                    status=c.status,
                    errorId=c.errorId,
                )
                for c in engine_state.commands.get_all()
            ],
            errors=engine_state.commands.get_all_errors(),
            pipettes=engine_state.pipettes.get_all(),
            labware=engine_state.labware.get_all(),
            labwareOffsets=engine_state.labware.get_labware_offsets(),
            status=engine_state.commands.get_status(),
        )

        data.append(run_data)

        if run.is_current:
            links.current = ResourceLink(href=f"/runs/{run.run_id}")

    return MultiResponseModel(data=data, links=links)


@base_router.get(
    path="/runs/{runId}",
    summary="Get a run",
    description="Get a specific run by its unique identifier.",
    status_code=status.HTTP_200_OK,
    response_model=SimpleResponseModel[Run],
    response_model_exclude_none=True,
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]}},
)
async def get_run(
    runId: str,
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> SimpleResponseModel[Run]:
    """Get a run by its ID.

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

    data = Run(
        id=run.run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        commands=[
            RunCommandSummary(
                id=c.id,
                commandType=c.commandType,
                status=c.status,
                errorId=c.errorId,
            )
            for c in engine_state.commands.get_all()
        ],
        errors=engine_state.commands.get_all_errors(),
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return SimpleResponseModel(data=data)


@base_router.delete(
    path="/runs/{runId}",
    summary="Delete a run",
    description="Delete a specific run by its unique identifier.",
    status_code=status.HTTP_200_OK,
    response_model=SimpleEmptyResponseModel,
    response_model_exclude_none=True,
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]}},
)
async def remove_run(
    runId: str,
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> SimpleEmptyResponseModel:
    """Delete a run by its ID.

    Arguments:
        runId: Run ID pulled from URL.
        run_store: Run storage interface.
        engine_store: ProtocolEngine storage and control.
    """
    try:
        engine_store.clear()
    except EngineConflictError:
        raise RunNotIdle().as_error(status.HTTP_409_CONFLICT)

    try:
        run_store.remove(run_id=runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return SimpleEmptyResponseModel()


@base_router.post(
    path="/runs/{runId}/labware_offsets",
    summary="Add a labware offset to a run",
    description=(
        "Add a labware offset to an existing run, returning the updated run."
        "\n\n"
        "There is no matching `GET /runs/{runId}/labware_offsets` endpoint."
        " To read the list of labware offsets currently on the run,"
        " see the run's `labwareOffsets` field."
    ),
    status_code=status.HTTP_201_CREATED,
    response_model=SimpleResponseModel[Run],
    response_model_exclude_none=True,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse[Union[RunStopped, RunNotIdle]]
        },
    },
)
async def add_labware_offset(
    runId: str,
    request_body: RequestModel[LabwareOffsetCreate],
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> SimpleResponseModel[Run]:
    """Add a labware offset to a run.

    Args:
        runId: Run ID pulled from URL.
        request_body: New labware offset request data from request body.
        run_store: Run storage interface.
        engine_store: Engine storage interface.
    """
    try:
        run = run_store.get(run_id=runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    if run.is_current is False:
        raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    engine_store.engine.add_labware_offset(request_body.data)

    engine_state = engine_store.get_state(run.run_id)
    data = Run(
        id=run.run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        commands=[
            RunCommandSummary(
                id=c.id,
                commandType=c.commandType,
                status=c.status,
                errorId=c.errorId,
            )
            for c in engine_state.commands.get_all()
        ],
        errors=engine_state.commands.get_all_errors(),
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return SimpleResponseModel(data=data)


@base_router.patch(
    path="/runs/{runId}",
    summary="Update a run",
    description="Update a specific run, returning the updated resource.",
    status_code=status.HTTP_200_OK,
    response_model=SimpleResponseModel[Run],
    response_model_exclude_none=True,
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse[Union[RunStopped, RunNotIdle]]
        },
    },
)
async def update_run(
    runId: str,
    request_body: RequestModel[RunUpdate],
    run_view: RunView = Depends(RunView),
    run_store: RunStore = Depends(get_run_store),
    engine_store: EngineStore = Depends(get_engine_store),
) -> SimpleResponseModel[Run]:
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
            engine_store.clear()
        except EngineConflictError:
            raise RunNotIdle().as_error(status.HTTP_409_CONFLICT)

        run_store.upsert(run)

    engine_state = engine_store.get_state(run.run_id)

    data = Run(
        id=run.run_id,
        protocolId=run.protocol_id,
        createdAt=run.created_at,
        current=run.is_current,
        actions=run.actions,
        commands=[
            RunCommandSummary(
                id=c.id,
                commandType=c.commandType,
                status=c.status,
                errorId=c.errorId,
            )
            for c in engine_state.commands.get_all()
        ],
        errors=engine_state.commands.get_all_errors(),
        pipettes=engine_state.pipettes.get_all(),
        labware=engine_state.labware.get_all(),
        labwareOffsets=engine_state.labware.get_labware_offsets(),
        status=engine_state.commands.get_status(),
    )

    return SimpleResponseModel(data=data)

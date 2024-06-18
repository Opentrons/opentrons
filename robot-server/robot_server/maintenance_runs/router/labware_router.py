"""Router for /maintenance_runs endpoints dealing with labware offsets and definitions."""
import logging
from fastapi import APIRouter, Depends, status

from opentrons.protocol_engine import LabwareOffsetCreate, LabwareOffset
from opentrons.protocols.models import LabwareDefinition

from robot_server.errors.error_responses import ErrorBody
from robot_server.service.json_api import RequestModel, SimpleBody, PydanticResponse

from ..maintenance_run_models import MaintenanceRun, LabwareDefinitionSummary
from ..maintenance_engine_store import MaintenanceEngineStore
from ..dependencies import get_maintenance_engine_store
from .base_router import RunNotFound, RunNotIdle, get_run_data_from_url

log = logging.getLogger(__name__)
labware_router = APIRouter()


@PydanticResponse.wrap_route(
    labware_router.post,
    path="/maintenance_runs/{runId}/labware_offsets",
    summary="Add a labware offset to a maintenance run",
    description=(
        "Add a labware offset to an existing run, returning the created offset."
        "\n\n"
        "There is no matching `GET /maintenance_runs/{runId}/labware_offsets` endpoint."
        " To read the list of labware offsets currently on the run,"
        " see the run's `labwareOffsets` field."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[LabwareOffset]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunNotIdle]},
    },
)
async def add_labware_offset(
    request_body: RequestModel[LabwareOffsetCreate],
    engine_store: MaintenanceEngineStore = Depends(get_maintenance_engine_store),
    run: MaintenanceRun = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[LabwareOffset]]:
    """Add a labware offset to a maintenance run.

    Args:
        request_body: New labware offset request data from request body.
        engine_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
    """
    added_offset = engine_store.add_labware_offset(request_body.data)
    log.info(f'Added labware offset "{added_offset.id}"' f' to run "{run.id}".')

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=added_offset),
        status_code=status.HTTP_201_CREATED,
    )


# TODO(mc, 2022-02-28): add complementary GET endpoint
# https://github.com/Opentrons/opentrons/issues/9427
@PydanticResponse.wrap_route(
    labware_router.post,
    path="/maintenance_runs/{runId}/labware_definitions",
    summary="Add a labware definition to a maintenance run",
    description=(
        "Add a labware definition to a run, returning the added definition's URI."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[MaintenanceRun]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunNotIdle]},
    },
)
async def add_labware_definition(
    request_body: RequestModel[LabwareDefinition],
    engine_store: MaintenanceEngineStore = Depends(get_maintenance_engine_store),
    run: MaintenanceRun = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[LabwareDefinitionSummary]]:
    """Add a labware offset to a run.

    Args:
        request_body: New labware offset request data from request body.
        engine_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
    """
    uri = engine_store.add_labware_definition(request_body.data)
    log.info(f'Added labware definition "{uri}"' f' to run "{run.id}".')

    return PydanticResponse(
        content=SimpleBody.construct(
            data=LabwareDefinitionSummary.construct(definitionUri=uri)
        ),
        status_code=status.HTTP_201_CREATED,
    )

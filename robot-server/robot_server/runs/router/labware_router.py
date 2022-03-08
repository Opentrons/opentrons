"""Router for /runs endpoints dealing with labware offsets and definitions."""
import logging
from typing import Union

from fastapi import APIRouter, Depends, status

from opentrons.protocol_engine import LabwareOffsetCreate, LabwareOffset
from opentrons.protocols.models import LabwareDefinition

from robot_server.errors import ErrorBody
from robot_server.service.json_api import RequestModel, SimpleBody, PydanticResponse

from ..run_models import Run, LabwareDefinitionSummary
from ..engine_store import EngineStore
from ..dependencies import get_engine_store
from .base_router import RunNotFound, RunStopped, RunNotIdle, get_run_data_from_url

log = logging.getLogger(__name__)
labware_router = APIRouter()


@labware_router.post(
    path="/runs/{runId}/labware_offsets",
    summary="Add a labware offset to a run",
    description=(
        "Add a labware offset to an existing run, returning the created offset."
        "\n\n"
        "There is no matching `GET /runs/{runId}/labware_offsets` endpoint."
        " To read the list of labware offsets currently on the run,"
        " see the run's `labwareOffsets` field."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[Union[RunStopped, RunNotIdle]]},
    },
)
async def add_labware_offset(
    request_body: RequestModel[LabwareOffsetCreate],
    engine_store: EngineStore = Depends(get_engine_store),
    run: Run = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[LabwareOffset]]:
    """Add a labware offset to a run.

    Args:
        request_body: New labware offset request data from request body.
        engine_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
    """
    if run.current is False:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    added_offset = engine_store.engine.add_labware_offset(request_body.data)
    log.info(f'Added labware offset "{added_offset.id}"' f' to run "{run.id}".')

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=added_offset),
        status_code=status.HTTP_201_CREATED,
    )


# TODO(mc, 2022-02-28): add complementary GET endpoint
# https://github.com/Opentrons/opentrons/issues/9427
@labware_router.post(
    path="/runs/{runId}/labware_definitions",
    summary="Add a labware definition to a run",
    description=(
        "Add a labware definition to a run, returning the added definition's URI."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[Run]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[Union[RunStopped, RunNotIdle]]},
    },
)
async def add_labware_definition(
    request_body: RequestModel[LabwareDefinition],
    engine_store: EngineStore = Depends(get_engine_store),
    run: Run = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[LabwareDefinitionSummary]]:
    """Add a labware offset to a run.

    Args:
        request_body: New labware offset request data from request body.
        engine_store: Engine storage interface.
        run: Run response data by ID from URL; ensures 404 if run not found.
    """
    if run.current is False:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    uri = engine_store.engine.add_labware_definition(request_body.data)
    log.info(f'Added labware definition "{uri}"' f' to run "{run.id}".')

    return PydanticResponse(
        content=SimpleBody.construct(
            data=LabwareDefinitionSummary.construct(definitionUri=uri)
        ),
        status_code=status.HTTP_201_CREATED,
    )

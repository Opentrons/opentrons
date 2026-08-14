"""Router for /runs command annotations endpoints."""

from typing import Annotated, Final, Literal, Optional, Union

from fastapi.params import Depends, Query
from starlette import status

from opentrons.protocol_engine.errors.exceptions import (
    CommandAnnotationNotFoundError as CommandAnnotationNotFoundInEngineError,
)
from opentrons.protocol_engine.types import CommandAnnotation
from server_utils.fastapi_utils.light_router import LightRouter
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    PydanticResponse,
    SimpleBody,
    SimpleMultiBody,
)

from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.runs.dependencies import get_run_data_manager
from robot_server.runs.router.base_router import RunNotFound
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import (
    CommandAnnotationNotFoundError as CommandAnnotationNotFoundInRunStoreError,
)

_DEFAULT_COMMAND_ANNOTATIONS_LIST_LENGTH: Final = 20

command_annotations_router = LightRouter()


class CommandAnnotationNotFound(ErrorDetails):
    """An error if a given command annotation is not found."""

    id: Literal["CommandAnnotationNotFound"] = "CommandAnnotationNotFound"
    title: str = "Command annotation not found"


@PydanticResponse.wrap_route(
    command_annotations_router.get,
    path="/runs/{runId}/commandAnnotations",
    summary="Get a list of all command annotations in the specified run.",
    description=(
        "Get a list of all command annotations in the specified run. "
        "\n\n"
        "The command annotations are returned in the order that they were created"
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[CommandAnnotation]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_command_annotations_list(
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    cursor: Annotated[
        Optional[int],
        Query(
            description=(
                "The starting index of the desired first command annotation in the list."
                " If unspecified, the cursor will be automatically assigned an index such that"
                " the latest `pageLength` number of command annotations are returned from the list."
                " If total number of command annotations in the run are less than `pageLength`"
                " then cursor is set to zero and all command annotations are returned."
            )
        ),
    ] = None,
    pageLength: Annotated[
        int,
        Query(
            description="The maximum number of command annotations to return from the list."
        ),
    ] = _DEFAULT_COMMAND_ANNOTATIONS_LIST_LENGTH,
) -> PydanticResponse[SimpleMultiBody[CommandAnnotation]]:
    """Get a list of command annotations in the specified run.

    Arguments:
        runId: Unique run identifier.
        run_data_manager: Run data retrieval interface.
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items (annotations) to return.
    """
    try:
        total_command_annotations_count = (
            await run_data_manager.get_total_command_annotations_count(
                run_id=runId,
            )
        )
        if cursor is None:
            cursor = max(total_command_annotations_count - 1, 0)
            cursor = max(cursor - pageLength + 1, 0)
            cursor = min(cursor, total_command_annotations_count)

        annotations_slice = await run_data_manager.get_command_annotations_slice(
            run_id=runId, cursor=cursor, length=pageLength
        )
    except RunNotFoundError as e:
        raise RunNotFound.from_exc(e).as_error(status.HTTP_404_NOT_FOUND) from e

    meta = MultiBodyMeta(
        cursor=annotations_slice.cursor, totalLength=annotations_slice.total_length
    )

    return await PydanticResponse.create(
        content=SimpleMultiBody.model_construct(
            data=annotations_slice.command_annotations, meta=meta
        ),
        status_code=status.HTTP_200_OK,
    )


@PydanticResponse.wrap_route(
    command_annotations_router.get,
    path="/runs/{runId}/commandAnnotations/{commandAnnotationId}",
    summary="Get full details of a specific command annotation in the specified run.",
    description="Get full details of a specific command annotation in the specified run.",
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[CommandAnnotation]},
        status.HTTP_404_NOT_FOUND: {
            "model": Union[
                ErrorBody[RunNotFound], ErrorBody[CommandAnnotationNotFound]
            ],
        },
    },
)
async def get_command_annotation(
    runId: str,
    commandAnnotationId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
) -> PydanticResponse[SimpleBody[CommandAnnotation]]:
    """Get a specific command annotation.

    Arguments:
        runId: Unique run identifier.
        run_data_manager: Run data retrieval interface.
        commandAnnotationId: Unique command annotation identifier.
    """
    try:
        annotation = await run_data_manager.get_command_annotation(
            run_id=runId, annotation_id=commandAnnotationId
        )
    except RunNotFoundError as e:
        raise RunNotFound.from_exc(e).as_error(status.HTTP_404_NOT_FOUND) from e
    except (
        CommandAnnotationNotFoundInEngineError,
        CommandAnnotationNotFoundInRunStoreError,
    ) as e:
        raise CommandAnnotationNotFound.from_exc(e).as_error(
            status.HTTP_404_NOT_FOUND
        ) from e

    return await PydanticResponse.create(
        content=SimpleBody.model_construct(data=annotation),
        status_code=status.HTTP_200_OK,
    )

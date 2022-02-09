"""Router for /runs commands endpoints."""
from asyncio import wait_for, TimeoutError as AsyncioTimeoutError
from typing import Optional, Union
from typing_extensions import Final, Literal

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from opentrons.protocol_engine import commands as pe_commands, errors as pe_errors

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    MultiBody,
    MultiBodyMeta,
    PydanticResponse,
)

from ..run_models import Run, RunCommandSummary
from ..engine_store import EngineStore
from ..dependencies import get_engine_store
from .base_router import RunNotFound, RunStopped, get_run_data_from_url


_DEFAULT_COMMANDS_BEFORE: Final = 20
_DEFAULT_COMMANDS_AFTER: Final = 30

commands_router = APIRouter()


class CommandNotFound(ErrorDetails):
    """An error if a given run command is not found."""

    id: Literal["CommandNotFound"] = "CommandNotFound"
    title: str = "Run Command Not Found"


class CommandLinkMeta(BaseModel):
    """Metadata about a command resource referenced in `links`."""

    runId: str = Field(..., description="The ID of the command's run.")
    commandId: str = Field(..., description="The ID of the command.")


class CommandLink(BaseModel):
    """A link to a command resource."""

    href: str = Field(..., description="The path to a command")
    meta: CommandLinkMeta = Field(..., description="Information about the command.")


class CommandCollectionLinks(BaseModel):
    """Links returned along with a collection of commands."""

    current: Optional[CommandLink] = Field(
        None,
        description="Path to the currently running or next queued command.",
    )


@commands_router.post(
    path="/runs/{runId}/commands",
    summary="Enqueue a protocol command",
    description=(
        "Add a single protocol command to the run. "
        "The command is placed at the back of the queue."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[pe_commands.Command]},
        status.HTTP_400_BAD_REQUEST: {"model": ErrorBody[RunStopped]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def create_run_command(
    request_body: RequestModel[pe_commands.CommandCreate],
    waitUntilComplete: bool = Query(
        default=False,
        description=(
            "If `false`, return immediately, while the new command is still queued."
            "\n\n"
            "If `true`, only return once the new command succeeds or fails,"
            " or when the timeout is reached. See the `timeout` query parameter."
        ),
    ),
    timeout: int = Query(
        default=30_000,
        gt=0,
        description=(
            "If `waitUntilComplete` is `true`,"
            " the maximum number of milliseconds to wait before returning."
            "\n\n"
            "Ignored if `waitUntilComplete` is `false`."
            "\n\n"
            "The timer starts when the new command is enqueued,"
            " *not* when it starts running."
            " So if a different command runs before the new command,"
            " it may exhaust the timeout even if the new command on its own"
            " would have completed in time."
            "\n\n"
            "If the timeout triggers, the command will still be returned"
            " with a `201` HTTP status code."
            " Inspect the returned command's `status` to detect the timeout."
        ),
    ),
    engine_store: EngineStore = Depends(get_engine_store),
    run: Run = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Enqueue a protocol command.

    Arguments:
        request_body: The request containing the command that the client wants
            to enqueue.
        waitUntilComplete: If True, return only once the command is completed.
            Else, return immediately. Comes from a query parameter in the URL.
        timeout: The maximum time, in seconds, to wait before returning.
            Comes from a query parameter in the URL.
        engine_store: Used to retrieve the `ProtocolEngine` on which the new
            command will be enqueued.
        run: Run response model, provided by the route handler for
            `GET /runs/{runId}`. Present to ensure 404 if run
            not found.
    """
    if not run.current:
        raise RunStopped(detail=f"Run {run.id} is not the current run").as_error(
            status.HTTP_400_BAD_REQUEST
        )

    added_command = engine_store.engine.add_command(request_body.data)

    command_to_return: pe_commands.Command

    if waitUntilComplete:
        try:
            await wait_for(
                engine_store.engine.wait_for_command(command_id=added_command.id),
                timeout=timeout / 1000,
            )
            completed_command = engine_store.get_state(run.id).commands.get(
                command_id=added_command.id
            )
            command_to_return = completed_command
        except AsyncioTimeoutError:
            timed_out_command = engine_store.get_state(run.id).commands.get(
                command_id=added_command.id
            )
            command_to_return = timed_out_command
    else:
        command_to_return = added_command

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=command_to_return),
        status_code=status.HTTP_201_CREATED,
    )


@commands_router.get(
    path="/runs/{runId}/commands",
    summary="Get a list of all protocol commands in the run",
    description=(
        "Get a list of all commands in the run and their statuses. "
        "This endpoint returns command summaries. Use "
        "`GET /runs/{runId}/commands/{commandId}` to get all "
        "information available for a given command."
    ),
    responses={
        status.HTTP_200_OK: {
            "model": MultiBody[RunCommandSummary, CommandCollectionLinks]
        },
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
    },
)
async def get_run_commands(
    engine_store: EngineStore = Depends(get_engine_store),
    run: Run = Depends(get_run_data_from_url),
    cursor: Optional[int] = None,
    pageLength: int = _DEFAULT_COMMANDS_BEFORE,
) -> PydanticResponse[MultiBody[RunCommandSummary, CommandCollectionLinks]]:
    """Get a summary of all commands in a run.

    Arguments:
        engine_store: Protocol engine and runner storage.
        run: Run response model, provided by the route handler for `GET /runs/{runId}`
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items to return.
    """
    state = engine_store.get_state(run.id)
    current_command_id = state.commands.get_current()
    command_slice = state.commands.get_slice(cursor=cursor, length=pageLength)

    data = [
        RunCommandSummary.construct(
            id=c.id,
            key=c.key,
            commandType=c.commandType,
            status=c.status,
            createdAt=c.createdAt,
            startedAt=c.startedAt,
            completedAt=c.completedAt,
            params=c.params,
            errorId=c.errorId,
        )
        for c in command_slice.commands
    ]

    meta = MultiBodyMeta(
        cursor=command_slice.cursor,
        pageLength=command_slice.length,
        totalLength=command_slice.total_length,
    )

    links = CommandCollectionLinks()

    if current_command_id is not None:
        links.current = CommandLink(
            href=f"/runs/{run.id}/commands/{current_command_id}",
            meta=CommandLinkMeta(runId=run.id, commandId=current_command_id),
        )

    return await PydanticResponse.create(
        content=MultiBody.construct(data=data, meta=meta, links=links),
        status_code=status.HTTP_200_OK,
    )


@commands_router.get(
    path="/runs/{runId}/commands/{commandId}",
    summary="Get full details about a specific command in the run",
    description=(
        "Get a command along with any associated payload, result, and "
        "execution information."
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[pe_commands.Command]},
        status.HTTP_404_NOT_FOUND: {
            "model": Union[ErrorBody[RunNotFound], ErrorBody[CommandNotFound]]
        },
    },
)
async def get_run_command(
    commandId: str,
    engine_store: EngineStore = Depends(get_engine_store),
    run: Run = Depends(get_run_data_from_url),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Get a specific command from a run.

    Arguments:
        commandId: Command identifier, pulled from route parameter.
        engine_store: Protocol engine and runner storage.
        run: Run response model, provided by the route handler for
            `GET /run/{runId}`. Present to ensure 404 if run
            not found.
    """
    engine_state = engine_store.get_state(run.id)
    try:
        command = engine_state.commands.get(commandId)
    except pe_errors.CommandDoesNotExistError as e:
        raise CommandNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=command),
        status_code=status.HTTP_200_OK,
    )

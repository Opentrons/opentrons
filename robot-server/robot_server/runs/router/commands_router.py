"""Router for /runs commands endpoints."""
import textwrap
from datetime import datetime
from typing import Optional, Union
from typing_extensions import Final, Literal

from anyio import move_on_after
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from opentrons.protocol_engine import (
    ProtocolEngine,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.service.json_api import (
    RequestModel,
    SimpleBody,
    MultiBody,
    MultiBodyMeta,
    PydanticResponse,
)
from robot_server.robot.control.dependencies import require_estop_in_good_state

from ..run_models import RunCommandSummary
from ..run_data_manager import RunDataManager
from ..engine_store import EngineStore
from ..run_store import RunStore, CommandNotFoundError
from ..run_models import RunNotFoundError
from ..dependencies import get_engine_store, get_run_data_manager, get_run_store
from .base_router import RunNotFound, RunStopped


_DEFAULT_COMMAND_LIST_LENGTH: Final = 20

commands_router = APIRouter()


class CommandNotFound(ErrorDetails):
    """An error if a given run command is not found."""

    id: Literal["CommandNotFound"] = "CommandNotFound"
    title: str = "Run Command Not Found"


class CommandNotAllowed(ErrorDetails):
    """An error if a given run command is not allowed."""

    id: Literal["CommandNotAllowed"] = "CommandNotAllowed"
    title: str = "Setup Command Not Allowed"


class CommandLinkMeta(BaseModel):
    """Metadata about a command resource referenced in `links`."""

    runId: str = Field(..., description="The ID of the command's run.")
    commandId: str = Field(..., description="The ID of the command.")
    index: int = Field(..., description="Index of the command in the overall list.")
    key: str = Field(..., description="Value of the current command's `key` field.")
    createdAt: datetime = Field(
        ...,
        description="When the current command was created.",
    )


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


async def get_current_run_engine_from_url(
    runId: str,
    engine_store: EngineStore = Depends(get_engine_store),
    run_store: RunStore = Depends(get_run_store),
) -> ProtocolEngine:
    """Get run protocol engine.

    Args:
        runId: Run ID to associate the command with.
        engine_store: Engine store to pull current run ProtocolEngine.
        run_store: Run data storage.
    """
    if not run_store.has(runId):
        raise RunNotFound(detail=f"Run {runId} not found.").as_error(
            status.HTTP_404_NOT_FOUND
        )

    if runId != engine_store.current_run_id:
        raise RunStopped(detail=f"Run {runId} is not the current run").as_error(
            status.HTTP_409_CONFLICT
        )

    return engine_store.engine


@commands_router.post(
    path="/runs/{runId}/commands",
    summary="Enqueue a command",
    description=textwrap.dedent(
        """
        Add a single command to the run. You can add commands to a run
        for two reasons:

        - Setup commands (`data.source == "setup"`)
        - Protocol commands (`data.source == "protocol"`)

        Setup commands may be enqueued before the run has been started.
        You could use setup commands to prepare a module or
        run labware calibration procedures.

        Protocol commands may be enqueued anytime using this endpoint.
        You can create a protocol purely over HTTP using protocol commands.
        If you are running a protocol from a file(s), then you will likely
        not need to enqueue protocol commands using this endpoint.

        Once enqueued, setup commands will execute immediately with priority,
        while protocol commands will wait until a `play` action is issued.
        A play action may be issued while setup commands are still queued,
        in which case all setup commands will finish executing before
        the run moves on to protocol commands.

        If you are running a protocol file(s), use caution with this endpoint,
        as added commands may interfere with commands added by the protocol
        """
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[pe_commands.Command]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[RunNotFound]},
        status.HTTP_409_CONFLICT: {
            "model": ErrorBody[Union[RunStopped, CommandNotAllowed]]
        },
    },
)
async def create_run_command(
    request_body: RequestModel[pe_commands.CommandCreate],
    waitUntilComplete: bool = Query(
        default=False,
        description=(
            "If `false`, return immediately, while the new command is still queued."
            " If `true`, only return once the new command succeeds or fails,"
            " or when the timeout is reached. See the `timeout` query parameter."
        ),
    ),
    timeout: Optional[int] = Query(
        default=None,
        gt=0,
        description=(
            "If `waitUntilComplete` is `true`,"
            " the maximum time in milliseconds to wait before returning."
            " The default is infinite."
            "\n\n"
            "The timer starts as soon as you enqueue the new command with this request,"
            " *not* when the new command starts running. So if there are other commands"
            " in the queue before the new one, they will also count towards the"
            " timeout."
            "\n\n"
            "If the timeout elapses before the command succeeds or fails,"
            " the command will be returned with its current status."
            "\n\n"
            "Compatibility note: on robot software v6.2.0 and older,"
            " the default was 30 seconds, not infinite."
        ),
    ),
    protocol_engine: ProtocolEngine = Depends(get_current_run_engine_from_url),
    check_estop: bool = Depends(require_estop_in_good_state),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Enqueue a protocol command.

    Arguments:
        request_body: The request containing the command that the client wants
            to enqueue.
        waitUntilComplete: If True, return only once the command is completed.
            Else, return immediately. Comes from a query parameter in the URL.
        timeout: The maximum time, in seconds, to wait before returning.
            Comes from a query parameter in the URL.
        protocol_engine: The run's `ProtocolEngine` on which the new
            command will be enqueued.
        check_estop: Dependency to verify the estop is in a valid state.
    """
    # TODO(mc, 2022-05-26): increment the HTTP API version so that default
    # behavior is to pass through `command_intent` without overriding it
    command_intent = request_body.data.intent or pe_commands.CommandIntent.SETUP
    command_create = request_body.data.copy(update={"intent": command_intent})

    try:
        command = protocol_engine.add_command(command_create)

    except pe_errors.SetupCommandNotAllowedError as e:
        raise CommandNotAllowed.from_exc(e).as_error(status.HTTP_409_CONFLICT)
    except pe_errors.RunStoppedError as e:
        raise RunStopped.from_exc(e).as_error(status.HTTP_409_CONFLICT)

    if waitUntilComplete:
        timeout_sec = None if timeout is None else timeout / 1000.0
        with move_on_after(timeout_sec):
            await protocol_engine.wait_for_command(command.id),

    response_data = protocol_engine.state_view.commands.get(command.id)

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=response_data),
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
    runId: str,
    cursor: Optional[int] = Query(
        None,
        description=(
            "The starting index of the desired first command in the list."
            " If unspecified, a cursor will be selected automatically"
            " based on the currently running or most recently executed command."
        ),
    ),
    pageLength: int = Query(
        _DEFAULT_COMMAND_LIST_LENGTH,
        description="The maximum number of commands in the list to return.",
    ),
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[MultiBody[RunCommandSummary, CommandCollectionLinks]]:
    """Get a summary of a set of commands in a run.

    Arguments:
        runId: Requested run ID, from the URL
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items to return.
        run_data_manager: Run data retrieval interface.
    """
    try:
        command_slice = run_data_manager.get_commands_slice(
            run_id=runId,
            cursor=cursor,
            length=pageLength,
        )
    except RunNotFoundError as e:
        raise RunNotFound.from_exc(e).as_error(status.HTTP_404_NOT_FOUND) from e

    current_command = run_data_manager.get_current_command(run_id=runId)

    data = [
        RunCommandSummary.construct(
            id=c.id,
            key=c.key,
            commandType=c.commandType,
            intent=c.intent,
            status=c.status,
            createdAt=c.createdAt,
            startedAt=c.startedAt,
            completedAt=c.completedAt,
            params=c.params,
            error=c.error,
        )
        for c in command_slice.commands
    ]

    meta = MultiBodyMeta(
        cursor=command_slice.cursor,
        totalLength=command_slice.total_length,
    )

    links = CommandCollectionLinks()

    if current_command is not None:
        links.current = CommandLink(
            href=f"/runs/{runId}/commands/{current_command.command_id}",
            meta=CommandLinkMeta(
                runId=runId,
                commandId=current_command.command_id,
                index=current_command.index,
                key=current_command.command_key,
                createdAt=current_command.created_at,
            ),
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
    runId: str,
    commandId: str,
    run_data_manager: RunDataManager = Depends(get_run_data_manager),
) -> PydanticResponse[SimpleBody[pe_commands.Command]]:
    """Get a specific command from a run.

    Arguments:
        runId: Run identifier, pulled from route parameter.
        commandId: Command identifier, pulled from route parameter.
        run_data_manager: Run data retrieval.
    """
    try:
        command = run_data_manager.get_command(run_id=runId, command_id=commandId)
    except RunNotFoundError as e:
        raise RunNotFound.from_exc(e).as_error(status.HTTP_404_NOT_FOUND) from e
    except CommandNotFoundError as e:
        raise CommandNotFound.from_exc(e).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=command),
        status_code=status.HTTP_200_OK,
    )

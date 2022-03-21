"""Router for top-level /commands endpoints."""
from typing import List, Optional, cast
from typing_extensions import Final, Literal

from anyio import move_on_after
from fastapi import APIRouter, Depends, Query, status

from opentrons.protocol_engine.errors import CommandDoesNotExistError

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.runs import EngineStore, EngineConflictError, get_engine_store
from robot_server.service.json_api import (
    MultiBodyMeta,
    RequestModel,
    SimpleBody,
    SimpleMultiBody,
    PydanticResponse,
)

from .stateless_commands import StatelessCommand, StatelessCommandCreate

_DEFAULT_COMMAND_WAIT_MS: Final = 30_000
_DEFAULT_COMMAND_LIST_LENGTH: Final = 20


commands_router = APIRouter()


class RunActive(ErrorDetails):
    """An error returned if there is a run active.

    If there is a run active, you cannot issue stateless commands.
    """

    id: Literal["RunActive"] = "RunActive"
    title: str = "Run Active"
    detail: str = (
        "There is an active run. Close the current run"
        " to issue commands via POST /commands."
    )


class CommandNotFound(ErrorDetails):
    """An error returned if the given command cannot be found."""

    id: Literal["StatelessCommandNotFound"] = "StatelessCommandNotFound"
    title: str = "Stateless Command Not Found"


@commands_router.post(
    path="/commands",
    summary="Add a command to be executed.",
    description=(
        "Run a single command on the robot. This endpoint is meant for"
        " simple, stateless control of the robot. For complex control,"
        " create a run with ``POST /runs`` and issue commands on that run."
    ),
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_201_CREATED: {"model": SimpleBody[StatelessCommand]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunActive]},
    },
)
async def create_command(
    request_body: RequestModel[StatelessCommandCreate],
    waitUntilComplete: bool = Query(
        False,
        description=(
            "If `false`, return immediately, while the new command is still queued."
            " If `true`, only return once the new command succeeds or fails,"
            " or when the timeout is reached. See the `timeout` query parameter."
        ),
    ),
    timeout: int = Query(
        _DEFAULT_COMMAND_WAIT_MS,
        gt=0,
        description=(
            "If `waitUntilComplete` is true, the maximum time in milliseconds to wait,"
            " **starting from when the command is queued**, before returning."
            " If the timeout elapses before the command succeeds or fails,"
            " the command will be returned with its current status."
        ),
    ),
    engine_store: EngineStore = Depends(get_engine_store),
) -> PydanticResponse[SimpleBody[StatelessCommand]]:
    """Enqueue and execute a command.

    Arguments:
        request_body: The request containing the command that the client wants
            to enqueue.
        waitUntilComplete: If True, return only once the command is completed.
            Else, return immediately. Comes from a query parameter in the URL.
        timeout: The maximum time, in seconds, to wait before returning.
            Comes from a query parameter in the URL.
        engine_store: Used to retrieve the `ProtocolEngine` on which the new
            command will be enqueued.
    """
    try:
        engine = await engine_store.get_default_engine()
    except EngineConflictError as e:
        raise RunActive().as_error(status.HTTP_409_CONFLICT) from e

    command = engine.add_command(request_body.data)

    if waitUntilComplete:
        with move_on_after(timeout / 1000.0):
            await engine.wait_for_command(command.id)

    response_data = cast(StatelessCommand, engine.state_view.commands.get(command.id))

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=response_data),
        status_code=status.HTTP_201_CREATED,
    )


@commands_router.get(
    path="/commands",
    summary="Get a list of queued and executed commands",
    description=(
        "Get a list of commands that have been run on the device since boot."
        " Only returns command run via the `/commands` endpoint."
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[StatelessCommand]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunActive]},
    },
)
async def get_commands_list(
    engine_store: EngineStore = Depends(get_engine_store),
    cursor: Optional[int] = Query(
        None,
        description=(
            "The starting index of the desired first command in the list."
            " If unspecicifed, a cursor will be selected automatically"
            " based on the next queued or more recently executed command."
        ),
    ),
    pageLength: int = Query(
        _DEFAULT_COMMAND_LIST_LENGTH,
        description="The maximum number of commands in the list to return.",
    ),
) -> PydanticResponse[SimpleMultiBody[StatelessCommand]]:
    """Get a list of stateless commands.

    Arguments:
        engine_store: Protocol engine and runner storage.
        cursor: Cursor index for the collection response.
        pageLength: Maximum number of items to return.
    """
    try:
        engine = await engine_store.get_default_engine()
    except EngineConflictError as e:
        raise RunActive().as_error(status.HTTP_409_CONFLICT) from e

    cmd_slice = engine.state_view.commands.get_slice(cursor=cursor, length=pageLength)
    commands = cast(List[StatelessCommand], cmd_slice.commands)
    meta = MultiBodyMeta(cursor=cmd_slice.cursor, totalLength=cmd_slice.total_length)

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(data=commands, meta=meta),
        status_code=status.HTTP_200_OK,
    )


@commands_router.get(
    path="/commands/{commandId}",
    summary="Get a single stateless command.",
    description=(
        "Get a single stateless command that has been queued or executed."
        " Only returns command run via the `/commands` endpoint."
    ),
    responses={
        status.HTTP_200_OK: {"model": SimpleBody[StatelessCommand]},
        status.HTTP_404_NOT_FOUND: {"model": ErrorBody[CommandNotFound]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunActive]},
    },
)
async def get_command(
    commandId: str,
    engine_store: EngineStore = Depends(get_engine_store),
) -> PydanticResponse[SimpleBody[StatelessCommand]]:
    """Get a single stateless command.

    Arguments:
        commandId: Command identifier from the URL parameter.
        engine_store: Protocol engine and runner storage.
    """
    try:
        engine = await engine_store.get_default_engine()
        command = engine.state_view.commands.get(commandId)

    except EngineConflictError as e:
        raise RunActive().as_error(status.HTTP_409_CONFLICT) from e

    except CommandDoesNotExistError as e:
        raise CommandNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=cast(StatelessCommand, command)),
        status_code=status.HTTP_200_OK,
    )

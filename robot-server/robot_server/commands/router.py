"""Router for top-level /commands endpoints."""
from anyio import move_on_after
from typing_extensions import Final, Literal

from fastapi import APIRouter, Depends, Query, status

from opentrons.protocol_engine import Command, CommandCreate

from robot_server.errors import ErrorDetails, ErrorBody
from robot_server.runs import EngineStore, EngineConflictError, get_engine_store
from robot_server.service.json_api import RequestModel, SimpleBody, PydanticResponse

_DEFAULT_COMMAND_WAIT_MS: Final = 30_000

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
        status.HTTP_201_CREATED: {"model": SimpleBody[Command]},
        status.HTTP_409_CONFLICT: {"model": ErrorBody[RunActive]},
    },
)
async def create_command(
    request_body: RequestModel[CommandCreate],
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
) -> PydanticResponse[SimpleBody[Command]]:
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

    response_data = engine.state_view.commands.get(command.id)

    return await PydanticResponse.create(
        content=SimpleBody.construct(data=response_data),
        status_code=status.HTTP_201_CREATED,
    )

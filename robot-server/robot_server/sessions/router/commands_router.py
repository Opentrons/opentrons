"""Router for /sessions commands endpoints."""
from fastapi import APIRouter, Depends, status
from typing import Union
from typing_extensions import Literal

from opentrons.protocol_engine import commands as pe_commands, errors as pe_errors

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.json_api import (
    RequestModel,
    ResponseModel,
    MultiResponseModel,
)

from ..run_models import Run, RunCommandSummary
from ..engine_store import EngineStore
from ..dependencies import get_engine_store
from .base_router import RunNotFound, get_run

commands_router = APIRouter()


class CommandNotFound(ErrorDetails):
    """An error if a given session command is not found."""

    id: Literal["CommandNotFound"] = "CommandNotFound"
    title: str = "Session Command Not Found"


# todo(mm, 2021-09-23): Should this accept a list of commands, instead of just one?
@commands_router.post(
    path="/runs/{runId}/commands",
    summary="Enqueue a protocol command",
    description=(
        "Add a single protocol command to the session. "
        "The command is placed at the back of the queue."
    ),
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[pe_commands.Command],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]},
    },
)
async def post_run_command(
    request_body: RequestModel[pe_commands.CommandRequest],
    engine_store: EngineStore = Depends(get_engine_store),
    session: ResponseModel[Run] = Depends(get_run),
) -> ResponseModel[pe_commands.Command]:
    """Enqueue a protocol command.

    Arguments:
        request_body: The request containing the command that the client wants
            to enqueue.
        engine_store: Used to retrieve the `ProtocolEngine` on which the new
            command will be enqueued.
        session: Session response model, provided by the route handler for
            `GET /session/{sessionId}`. Present to ensure 404 if session
            not found.
    """
    command = engine_store.engine.add_command(request_body.data)
    return ResponseModel[pe_commands.Command](data=command)


@commands_router.get(
    path="/runs/{runId}/commands",
    summary="Get a list of all protocol commands in the session",
    description=(
        "Get a list of all commands in the session and their statuses. "
        "This endpoint returns command summaries. Use "
        "`GET /sessions/{sessionId}/commands/{commandId}` to get all "
        "information available for a given command."
    ),
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[RunCommandSummary],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[RunNotFound]},
    },
)
async def get_run_commands(
    session: ResponseModel[Run] = Depends(get_run),
) -> MultiResponseModel[RunCommandSummary]:
    """Get a summary of all commands in a session.

    Arguments:
        session: Session response model, provided by the route handler for
            `GET /session/{sessionId}`
    """
    return MultiResponseModel(data=session.data.commands)


@commands_router.get(
    path="/runs/{runId}/commands/{commandId}",
    summary="Get full details about a specific command in the session",
    description=(
        "Get a command along with any associated payload, result, and "
        "execution information."
    ),
    status_code=status.HTTP_200_OK,
    response_model=ResponseModel[pe_commands.Command],
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": Union[
                ErrorResponse[RunNotFound],
                ErrorResponse[CommandNotFound],
            ]
        },
    },
)
async def get_run_command(
    commandId: str,
    engine_store: EngineStore = Depends(get_engine_store),
    session: ResponseModel[Run] = Depends(get_run),
) -> ResponseModel[pe_commands.Command]:
    """Get a specific command from a session.

    Arguments:
        commandId: Command identifier, pulled from route parameter.
        engine_store: Protocol engine and runner storage.
        session: Session response model, provided by the route handler for
            `GET /session/{sessionId}`. Present to ensure 404 if session
            not found.
    """
    try:
        command = engine_store.engine.state_view.commands.get(commandId)
    except pe_errors.CommandDoesNotExistError as e:
        raise CommandNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND)

    return ResponseModel(data=command)

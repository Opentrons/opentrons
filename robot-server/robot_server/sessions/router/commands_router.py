"""Router for /sessions commands endpoints."""
from fastapi import APIRouter, Depends, status
from typing import Union
from typing_extensions import Literal

from opentrons.protocol_engine import commands as pe_commands, errors as pe_errors

from robot_server.errors import ErrorDetails, ErrorResponse
from robot_server.service.json_api import ResponseModel, MultiResponseModel

from ..session_models import Session, SessionCommandSummary
from ..schema_models import SessionCommandResponse
from ..engine_store import EngineStore
from ..dependencies import get_engine_store
from .base_router import SessionNotFound, get_session

commands_router = APIRouter()


class CommandNotFound(ErrorDetails):
    """An error if a given session command is not found."""

    id: Literal["CommandNotFound"] = "CommandNotFound"
    title: str = "Session Command Not Found"


@commands_router.get(
    path="/sessions/{sessionId}/commands",
    summary="Get a list of all protocol commands in the session",
    description=(
        "Get a list of all commands in the session and their statuses. "
        "This endpoint returns command summaries. Use "
        "`GET /sessions/{sessionId}/commands/{commandId}` to get all "
        "information available for a given command."
    ),
    status_code=status.HTTP_200_OK,
    response_model=MultiResponseModel[SessionCommandSummary],
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse[SessionNotFound]},
    },
)
async def get_session_commands(
    session: ResponseModel[Session] = Depends(get_session),
) -> MultiResponseModel[SessionCommandSummary]:
    """Get a summary of all commands in a session.

    Arguments:
        session: Session response model, provided by the route handler for
            `GET /session/{sessionId}`
    """
    return MultiResponseModel(data=session.data.commands)


@commands_router.get(
    path="/sessions/{sessionId}/commands/{commandId}",
    summary="Get full details about a specific command in the session",
    description=(
        "Get a command along with any associated payload, result, and "
        "execution information."
    ),
    status_code=status.HTTP_200_OK,
    # TODO(mc, 2021-06-23): mypy >= 0.780 broke Unions as `response_model`
    # see https://github.com/tiangolo/fastapi/issues/2279
    response_model=SessionCommandResponse,  # type: ignore[arg-type]
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": Union[
                ErrorResponse[SessionNotFound],
                ErrorResponse[CommandNotFound],
            ]
        },
    },
)
async def get_session_command(
    commandId: str,
    engine_store: EngineStore = Depends(get_engine_store),
    session: ResponseModel[Session] = Depends(get_session),
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

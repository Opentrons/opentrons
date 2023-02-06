import logging

from starlette import status as http_status_codes
from fastapi import APIRouter, Query, Depends

from robot_server.service.session.models.common import IdentifierType
from robot_server.service.dependencies import get_session_manager
from robot_server.service.errors import RobotServerError, CommonErrorDef
from server_utils.service.json_api import ResourceLink
from server_utils.service.json_api.resource_links import ResourceLinkKey, ResourceLinks
from robot_server.service.session.errors import CommandExecutionException
from robot_server.service.session.manager import SessionManager, BaseSession
from robot_server.service.session.models.command import CommandResponse, CommandRequest
from robot_server.service.session.models.session import (
    SessionResponse,
    SessionCreateRequest,
    MultiSessionResponse,
    SessionType,
)
from robot_server.service.session.session_types import SessionMetaData


router = APIRouter()


log = logging.getLogger(__name__)

PATH_SESSION_BY_ID = "/sessions/{sessionId}"


def get_session(manager: SessionManager, session_id: IdentifierType) -> BaseSession:
    """Get the session or raise a RobotServerError"""
    found_session = manager.get_by_id(session_id)
    if not found_session:
        # There is no session raise error
        raise RobotServerError(
            definition=CommonErrorDef.RESOURCE_NOT_FOUND,
            links=get_sessions_links(),
            resource="session",
            id=session_id,
        )
    return found_session


@router.post(
    "/sessions",
    description="Create a session",
    response_model=SessionResponse,
    status_code=http_status_codes.HTTP_201_CREATED,
)
async def create_session_handler(
    create_request: SessionCreateRequest,
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionResponse:
    """Create a session"""
    session_type = create_request.data.sessionType
    create_params = create_request.data.createParams

    new_session = await session_manager.add(
        session_type=session_type,
        session_meta_data=SessionMetaData(create_params=create_params),
    )

    return SessionResponse(
        data=new_session.get_response_model(),
        links=get_valid_session_links(new_session.meta.identifier, router),
    )


@router.delete(
    PATH_SESSION_BY_ID, description="Delete a session", response_model=SessionResponse
)
async def delete_session_handler(
    sessionId: IdentifierType,
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionResponse:
    """Delete a session"""
    session_obj = get_session(manager=session_manager, session_id=sessionId)
    await session_manager.remove(session_obj.meta.identifier)

    return SessionResponse(
        data=session_obj.get_response_model(),
        links=get_sessions_links(),
    )


@router.get(
    PATH_SESSION_BY_ID, description="Get session", response_model=SessionResponse
)
async def get_session_handler(
    sessionId: IdentifierType,
    session_manager: SessionManager = Depends(get_session_manager),
) -> SessionResponse:
    session_obj = get_session(manager=session_manager, session_id=sessionId)

    return SessionResponse(
        data=session_obj.get_response_model(),
        links=get_valid_session_links(sessionId, router),
    )


@router.get(
    "/sessions", description="Get all the sessions", response_model=MultiSessionResponse
)
async def get_sessions_handler(
    session_type: SessionType = Query(
        None, description="Will limit the results to only this session type"
    ),
    session_manager: SessionManager = Depends(get_session_manager),
) -> MultiSessionResponse:
    """Get multiple sessions"""
    sessions = session_manager.get(session_type=session_type)
    return MultiSessionResponse(
        data=[session.get_response_model() for session in sessions],
        links=None,
    )


@router.post(
    f"{PATH_SESSION_BY_ID}/commands/execute",
    description="Create and execute a command immediately",
    response_model=CommandResponse,
)
async def session_command_execute_handler(
    sessionId: IdentifierType,
    command_request: CommandRequest,
    session_manager: SessionManager = Depends(get_session_manager),
) -> CommandResponse:
    """
    Execute a session command
    """
    session_obj = get_session(manager=session_manager, session_id=sessionId)
    if not session_manager.is_active(session_obj.meta.identifier):
        raise CommandExecutionException(
            reason=f"Session '{sessionId}' is not active. "
            "Only the active session can execute commands"
        )

    command_result = await session_obj.execute_command(command_request.data)

    log.debug(f"Command result: {command_result}")

    return CommandResponse(
        data=command_result, links=get_valid_session_links(sessionId, router)
    )


ROOT_RESOURCE = ResourceLink(href=router.url_path_for(get_sessions_handler.__name__))
SESSIONS_BY_ID_RESOURCE = ResourceLink(href=PATH_SESSION_BY_ID)


def get_valid_session_links(
    session_id: IdentifierType, api_router: APIRouter
) -> ResourceLinks:
    """Get the valid links for a session"""
    return {
        ResourceLinkKey.self: ResourceLink(
            href=api_router.url_path_for(
                get_session_handler.__name__, sessionId=session_id
            )
        ),
        ResourceLinkKey.session_command_execute: ResourceLink(
            href=api_router.url_path_for(
                session_command_execute_handler.__name__, sessionId=session_id
            )
        ),
        ResourceLinkKey.sessions: ROOT_RESOURCE,
        ResourceLinkKey.session_by_id: SESSIONS_BY_ID_RESOURCE,
    }


def get_sessions_links() -> ResourceLinks:
    """Get the valid links for the /sessions"""
    return {
        ResourceLinkKey.self: ROOT_RESOURCE,
        ResourceLinkKey.session_by_id: SESSIONS_BY_ID_RESOURCE,
    }

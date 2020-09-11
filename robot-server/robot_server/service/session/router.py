import logging

from starlette import status as http_status_codes
from fastapi import APIRouter, Query, Depends

from robot_server.service.dependencies import get_session_manager
from robot_server.service.errors import RobotServerError, CommonErrorDef
from robot_server.service.json_api import ResourceLink, ResponseDataModel
from robot_server.service.json_api.resource_links import ResourceLinkKey, \
    ResourceLinks
from robot_server.service.session.command_execution import create_command
from robot_server.service.session.errors import CommandExecutionException
from robot_server.service.session.manager import SessionManager, BaseSession
from robot_server.service.session import models as route_models
from robot_server.service.session.session_types import SessionMetaData


router = APIRouter()


log = logging.getLogger(__name__)

PATH_SESSION_BY_ID = "/sessions/{sessionId}"


def get_session(manager: SessionManager,
                session_id: route_models.IdentifierType,
                api_router: APIRouter) -> BaseSession:
    """Get the session or raise a RobotServerError"""
    found_session = manager.get_by_id(session_id)
    if not found_session:
        # There is no session raise error
        raise RobotServerError(
            definition=CommonErrorDef.RESOURCE_NOT_FOUND,
            links=get_sessions_links(api_router),
            resource='session',
            id=session_id
        )
    return found_session


@router.post("/sessions",
             description="Create a session",
             response_model_exclude_unset=True,
             response_model=route_models.SessionResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_session_handler(
        create_request: route_models.SessionCreateRequest,
        session_manager: SessionManager = Depends(get_session_manager)) \
        -> route_models.SessionResponse:
    """Create a session"""
    session_type = create_request.data.attributes.sessionType
    create_params = create_request.data.attributes.createParams

    new_session = await session_manager.add(
        session_type=session_type,
        session_meta_data=SessionMetaData(create_params=create_params))

    return route_models.SessionResponse(
        data=ResponseDataModel.create(
            attributes=new_session.get_response_model(),
            resource_id=new_session.meta.identifier),
        links=get_valid_session_links(new_session.meta.identifier, router)
    )


@router.delete(PATH_SESSION_BY_ID,
               description="Delete a session",
               response_model_exclude_unset=True,
               response_model=route_models.SessionResponse)
async def delete_session_handler(
        sessionId: route_models.IdentifierType,
        session_manager: SessionManager = Depends(get_session_manager)) \
        -> route_models.SessionResponse:
    """Delete a session"""
    session_obj = get_session(manager=session_manager,
                              session_id=sessionId,
                              api_router=router)

    await session_manager.remove(session_obj.meta.identifier)

    return route_models.SessionResponse(
        data=ResponseDataModel.create(
            attributes=session_obj.get_response_model(),
            resource_id=sessionId),
        links=get_sessions_links(router),
    )


@router.get(PATH_SESSION_BY_ID,
            description="Get session",
            response_model_exclude_unset=True,
            response_model=route_models.SessionResponse)
async def get_session_handler(
        sessionId: route_models.IdentifierType,
        session_manager: SessionManager = Depends(get_session_manager))\
        -> route_models.SessionResponse:
    session_obj = get_session(manager=session_manager,
                              session_id=sessionId,
                              api_router=router)

    return route_models.SessionResponse(
        data=ResponseDataModel.create(
            attributes=session_obj.get_response_model(),
            resource_id=sessionId),
        links=get_valid_session_links(sessionId, router)
    )


@router.get("/sessions",
            description="Get all the sessions",
            response_model_exclude_unset=True,
            response_model=route_models.MultiSessionResponse)
async def get_sessions_handler(
        session_type: route_models.SessionType = Query(
            None,
            description="Will limit the results to only this session type"),
        session_manager: SessionManager = Depends(get_session_manager)) \
        -> route_models.MultiSessionResponse:
    """Get multiple sessions"""
    sessions = session_manager.get(session_type=session_type)
    return route_models.MultiSessionResponse(
        data=[ResponseDataModel.create(
            attributes=session.get_response_model(),
            resource_id=session.meta.identifier) for session in sessions
        ]
    )


@router.post(f"{PATH_SESSION_BY_ID}/commands/execute",
             description="Create and execute a command immediately",
             response_model_exclude_unset=True,
             response_model=route_models.CommandResponse)
async def session_command_execute_handler(
        sessionId: route_models.IdentifierType,
        command_request: route_models.CommandRequest,
        session_manager: SessionManager = Depends(get_session_manager),
) -> route_models.CommandResponse:
    """
    Execute a session command
    """
    session_obj = get_session(manager=session_manager,
                              session_id=sessionId,
                              api_router=router)
    if not session_manager.is_active(session_obj.meta.identifier):
        raise CommandExecutionException(
            reason=f"Session '{sessionId}' is not active. "
                   "Only the active session can execute commands")

    command = create_command(command_request.data.attributes.command,
                             command_request.data.attributes.data)
    command_result = await session_obj.command_executor.execute(command)
    log.info(f"Command completed {command}")

    return route_models.CommandResponse(
        data=ResponseDataModel.create(
            attributes=route_models.SessionCommand(
                data=command_result.content.data,
                command=command_result.content.name,
                status=command_result.result.status,
                createdAt=command_result.meta.created_at,
                startedAt=command_result.result.started_at,
                completedAt=command_result.result.completed_at
            ),
            resource_id=command_result.meta.identifier
        ),
        links=get_valid_session_links(sessionId, router)
    )


def get_valid_session_links(session_id: route_models.IdentifierType,
                            api_router: APIRouter) \
        -> ResourceLinks:
    """Get the valid links for a session"""
    return {
        ResourceLinkKey.self: ResourceLink(href=api_router.url_path_for(
            get_session_handler.__name__,
            sessionId=session_id)),
        "commandExecute": ResourceLink(href=api_router.url_path_for(
            session_command_execute_handler.__name__,
            sessionId=session_id)),
        "sessions": ResourceLink(href=api_router.url_path_for(
            get_sessions_handler.__name__)),
        "sessionsById": ResourceLink(href=PATH_SESSION_BY_ID),
    }


def get_sessions_links(api_router: APIRouter) -> ResourceLinks:
    """Get the valid links for the /sessions"""
    return {
        ResourceLinkKey.self:
            ResourceLink(href=api_router.url_path_for(
                get_sessions_handler.__name__)
            ),
        "sessionsById": ResourceLink(href=PATH_SESSION_BY_ID),
    }

import typing
from uuid import uuid4

from starlette import status as http_status_codes
from fastapi import APIRouter, Query, Depends
from opentrons.server.endpoints.calibration.session import \
    (CheckCalibrationSession, SessionManager,
     CalibrationSession, noPipetteException)
from opentrons.server.endpoints.calibration.util import StateMachineError
from opentrons.server.endpoints.calibration import models


from robot_server.service.dependencies import get_session_manager, get_hardware
from robot_server.service.errors import RobotServerError
from robot_server.service.models.json_api.errors import Error
from robot_server.service.models.json_api.resource_links import ResourceLink
from robot_server.service.session.session_status import create_session_details
from robot_server.service.models import session
from robot_server.service.models.session import SessionCreateRequest
from robot_server.service.models.json_api.response import ResponseDataModel

router = APIRouter()


def get_session(manager: SessionManager,
                session_id: str,
                api_router: APIRouter) -> CalibrationSession:
    """Get the session or raise a RobotServerError"""
    found_session = manager.sessions.get(session_id)
    if not found_session:
        # There is no session raise error
        raise RobotServerError(
            status_code=http_status_codes.HTTP_404_NOT_FOUND,
            error=Error(
                title="No session",
                detail=f"Cannot find session with id '{session_id}'.",
                links={
                    "POST": api_router.url_path_for(
                        create_session_handler.__name__)
                }
            )
        )
    return found_session


@router.post("/sessions",
             description="Create a session",
             response_model_exclude_unset=True,
             response_model=session.SessionResponse)
async def create_session_handler(
        create_request: SessionCreateRequest,
        session_manager: SessionManager = Depends(get_session_manager),
        hardware=Depends(get_hardware)) \
        -> session.SessionResponse:
    """Create a session"""
    session_type = create_request.data.attributes.session_type
    # TODO We use type as ID while we only support one session type.
    session_id = session_type.value

    current_session = session_manager.sessions.get(session_id)
    if not current_session:
        try:
            # TODO generalize for other kinds of sessions
            new_session = await CheckCalibrationSession.build(hardware)
        except noPipetteException as e:
            raise RobotServerError(
                status_code=http_status_codes.HTTP_403_FORBIDDEN,
                error=Error(
                    title="No Pipettes Attached",
                    detail=f"Failed to create a session of type "
                           f"'{session_type}': {str(e)}.",
                )
            )
        except AssertionError as e:
            raise RobotServerError(
                status_code=http_status_codes.HTTP_400_BAD_REQUEST,
                error=Error(
                    title="Exception",
                    detail=f"Failed to create session of type "
                           f"'{session_type}': {str(e)}.",
                )
            )
        session_manager.sessions[session_id] = new_session
        return session.SessionResponse(
            data=ResponseDataModel.create(
                attributes=session.Session(
                    session_id=session_id,
                    session_type=session_type,
                    details=create_session_details(new_session)),
                resource_id=session_id),
            links=get_valid_session_links(session_id, router)
        )
    else:
        raise RobotServerError(
            status_code=http_status_codes.HTTP_409_CONFLICT,
            error=Error(
                title="Conflict",
                detail=f"A session with id '{session_id}' already exists. "
                       f"Please delete to proceed.",
                links={
                    "DELETE": router.url_path_for(
                        delete_session_handler.__name__,
                        session_id=session_id)
                }
            )
        )


@router.delete("/sessions/{session_id}",
               description="Delete a session",
               response_model_exclude_unset=True,
               response_model=session.SessionResponse)
async def delete_session_handler(
        session_id: str,
        session_manager: SessionManager = Depends(get_session_manager)) \
        -> session.SessionResponse:
    """Delete a session"""
    session_obj = get_session(manager=session_manager,
                              session_id=session_id,
                              api_router=router)
    # TODO generalize for other session types
    await session_obj.delete_session()  # type: ignore
    del session_manager.sessions[session_id]

    return session.SessionResponse(
        data=ResponseDataModel.create(
            attributes=session.Session(
                session_id=session_id,
                # TODO support other session types
                session_type=models.SessionType.check,
                details=create_session_details(session_obj)),
            resource_id=session_id),
        links={
            "POST": ResourceLink(href=router.url_path_for(
                create_session_handler.__name__)),
        }
    )


@router.get("/sessions/{session_id}",
            description="Get session",
            response_model_exclude_unset=True,
            response_model=session.SessionResponse)
async def get_session_handler(
        session_id: str,
        session_manager: SessionManager = Depends(get_session_manager))\
        -> session.SessionResponse:
    session_obj = get_session(manager=session_manager,
                              session_id=session_id,
                              api_router=router)

    return session.SessionResponse(
        data=ResponseDataModel.create(
            # TODO use a proper session id rather than the type
            attributes=session.Session(
                session_id=session_id,
                session_type=models.SessionType(session_id),
                details=create_session_details(session_obj)),
            resource_id=session_id),
        links=get_valid_session_links(session_id, router)
    )


@router.get("/sessions",
            description="Get all the sessions",
            response_model_exclude_unset=True,
            response_model=session.MultiSessionResponse)
async def get_sessions_handler(
        type_filter: models.SessionType = Query(
            None,
            description="Will limit the results to only this session type"),
        session_manager: SessionManager = Depends(get_session_manager)) \
        -> session.MultiSessionResponse:

    sessions = (
        session.Session(
            session_id=session_id,
            # TODO use a proper session id rather than the type
            session_type=models.SessionType(session_id),
            details=create_session_details(session_obj))
        # TODO type_filter
        for (session_id, session_obj) in session_manager.sessions.items()
    )

    return session.MultiSessionResponse(
        data=[ResponseDataModel.create(
            attributes=session,
            # TODO use a proper session id rather than the type
            resource_id=session.session_type) for session in sessions
        ]
    )


@router.post("/sessions/{session_id}/commands",
             description="Create a command",
             response_model_exclude_unset=True,
             response_model=session.CommandResponse)
async def session_command_create_handler(
        session_id: str,
        command_request: session.CommandRequest,
        session_manager: SessionManager = Depends(get_session_manager),
) -> session.CommandResponse:
    """
    Process a session command
    """
    session_obj = typing.cast(CheckCalibrationSession,
                              get_session(manager=session_manager,
                                          session_id=session_id,
                                          api_router=router))
    command = command_request.data.attributes.command
    command_data = command_request.data.attributes.data
    try:
        await session_obj.trigger_transition(
            trigger=command.value,
            **(command_data.dict() if command_data else {})
        )
    except (AssertionError, StateMachineError) as e:
        raise RobotServerError(
            status_code=http_status_codes.HTTP_400_BAD_REQUEST,
            error=Error(
                title="Exception",
                detail=str(e),
            )
        )

    return session.CommandResponse(
        data=ResponseDataModel.create(
            attributes=session.SessionCommand(data=command_data,
                                              command=command,
                                              status='accepted'),
            # TODO have session create id for command for later querying
            resource_id=str(uuid4())
        ),
        meta=session.Session(details=create_session_details(session_obj),
                             session_id=session_id,
                             # TODO Get type from session
                             session_type=models.SessionType.check),
        links=get_valid_session_links(session_id, router)
    )


def get_valid_session_links(session_id: str, api_router: APIRouter) \
        -> typing.Dict[str, ResourceLink]:
    """Get the valid links for a session"""
    return {
        "GET": ResourceLink(href=api_router.url_path_for(
            get_session_handler.__name__,
            session_id=session_id)),
        "POST": ResourceLink(href=api_router.url_path_for(
            session_command_create_handler.__name__,
            session_id=session_id)),
        "DELETE": ResourceLink(href=api_router.url_path_for(
            delete_session_handler.__name__,
            session_id=session_id)),
    }

import typing
from fastapi import APIRouter, Query
from opentrons.server.endpoints.calibration.models\
    import CalibrationSessionStatus
from robot_server.service.models import session
from robot_server.service.models.json_api.response import json_api_response
from robot_server.service.models.json_api.request import json_api_request


SessionResponse = json_api_response(attributes_model=session.Session,
                                    meta_data_model=CalibrationSessionStatus)
MultiSessionResponse = json_api_response(attributes_model=session.Session,
                                         use_list=True)

CommandRequest = json_api_request(attributes_model=session.SessionCommand)
CommandResponse = json_api_request(attributes_model=session.SessionCommand)


router = APIRouter()


@router.post("/sessions",
             description="Create a session",
             response_model=SessionResponse)
async def create_session() \
        -> SessionResponse:
    """Create a session"""
    pass


@router.delete("/sessions/{session_id}",
               description="Delete a session",
               response_model=SessionResponse)
async def delete_session(session_id: str) -> SessionResponse:
    pass


@router.get("/sessions/{session_id}",
            description="Get session",
            response_model=SessionResponse)
async def get_session(session_id: str) -> SessionResponse:
    pass


@router.get("/sessions",
            description="Get all the sessions",
            response_model=MultiSessionResponse)
async def get_sessions(
        type_filter: session.SessionType = Query(
            None,
            description="Will limit the results to only this session type")) \
        -> MultiSessionResponse:
    pass


@router.post("/sessions/{session_id}/commands",
             description="Create a command",
             response_model=CommandResponse)
async def session_command_create(session_id: str,
                                 command_request: CommandRequest) \
        -> CommandResponse:
    pass

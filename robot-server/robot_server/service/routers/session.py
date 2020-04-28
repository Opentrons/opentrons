from uuid import uuid4

import typing
from fastapi import APIRouter, Query
from robot_server.service.models import session
from robot_server.service.models.json_api.response import ResponseModel, \
    ResponseDataModel

SessionResponseData = ResponseDataModel[session.Session]
SessionResponse = ResponseModel[SessionResponseData]
MultiSessionResponse = ResponseModel[typing.List[SessionResponseData]]

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
        type_filter: session.SessionType = Query(None, description="Will limit the results to only this session type")) \
        -> MultiSessionResponse:
    pass

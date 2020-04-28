from uuid import uuid4

import typing
from fastapi import APIRouter, Path
from pydantic.generics import GenericModel
from robot_server.service.models import session
from robot_server.service.models.json_api import ResourceTypes
from robot_server.service.models.json_api.response import ResponseModel, ResponseDataModel

SessionResponseData = ResponseDataModel[session.Session]
SessionResponse = ResponseModel[ResponseDataModel[session.Session]]
SessionResponse = session.Session

router = APIRouter()


@router.post("/sessions",
             description="Create a session",
             response_model=session.Session)
async def create_session() \
        -> session.Session:
    """Create a session"""
    pass


@router.delete("/sessions/{session_id}",
               description="Delete a session",
               response_model=session.Session)
async def delete_session(session_id: str) -> session.Session:
    pass


@router.get("/sessions/{session_id}",
            description="Get session",
            response_model=session.Session)
async def get_session(session_id: str) -> session.Session:
    pass


@router.get("/sessions",
            description="Get all the sessions",
            response_model=session.Session)
async def get_sessions() -> session.Session:
    pass

"""Router for all /system/connected endpoints."""

from textwrap import dedent
from typing import Annotated

from fastapi import APIRouter, Depends, status

from .models import Connection, GetConnectedResponse
from system_server.connection import AuthorizationTracker
from system_server.persistence import get_authorization_tracker

connected_router = APIRouter()


@connected_router.get(
    "/system/connected",
    deprecated=True,
    summary="Obtain a list of all active authorizations",
    description=dedent("""\
        This was part of an experimental set of endpoints for authorization.
        It's kept for compatibility reasons. Do not use it in new code.
        Use the `/auth` endpoints instead.

        This returns all the active (unexpired) authorizations that were created
        through `/system/authorize`.
        """),
    status_code=status.HTTP_200_OK,
    response_model=GetConnectedResponse,
)
async def get_connected(
    authorization_tracker: Annotated[
        AuthorizationTracker, Depends(get_authorization_tracker)
    ],
) -> GetConnectedResponse:
    """Get connected registrants."""
    connections = authorization_tracker.get_connected()
    return GetConnectedResponse(
        connections=[
            Connection(subject=c.subject, agent=c.agent, agentId=c.agent_id)
            for c in connections
        ]
    )

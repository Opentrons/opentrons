"""Router for all /system/connected endpoints."""
from fastapi import APIRouter, Depends, status

from system_server.connection import AuthorizationTracker
from system_server.persistence import get_authorization_tracker

from .models import GetConnectedResponse, Connection

connected_router = APIRouter()


@connected_router.get(
    "/system/connected",
    summary="Obtain a list of all connected registrants.",
    status_code=status.HTTP_200_OK,
    response_model=GetConnectedResponse,
)
async def get_connected(
    authorization_tracker: AuthorizationTracker = Depends(get_authorization_tracker),
) -> GetConnectedResponse:
    """Get connected registrants."""
    connections = authorization_tracker.get_connected()
    return GetConnectedResponse(
        connections=[
            Connection(subject=c.subject, agent=c.agent, agentId=c.agent_id)
            for c in connections
        ]
    )

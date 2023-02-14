"""Router for all /system/ endpoints."""
from fastapi import APIRouter, Depends
from uuid import UUID

from system_server.persistence import get_sql_engine, get_uuid
from system_server.jwt import Registrant
import sqlalchemy
from .storage import get_or_create_registration_token
from .models import PostRegisterResponse


register_router = APIRouter()


@register_router.post(
    "/system/register",
    summary="Register an agent with this robot.",
    response_model=PostRegisterResponse,
)
async def register_endpoint(
    registrant: Registrant = Depends(Registrant),
    signing_uuid: UUID = Depends(get_uuid),
    engine: sqlalchemy.engine.Engine = Depends(get_sql_engine),
) -> PostRegisterResponse:
    """Router for /system/register endpoint."""
    return PostRegisterResponse(
        token=get_or_create_registration_token(engine, registrant, str(signing_uuid)),
    )

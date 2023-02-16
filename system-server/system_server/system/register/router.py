"""Router for /system/register endpoint."""
from fastapi import APIRouter, Depends, status, Response
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
    status_code=status.HTTP_201_CREATED,
)
async def register_endpoint(
    response: Response,
    registrant: Registrant = Depends(Registrant),
    signing_uuid: UUID = Depends(get_uuid),
    engine: sqlalchemy.engine.Engine = Depends(get_sql_engine),
) -> PostRegisterResponse:
    """Router for /system/register endpoint."""
    token, new_token = get_or_create_registration_token(
        engine, registrant, str(signing_uuid)
    )

    response.status_code = status.HTTP_201_CREATED if new_token else status.HTTP_200_OK
    return PostRegisterResponse(
        token=token,
    )

"""Router for all /system/ endpoints."""
from fastapi import APIRouter, Depends
from datetime import timedelta
import logging
from typing import Dict
from uuid import UUID

from system_server.constants import REGISTRATION_AUDIENCE
from system_server.persistence import get_sql_engine, get_uuid
from system_server.jwt import Registrant, create_jwt, jwt_is_valid
import sqlalchemy
from .storage import (
    get_registration_token,
    add_registration_token,
    delete_registration_token,
)

_log = logging.getLogger(__name__)

# JWT's for registratino should last two years.
_REGISTRATION_DURATION_DAYS = 365 * 2

register_router = APIRouter()


@register_router.post(
    "/system/register",
    summary="Register an agent with this robot.",
)
async def post_register(
    registrant: Registrant = Depends(Registrant),
    signing_uuid: UUID = Depends(get_uuid),
    engine: sqlalchemy.engine.Engine = Depends(get_sql_engine),
) -> Dict[str, str]:
    """Router for /system/register endpoint."""
    token = await get_registration_token(engine, registrant)

    if token is not None:
        if not jwt_is_valid(
            signing_key=str(signing_uuid), token=token, audience=REGISTRATION_AUDIENCE
        ):
            await delete_registration_token(engine, registrant)
            _log.info(f"Deleted token: {token}")
            token = None

    if token is None:
        _log.info(f"Creating new registration for {registrant}")
        token = create_jwt(
            signing_key=str(signing_uuid),
            duration=timedelta(days=_REGISTRATION_DURATION_DAYS),
            registrant=registrant,
            audience=REGISTRATION_AUDIENCE,
        )
        _log.info(f"Created new JWT: {token}")
        await add_registration_token(engine, registrant, token)

    return {"token": token}

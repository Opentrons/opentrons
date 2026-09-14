"""Router for /system/register endpoint."""

from textwrap import dedent
from typing import Annotated
from uuid import UUID

import sqlalchemy
from fastapi import APIRouter, Depends, Response, status

from server_utils.audit.fastapi import skip_audit_logger

from .dependencies import create_registrant
from .models import PostRegisterResponse
from .storage import get_or_create_registration_token
from system_server.jwt import Registrant
from system_server.persistence import get_persistent_uuid, get_sql_engine

register_router = APIRouter()


@register_router.post(
    "/system/register",
    deprecated=True,
    summary="Register a client with this robot",
    description=dedent("""\
        This was part of an experimental set of endpoints for authorization.
        It's kept for compatibility reasons. Do not use it in new code.
        Use the `/auth` endpoints instead.

        This registers a client (basically just storing the information you pass in)
        and returns a registration token that you can pass to `/system/authorize`.
        Identical information is deduplicated, so this is safe to call multiple times.
        """),
    responses={
        status.HTTP_200_OK: {"model": PostRegisterResponse},
        status.HTTP_201_CREATED: {"model": PostRegisterResponse},
    },
    dependencies=[Depends(skip_audit_logger)],
)
async def register_endpoint(
    response: Response,
    registrant: Annotated[Registrant, Depends(create_registrant)],
    signing_uuid: Annotated[UUID, Depends(get_persistent_uuid)],
    engine: Annotated[sqlalchemy.engine.Engine, Depends(get_sql_engine)],
) -> PostRegisterResponse:
    """Router for /system/register endpoint."""
    token, new_token = get_or_create_registration_token(
        engine, registrant, str(signing_uuid)
    )

    response.status_code = status.HTTP_201_CREATED if new_token else status.HTTP_200_OK
    return PostRegisterResponse(
        token=token,
    )

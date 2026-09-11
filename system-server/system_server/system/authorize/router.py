"""Router for all /system/ endpoints."""

from textwrap import dedent
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from server_utils.audit.fastapi import skip_audit_logger

from .authorization import authorize_token
from .models import PostAuthorizeResponse
from system_server.connection import AuthorizationTracker
from system_server.jwt import expiration_from_jwt, registrant_from_jwt
from system_server.persistence import get_authorization_tracker, get_persistent_uuid
from system_server.service.check_jwt_headers import (
    check_authorization_token_header,
    check_registration_token_header,
    get_authorization_token_header,
    get_registration_token_header,
)

authorize_router = APIRouter()


@authorize_router.post(
    "/system/authorize",
    deprecated=True,
    summary="Obtain an authorization token for this session",
    description=dedent("""\
        This was part of an experimental set of endpoints for authorization.
        It's kept for compatibility reasons. Do not use it in new code.
        Use the `/auth` endpoints instead.

        Given a valid registration token from `/system/register`,
        this returns a new authorization token, which is not used for anything.
        It also adds an entry to `/system/connected`.
        """),
    response_model=PostAuthorizeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(check_registration_token_header), Depends(skip_audit_logger)],
)
async def authorize(
    token: Annotated[str, Depends(get_registration_token_header)],
    signing_uuid: Annotated[UUID, Depends(get_persistent_uuid)],
    authorization_tracker: Annotated[
        AuthorizationTracker, Depends(get_authorization_tracker)
    ],
) -> PostAuthorizeResponse:
    """Router for /system/authorize endpoint."""
    key = str(signing_uuid)
    authorization = authorize_token(token, key)
    authorization_tracker.add_connection(
        registrant_from_jwt(authorization, key),
        expiration_from_jwt(authorization, key),
    )
    return PostAuthorizeResponse(token=authorization)


@authorize_router.get(
    "/system/authorize",
    deprecated=True,
    summary="Verify an authorization token",
    dependencies=[Depends(check_authorization_token_header)],
    responses={
        status.HTTP_200_OK: {
            "description": "The authorization token is valid",
            "model": None,
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "the authorization token is not valid for the given scopes",
            "model": None,
        },
    },
)
async def check_authorization(
    token: Annotated[str, Depends(get_authorization_token_header)],
    signing_uuid: Annotated[UUID, Depends(get_persistent_uuid)],
    scopes: Annotated[
        list[str] | None,
        Query(description="List of scopes to verify token access to."),
    ] = None,
) -> Response:
    """Check an authorization token for validity."""
    # NOTE: The `scopes` parameter is included as a placeholder for future validation.
    # In the current implementation of this server, an auth token gives unilateral access
    # to system functionality; thus, there is no scope restraint to be concerned with.

    return Response(status_code=status.HTTP_200_OK)

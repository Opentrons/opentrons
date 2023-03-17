"""Router for all /system/ endpoints."""
from fastapi import APIRouter, Depends, status, Response, Query
from uuid import UUID
from typing import List, Optional

from system_server.persistence import get_persistent_uuid
from system_server.service.check_jwt_headers import (
    check_registration_token_header,
    get_registration_token_header,
    check_authorization_token_header,
    get_authorization_token_header,
)
from .models import PostAuthorizeResponse
from .authorization import authorize_token


authorize_router = APIRouter()


@authorize_router.post(
    "/system/authorize",
    summary="Obtain an authorization token for this session.",
    response_model=PostAuthorizeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(check_registration_token_header)],
)
async def authorize(
    token: str = Depends(get_registration_token_header),
    signing_uuid: UUID = Depends(get_persistent_uuid),
) -> PostAuthorizeResponse:
    """Router for /system/authorize endpoint."""
    authorization = authorize_token(token, str(signing_uuid))
    return PostAuthorizeResponse(token=authorization)


@authorize_router.get(
    "/system/authorize",
    summary="Verify an authorization token.",
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
    token: str = Depends(get_authorization_token_header),
    signing_uuid: UUID = Depends(get_persistent_uuid),
    scopes: Optional[List[str]] = Query(
        None, description="List of scopes to verify token access to."
    ),
) -> Response:
    """Check an authorization token for validity."""
    # NOTE: The `scopes` parameter is included as a placeholder for future validation.
    # In the current implementation of this server, an auth token gives unilateral access
    # to system functionality; thus, there is no scope restraint to be concerned with.

    return Response(status_code=status.HTTP_200_OK)

"""Router for all /system/ endpoints."""
from fastapi import APIRouter, Depends, status
from uuid import UUID

from system_server.persistence import get_persistent_uuid
from system_server.service.check_jwt_headers import (
    check_registration_token_header,
    get_registration_token_header,
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

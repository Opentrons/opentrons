from typing import Annotated

import fastapi

from server_utils.auth.scopes import Scope

from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend

router = fastapi.APIRouter()


@router.post("/auth/users")
async def post_users(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """Create a user."""
    # todo(mm, 2026-02-02): This is currently just a placeholder implementation to
    #  test that we can correctly validate OAuth 2 access tokens.
    scopes_required = [Scope.USERS_WRITE]
    valid, _ = oauth2_backend.verify_request(
        str(request.url),
        http_method=request.method,  # type: ignore[arg-type]
        body=(await request.body()).decode("utf-8"),
        headers=dict(request.headers),
        scopes=[scope.api_name for scope in scopes_required],
    )
    if valid:
        return fastapi.Response(status_code=fastapi.status.HTTP_200_OK)
    else:
        return fastapi.Response(status_code=fastapi.status.HTTP_403_FORBIDDEN)

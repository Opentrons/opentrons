from typing import Annotated

import fastapi

from auth_server.oauth2.backend import Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.users.scopes import Scope

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
        scopes=scopes_required,
    )
    if valid:
        return fastapi.Response(status_code=fastapi.status.HTTP_200_OK)
    else:
        return fastapi.Response(status_code=fastapi.status.HTTP_403_FORBIDDEN)

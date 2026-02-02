import fastapi

from auth_server.oauth2.backend import server
from auth_server.users.scopes import Scope

router = fastapi.APIRouter()


@router.post("/auth/users")
async def post_users(request: fastapi.Request) -> fastapi.Response:
    """Create a user."""
    # todo(mm, 2026-02-02): This is currently just a placeholder implementation to
    #  test that we can correctly validate OAuth 2 access tokens.
    scopes_required = [Scope.USERS_WRITE]
    valid, _ = server.verify_request(
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


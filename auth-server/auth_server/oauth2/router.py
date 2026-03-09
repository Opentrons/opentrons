"""HTTP routes to implement OAuth 2 flows, as an authorization server."""

from typing import Annotated

import fastapi

from .backend import Backend
from .fastapi_dependencies import get_oauth2_backend

router = fastapi.APIRouter(prefix="/auth")


@router.post("/oauth2/token")
async def token_endpoint(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """The OAuth 2 token endpoint, as specified in RFC 6749."""
    form_data = await _get_form_data(request)
    token_response: tuple[dict[str, str], str, int] = (
        oauth2_backend.create_token_response(
            uri=str(request.url),
            http_method=request.method,  # type: ignore[arg-type]
            body=form_data,
            headers=dict(request.headers),
        )
    )
    headers, body, status_code = token_response
    return fastapi.Response(
        headers=headers,
        content=body,
        status_code=status_code,
    )


@router.post("/oauth2/introspect")
async def introspection_endpoint(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """The OAuth 2 token introspection endpoint, as specified in RFC 7662."""
    form_data = await _get_form_data(request)
    headers, body, status_code = oauth2_backend.create_introspect_response(
        uri=str(request.url),
        http_method=request.method,  # type: ignore[arg-type]
        # The type stubs are wrong; `body` can in fact be a `list[tuple[str, str]]`.
        body=form_data,  # type: ignore[arg-type]
        headers=dict(request.headers),
    )
    return fastapi.Response(
        headers=headers,
        content=body,
        status_code=status_code,
    )


async def _get_form_data(request: fastapi.Request) -> list[tuple[str, str]]:
    async with request.form() as form:
        form_data: list[tuple[str, str]] = [
            (key, value)
            for (key, value) in form.multi_items()
            if isinstance(value, str)  # Take only string values, ignore files.
        ]
        return form_data

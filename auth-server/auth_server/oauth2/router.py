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
    return oauth2_backend.create_token_response(
        uri=str(request.url),
        body_form_data=form_data,
        headers=dict(request.headers),
    )


@router.post("/oauth2/introspect")
async def introspection_endpoint(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """The OAuth 2 token introspection endpoint, as specified in RFC 7662."""
    form_data = await _get_form_data(request)
    return oauth2_backend.create_introspect_response(
        uri=str(request.url),
        body_form_data=form_data,
        headers=dict(request.headers),
    )


async def _get_form_data(request: fastapi.Request) -> list[tuple[str, str]]:
    async with request.form() as form:
        form_data: list[tuple[str, str]] = [
            (key, value)
            for (key, value) in form.multi_items()
            if isinstance(value, str)  # Take only string values, ignore files.
        ]
        return form_data

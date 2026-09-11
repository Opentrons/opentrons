"""HTTP routes to implement OAuth 2 flows, as an authorization server."""

from textwrap import dedent
from typing import Annotated

import fastapi

from server_utils.audit.fastapi import skip_audit_logger

from .backend import Backend
from .fastapi_dependencies import get_oauth2_backend

router = fastapi.APIRouter(prefix="/auth")


@router.post(
    "/oauth2/token",
    summary="Request an access token",
    description=dedent("""\
        The OAuth 2 token endpoint, as specified in RFC 6749.

        Omit `scope` to receive the scopes appropriate for the authenticated user
        under current server settings. Those scopes are calculated at use time and
        may change when settings or user state changes. Clients may optionally
        include `scope` to request a subset of those permissions; that ceiling is
        stored on the token and further restricted when settings or user state changes.
        """),
    dependencies=[fastapi.Depends(skip_audit_logger)],
)
async def token_endpoint(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """The OAuth 2 token endpoint, as specified in RFC 6749."""
    form_data = await _get_form_data(request)
    return oauth2_backend.create_token_response(
        body_form_data=form_data,
        headers=dict(request.headers),
    )


@router.post("/oauth2/introspect", dependencies=[fastapi.Depends(skip_audit_logger)])
async def introspection_endpoint(
    request: fastapi.Request,
    oauth2_backend: Annotated[Backend, fastapi.Depends(get_oauth2_backend)],
) -> fastapi.Response:
    """The OAuth 2 token introspection endpoint, as specified in RFC 7662."""
    form_data = await _get_form_data(request)
    return oauth2_backend.create_introspect_response(
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

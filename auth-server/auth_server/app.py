"""The server's ASGI app object."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse

from server_utils import systemd_utils
from server_utils.auth.resource_server.fastapi_dependencies import (
    install_authorization_checker,
)

from auth_server.authorization_checker import build_authorization_checker
from auth_server.oauth2.backend import build as build_oauth2_backend
from auth_server.oauth2.fastapi_dependencies import install_oauth2_backend
from auth_server.oauth2.router import router as oauth2_router
from auth_server.settings.router import router as settings_router
from auth_server.settings.store import SettingsStore, install_settings_store
from auth_server.users.router import router as users_router

_REDOC_CDN_URL = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings_store = SettingsStore()
    install_settings_store(app.state, settings_store)

    oauth2_backend = build_oauth2_backend()
    install_oauth2_backend(app.state, oauth2_backend)

    authorization_checker = build_authorization_checker(settings_store, oauth2_backend)
    install_authorization_checker(app.state, authorization_checker)

    systemd_utils.notify_up()
    yield


app = FastAPI(
    title="Opentrons Auth Server",
    openapi_url="/auth/openapi.json",
    docs_url=None,
    # redoc_url is replaced by our own /redoc router, below.
    redoc_url=None,
    lifespan=_lifespan,
)

app.include_router(oauth2_router)
app.include_router(settings_router)
app.include_router(users_router)


# This is a workaround for a broken /redoc page in versions of FastAPI <0.115.3.
# The page loads Redoc from a CDN, and the problem is that the default CDN URL
# uses a fragile version tag.
# https://github.com/Redocly/redoc/issues/2743
# https://github.com/fastapi/fastapi/pull/9700
@app.get("/auth/redoc", include_in_schema=False)
async def redoc_html() -> HTMLResponse:  # noqa: D103
    if app.openapi_url is None:
        raise RuntimeError(
            "Couldn't get OpenAPI URL from FastAPI."
            + " This is probably some kind of misconfiguration."
        )
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title,
        redoc_js_url=_REDOC_CDN_URL,
    )

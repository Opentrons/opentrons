"""Main FastAPI application."""

from contextlib import AsyncExitStack, asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse

from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    build_authentication_checker,
    handle_authorization_error,
    install_authentication_checker,
)
from server_utils.fastapi_utils.server_timing_middleware import server_timing_middleware

from system_server._version import version
from system_server.router import router
from system_server.settings import get_settings

_REDOC_CDN_URL = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with AsyncExitStack() as exit_stack:
        settings = get_settings()

        authentication_checker = await exit_stack.enter_async_context(
            build_authentication_checker(
                auth_server_uds=settings.auth_server_uds,
                auth_server_url=settings.auth_server_url,
            )
        )
        install_authentication_checker(app.state, authentication_checker)

        # Start serving requests.
        yield


app = FastAPI(
    title="Opentrons System Server HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons System Server."
    ),
    version=version,
    openapi_url="/system/openapi.json",
    docs_url=None,
    # redoc_url is replaced by our own /redoc router, below.
    redoc_url=None,
    lifespan=_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=("*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(server_timing_middleware())

app.exception_handler(AuthorizationError)(handle_authorization_error)

# main router
app.include_router(router=router)


# This is a workaround for a broken /redoc page in versions of FastAPI <0.115.3.
# The page loads Redoc from a CDN, and the problem is that the default CDN URL
# uses a fragile version tag.
# https://github.com/Redocly/redoc/issues/2743
# https://github.com/fastapi/fastapi/pull/9700
@app.get("/system/redoc", include_in_schema=False)
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

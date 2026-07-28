"""The server's ASGI app object."""

from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional
import asyncio
import logging

from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse

from server_utils import systemd_utils
from server_utils.audit.fastapi import (
    audit_logger_middleware,
    build_audit_client,
    install_audit_client,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    handle_authorization_error,
    install_authentication_checker,
)
from server_utils.audit.audit_server import (
    Client as AuditClient,
    SubmitAuditLogMessageData,
)

from auth_server.api_error import APIError, handle_api_error
from auth_server.authentication_checker import build_authentication_checker
from auth_server.oauth2.backend import Backend as OAuth2Backend
from auth_server.oauth2.fastapi_dependencies import (
    install_oauth2_backend,
)
from auth_server.oauth2.router import router as oauth2_router
from auth_server.persistence.database import sql_engine_ctx
from auth_server.persistence.fastapi_dependencies import (
    set_persistence_directory,
    set_sql_engine,
)
from auth_server.persistence.file_and_directory_names import DB_FILE
from auth_server.persistence.persistence_directory import (
    prepare_active_subdirectory,
    prepare_root,
)
from auth_server.server_settings import AuthServerSettings, get_settings
from auth_server.settings.router import router as settings_router
from auth_server.settings.store import SettingsStore, install_settings_store
from auth_server.users.router import router as users_router
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import UserDataManager

_REDOC_CDN_URL = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"
_AUTH_SERVER_AUDIT_SYSTEM_NAME = "system"
_AUTH_SERVER_AUDIT_SYSTEM_FULLNAME = "authentication subsystem"
_LOG = logging.getLogger(__name__)


def _get_persistence_directory_root(settings: AuthServerSettings) -> Optional[Path]:
    """Return the root persistence directory."""
    if settings.persistence_directory == "automatically_make_temporary":
        return None
    return settings.persistence_directory


async def _do_oauth_audit_log(
    audit_client: AuditClient, action: str, message: str
) -> None:
    try:
        await audit_client.submit_log_message(
            SubmitAuditLogMessageData(
                action=action,
                message=message,
                accountName=_AUTH_SERVER_AUDIT_SYSTEM_NAME,
                legalName=_AUTH_SERVER_AUDIT_SYSTEM_FULLNAME,
                reason=None,
            )
        )
        _LOG.info(f"{action}: {message}")
    except BaseException:
        _LOG.exception("audit log for login failed")


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    persistence_directory_root = _get_persistence_directory_root(settings)
    prepared_root = await prepare_root(persistence_directory_root)
    set_persistence_directory(app.state, prepared_root)

    active_subdirectory = await prepare_active_subdirectory(prepared_root)
    db_path = active_subdirectory / DB_FILE

    async with AsyncExitStack() as exit_stack:
        engine = exit_stack.enter_context(sql_engine_ctx(db_path))
        set_sql_engine(app.state, engine)
        audit_client = await exit_stack.enter_async_context(
            build_audit_client(
                audit_server_uds=settings.audit_server_uds,
                audit_server_url=settings.audit_server_url,
            )
        )
        install_audit_client(app.state, audit_client)

        user_store = UserStore(sql_engine=engine)
        settings_store = SettingsStore(sql_engine=engine)
        oauth2_backend = OAuth2Backend(
            user_store,
            settings_store,
            lambda action, message: asyncio.create_task(
                _do_oauth_audit_log(audit_client, action, message)
            ),
        )
        install_oauth2_backend(app.state, oauth2_backend)
        user_service = UserDataManager(
            user_store=user_store, settings_store=settings_store
        )
        user_service.seed_initial_users()
        install_settings_store(app.state, settings_store)
        authentication_checker = build_authentication_checker(
            settings_store, oauth2_backend
        )
        install_authentication_checker(app.state, authentication_checker)
        systemd_utils.notify_up()
        yield


_OAUTH_2_TAG = {
    "name": "OAuth 2",
    "description": "Flows for user authentication, following the OAuth 2 standard.",
}
_AUTH_SETTINGS_TAG = {
    "name": "Auth settings",
    "description": "Settings related to authentication and authorization.",
}
_USERS_TAG = {"name": "Users", "description": "Endpoints for managing users."}
_TAGS = [_OAUTH_2_TAG, _AUTH_SETTINGS_TAG, _USERS_TAG]


app = FastAPI(
    title="Opentrons Auth Server",
    openapi_url="/auth/openapi.json",
    docs_url=None,
    # redoc_url is replaced by our own /redoc router, below.
    redoc_url=None,
    lifespan=_lifespan,
    openapi_tags=_TAGS,
)

app.middleware("http")(audit_logger_middleware)

app.exception_handler(APIError)(handle_api_error)
app.exception_handler(AuthorizationError)(handle_authorization_error)


app.include_router(oauth2_router, tags=[_OAUTH_2_TAG["name"]])
app.include_router(settings_router, tags=[_AUTH_SETTINGS_TAG["name"]])
app.include_router(users_router, tags=[_USERS_TAG["name"]])


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

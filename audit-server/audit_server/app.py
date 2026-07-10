"""The server's ASGI app object."""

import logging
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional, override

from fastapi import FastAPI, Request, Response
from opentrons_shared_data.errors.exceptions import AuditLoggingError

from server_utils import systemd_utils
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    build_authorization_checker,
    handle_authorization_error,
    install_authorization_checker,
)
from server_utils.keys.fastapi import build_key_client, install_key_client
from server_utils.keys.key_server import Client as KeyClientABC
from server_utils.keys.key_server import SignedMessageData, SignMessageData

from audit_server.log_export.router import router as log_export_router
from audit_server.log_ingest.router import router as ingest_router
from audit_server.log_storage.dependency import build_log_data_manager, build_log_store
from audit_server.persistence.database import sql_engine_ctx
from audit_server.persistence.fastapi_dependencies import (
    set_persistence_directory,
    set_sql_engine,
)
from audit_server.persistence.file_and_directory_names import DB_FILE
from audit_server.persistence.persistence_directory import (
    prepare_active_subdirectory,
    prepare_root,
)
from audit_server.server_configuration import (
    AuditServerConfiguration,
    get_configuration,
)
from audit_server.settings.router import router as settings_router
from audit_server.settings.store import SettingsStore, install_settings_store

_log = logging.getLogger(__name__)


def _get_persistence_directory_root(
    configuration: AuditServerConfiguration,
) -> Optional[Path]:
    """Return the root persistence directory, or ``None`` for auto-temp."""
    if configuration.persistence_directory == "automatically_make_temporary":
        return None
    return configuration.persistence_directory


class _NoOpFailKeyClient(KeyClientABC):
    """A local key client for when the server is unconfigured that fails to sign."""

    @override
    async def sign_message(self, message: SignMessageData) -> SignedMessageData:
        raise AuditLoggingError(message="Key server unavailable (not configured)")


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configuration = get_configuration()
    persistence_directory_root = _get_persistence_directory_root(configuration)
    prepared_root = await prepare_root(persistence_directory_root)
    set_persistence_directory(app.state, prepared_root)

    active_subdirectory = await prepare_active_subdirectory(prepared_root)
    db_path = active_subdirectory / DB_FILE

    async with AsyncExitStack() as exit_stack:
        engine = exit_stack.enter_context(sql_engine_ctx(db_path))
        set_sql_engine(app.state, engine)
        settings_store = SettingsStore(sql_engine=engine)
        install_settings_store(app.state, settings_store)

        if (
            configuration.key_server_uds is not None
            or configuration.key_server_url is not None
        ):
            key_client = await exit_stack.enter_async_context(
                build_key_client(
                    key_server_uds=configuration.key_server_uds,
                    key_server_url=configuration.key_server_url,
                )
            )
        else:
            _log.warning(
                "key-server is not configured."
                " Log ingest will will fail."
                " Set OT_AUDIT_SERVER_key_server_uds or OT_AUDIT_SERVER_key_server_url"
                " to enable logging."
            )
            key_client = _NoOpFailKeyClient()
        install_key_client(app.state, key_client)
        log_store = build_log_store(app.state, engine)
        log_data_manager = build_log_data_manager(
            app.state, log_store, settings_store, key_client
        )
        authorization_checker = await exit_stack.enter_async_context(
            build_authorization_checker(
                auth_server_uds=configuration.auth_server_uds,
                auth_server_url=configuration.auth_server_url,
            )
        )
        install_authorization_checker(app.state, authorization_checker)
        await log_data_manager.rotate_periods()
        systemd_utils.notify_up()
        yield


async def _handle_auth_error_async(
    request: Request, error: AuthorizationError
) -> Response:
    return handle_authorization_error(request, error)


app = FastAPI(
    title="Opentrons Audit Server",
    openapi_url=None,
    docs_url=None,
    redoc_url=None,
    lifespan=_lifespan,
    exception_handlers={AuthorizationError: _handle_auth_error_async},
)

app.include_router(ingest_router)
app.include_router(log_export_router)
app.include_router(settings_router)

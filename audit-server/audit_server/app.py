"""The server's ASGI app object."""

import logging
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional

from fastapi import FastAPI

from server_utils import systemd_utils
from server_utils.keys.fastapi import build_key_client, install_key_client

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
            install_key_client(app.state, key_client)
        else:
            _log.warning(
                "key-server is not configured."
                " Log ingest will will fail."
                " Set OT_AUDIT_SERVER_key_server_uds or OT_AUDIT_SERVER_key_server_url"
                " to enable logging."
            )
        log_store = build_log_store(app.state, engine)
        log_data_manager = build_log_data_manager(
            app.state, log_store, settings_store, key_client
        )
        await log_data_manager.rotate_periods()
        systemd_utils.notify_up()
        yield


app = FastAPI(
    title="Opentrons Audit Server",
    openapi_url=None,
    docs_url=None,
    redoc_url=None,
    lifespan=_lifespan,
)

app.include_router(ingest_router)
app.include_router(log_export_router)
app.include_router(settings_router)

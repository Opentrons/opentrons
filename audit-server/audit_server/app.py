"""The server's ASGI app object."""

from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional

from fastapi import FastAPI

from server_utils import systemd_utils

from audit_server.log_ingest.router import router as ingest_router
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
from audit_server.server_settings import AuditServerSettings, get_settings


def _get_persistence_directory_root(settings: AuditServerSettings) -> Optional[Path]:
    """Return the root persistence directory, or ``None`` for auto-temp."""
    if settings.persistence_directory == "automatically_make_temporary":
        return None
    return settings.persistence_directory


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

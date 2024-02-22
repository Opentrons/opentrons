"""Support for persisting data across device reboots."""


from ._database import create_sql_engine, sql_engine_ctx, sqlite_rowid
from ._fastapi_dependencies import (
    start_initializing_persistence,
    clean_up_persistence,
    get_sql_engine,
    get_active_persistence_directory,
    get_active_persistence_directory_failsafe,
    get_persistence_resetter,
)
from ._persistence_directory import PersistenceResetter
from ._tables import (
    metadata,
    protocol_table,
    analysis_table,
    run_table,
    run_command_table,
    action_table,
)


__all__ = [
    # database utilities and helpers
    "create_sql_engine",
    "sql_engine_ctx",
    "sqlite_rowid",
    # database tables
    "metadata",
    "protocol_table",
    "analysis_table",
    "run_table",
    "run_command_table",
    "action_table",
    # initialization and teardown
    "start_initializing_persistence",
    "clean_up_persistence",
    # dependencies and types for use by FastAPI endpoint functions
    "get_sql_engine",
    "get_active_persistence_directory",
    "get_active_persistence_directory_failsafe",
    "PersistenceResetter",
    "get_persistence_resetter",
]

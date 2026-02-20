"""Persistence layer – database engine, schema, and ORM tables."""

from auth_server.persistence.database import (
    Base,
    create_schema,
    create_sql_engine,
    sql_engine_ctx,
)
from auth_server.persistence.fastapi_dependencies import (
    get_persistence_directory,
    get_persistence_resetter,
    get_sql_engine,
    set_persistence_directory,
    set_sql_engine,
)
from auth_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
)
from auth_server.persistence.persistence_directory import (
    PersistenceResetter,
    prepare_active_subdirectory,
    prepare_root,
)
from auth_server.persistence.tables import (
    AccountType,
    ScopeListType,
    User,
)

__all__ = [
    "AccountType",
    "Base",
    "DB_FILE",
    "LATEST_VERSION_DIRECTORY",
    "PersistenceResetter",
    "ScopeListType",
    "User",
    "create_schema",
    "create_sql_engine",
    "get_persistence_directory",
    "get_persistence_resetter",
    "get_sql_engine",
    "prepare_active_subdirectory",
    "prepare_root",
    "set_persistence_directory",
    "set_sql_engine",
    "sql_engine_ctx",
]

"""Persistence layer – database engine, schema, and ORM tables."""

from auth_server.persistence.database import (
    Base,
    create_schema,
    create_sql_engine,
    sql_engine_ctx,
)
from auth_server.persistence.fastapi_dependencies import (
    get_sql_engine,
    set_sql_engine,
)
from auth_server.persistence.tables import (
    AccountType,
    ScopeListType,
    User,
)

__all__ = [
    "AccountType",
    "Base",
    "ScopeListType",
    "User",
    "create_schema",
    "create_sql_engine",
    "get_sql_engine",
    "set_sql_engine",
    "sql_engine_ctx",
]

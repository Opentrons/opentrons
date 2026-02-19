"""Functions to use as FastAPI dependencies for the persistence layer."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

_sql_engine_accessor = AppStateAccessor[SQLEngine]("sql_engine")


def set_sql_engine(app_state: AppState, sql_engine: SQLEngine) -> None:
    """Store the SQL engine on the app state for later retrieval.

    This should be called once at server startup.
    """
    _sql_engine_accessor.set_on(app_state, sql_engine)


async def get_sql_engine(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> SQLEngine:
    """Return the server's singleton SQLAlchemy Engine."""
    sql_engine = _sql_engine_accessor.get_from(app_state)
    assert sql_engine is not None, (
        "Forgot to initialize SQL engine as part of server startup?"
    )
    return sql_engine

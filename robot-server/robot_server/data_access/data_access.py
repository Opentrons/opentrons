import sqlalchemy
from sqlalchemy.engine import Engine as SQLEngine
from typing import Any, Dict
from fastapi import Depends
from ..app_state import AppState, AppStateValue, get_app_state
from .models import metadata
from robot_server.db import create_in_memory_db_no_cleanup

_sql_engine = AppStateValue[SQLEngine]("sql_engine")


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back a `ProtocolStore`.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    metadata.create_all(sql_engine)


def get_sql_engine(app_state: AppState = Depends(get_app_state)) -> SQLEngine:
    sql_engine = _sql_engine.get_from(app_state)

    if sql_engine is None:
        # It's important that create_in_memory_db_no_cleanup() returns
        # a SQLEngine that's explicitly okay to pass between threads.
        # FastAPI dependency may run this dependency function in a separate thread
        # from the request handlers using this SQLEngine.
        sql_engine = create_in_memory_db_no_cleanup()

        add_tables_to_db(sql_engine)

        _sql_engine.set_on(app_state, sql_engine)

    return sql_engine
    # Rely on connections being cleaned up automatically when the process dies.
    # FastAPI doesn't give us a convenient way to properly tie
    # the lifetime of a dependency to the lifetime of the server app.
    # https://github.com/tiangolo/fastapi/issues/617


#TODO tz: change retured type to generics or Row type
def get(self, statement: sqlalchemy.sql.Select) -> Any: #sqlalchemy.engine.Row:
    with self._sql_engine.begin() as transaction:
        try:
            row_run = transaction.execute(statement).one()
        except sqlalchemy.exc.NoResultFound as e:
            raise sqlalchemy.exc.NoResultFound
    return row_run


#TODO tz: change retured type to generics or Row type
def get_all(self, query_table: sqlalchemy.Table) -> Any: #Dict[str, object]:
    """Get all known run resources.

    Returns:
    All stored run entries.
    """
    statement = sqlalchemy.select(query_table)
    with self._sql_engine.begin() as transaction:
        all_rows = transaction.execute(statement).all()
    return all_rows

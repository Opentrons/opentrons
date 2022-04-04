"""Runs' in-memory store."""
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Dict, List, Optional

from .action_models import RunAction

import sqlalchemy


@dataclass(frozen=True)
class RunResource:
    """An entry in the run store, used to construct response models.

    This represents all run state that cannot be derived from another
    location, such as a ProtocolEngine instance.
    """

    run_id: str
    protocol_id: Optional[str]
    created_at: datetime
    actions: List[RunAction]
    is_current: bool


class RunNotFoundError(ValueError):
    """Error raised when a given Run ID is not found in the store."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Run {run_id} was not found.")


class RunStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore and its in-memory storage."""
        self._sql_engine = sql_engine

    def insert(self, run: RunResource) -> RunResource:
        """Insert or update a run resource in the store.

        Arguments:
            run: Run resource to store. Reads `run.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """
        statement = sqlalchemy.insert(_run_table).values(
            _convert_run_to_sql_values(run=run)
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

        if run.is_current is True:
            update_statement = sqlalchemy.update(_run_table).where(id != run.id).values(active_run=False)
            transaction.execute(update_statement)

        return run

    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Arguments:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry from the store.
        """
        try:
            return self._runs_by_id[run_id]
        except KeyError as e:
            raise RunNotFoundError(run_id) from e

    def get_all(self) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        return list(self._runs_by_id.values())

    def remove(self, run_id: str) -> RunResource:
        """Remove a run by its unique identifier.

        Arguments:
            run_id: The run's unique identifier.

        Returns:
            The run entry that was deleted.

        Raises:
            RunNotFoundError: The specified run ID was not found.
        """
        try:
            return self._runs_by_id.pop(run_id)
        except KeyError as e:
            raise RunNotFoundError(run_id) from e


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back a `ProtocolStore`.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    _metadata.create_all(sql_engine)


_metadata = sqlalchemy.MetaData()
_run_table = sqlalchemy.Table(
    "protocol_run",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "protocol_id",
        sqlalchemy.String,
        forigen_key="protocol.id",
        nullable=True
    ),
    sqlalchemy.Column(
        "active_run",
        sqlalchemy.Boolean,
        nullable=False,
        default=False
    )
)


def _convert_sql_row_to_resource(sql_row: sqlalchemy.engine.Row) -> RunResource:
    run_id = sql_row.id
    assert isinstance(run_id, str)

    created_at = sql_row.created_at
    assert isinstance(created_at, datetime)

    protocol_id = sql_row.protocol_id
    # key is optional in DB. If its not None assert type as string
    if protocol_id is not None:
        assert isinstance(protocol_id, str)

    is_current = sql_row.active_run
    assert isinstance(is_current, bool)

    return RunResource(
        run_id=run_id, created_at=created_at, protocol_id=protocol_id, is_current=is_current
    )


def _convert_run_to_sql_values(run: RunResource) -> Dict[str, object]:
    return {
        "id": run.run_id,
        "created_at": run.created_at,
        "protocol_id": run.protocol_id,
        "active_run": run.is_current
    }

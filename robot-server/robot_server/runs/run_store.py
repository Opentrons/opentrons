"""Runs' in-memory store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
import sqlalchemy

from .action_models import RunAction, RunActionType

from robot_server.persistence import run_table, action_table
from robot_server.protocols import ProtocolNotFoundError


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
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine
        self._active_run: Optional[str] = None

    def insert_action(self, run_id: str, action: RunAction) -> None:
        """Insert run action in the db.

        Arguments:
            run_id: current run id to get
            action: action to insert into the db
        """
        with self._sql_engine.begin() as transaction:
            try:
                _insert_action_no_transaction(run_id, action, transaction)
            except sqlalchemy.exc.IntegrityError:
                raise RunNotFoundError(run_id=run_id)

    def update_active_run(self, run_id: str, is_current: bool) -> RunResource:
        """Update current active run resource in memory.

        Arguments:
            run_id: run to update
            is_current: is run active or not

        Returns:
            The resource that was updated.
        """
        # TODO (tz 4-13-22): Check if run exists before setting the current run.
        if is_current is True:
            self._active_run = run_id
        elif is_current is False and self._active_run == run_id:
            self._active_run = None
        return self.get(run_id)

    def insert(self, run: RunResource) -> RunResource:
        """Insert run resource in the db.

        Arguments:
            run: Run resource to store.

        Returns:
            The resource that was added to the store.
        """
        statement = sqlalchemy.insert(run_table).values(
            _convert_run_to_sql_values(run=run)
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.IntegrityError:
                assert (
                    run.protocol_id is not None
                ), "Insert run failed due to unexpected IntegrityError"
                raise ProtocolNotFoundError(protocol_id=run.protocol_id)

        self.update_active_run(run_id=run.run_id, is_current=run.is_current)

        return run

    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Arguments:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry from the db.
        """
        statement = sqlalchemy.select(run_table).where(run_table.c.id == run_id)
        with self._sql_engine.begin() as transaction:
            try:
                row_run = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise RunNotFoundError(run_id) from e

            actions = _get_actions_no_transaction(run_id, transaction)
            run = _convert_sql_row_to_run(
                row_run,
                [_convert_sql_row_to_action(action) for action in actions],
                self._active_run,
            )
        return run

    def get_all(self) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        statement = sqlalchemy.select(run_table)
        with self._sql_engine.begin() as transaction:
            runs = transaction.execute(statement).all()
            return [
                _convert_sql_row_to_run(
                    sql_row=row,
                    actions=[
                        _convert_sql_row_to_action(sql_row=row)
                        for row in _get_actions_no_transaction(row.id, transaction)
                    ],
                    current_run_id=self._active_run,
                )
                for row in runs
            ]

    def remove(self, run_id: str) -> RunResource:
        """Remove a run by its unique identifier.

        Arguments:
            run_id: The run's unique identifier.

        Returns:
            The run entry that was deleted.

        Raises:
            RunNotFoundError: The specified run ID was not found.
        """
        select_run_statement = sqlalchemy.select(run_table).where(
            run_table.c.id == run_id
        )
        select_action_statement = sqlalchemy.select(action_table).where(
            action_table.c.run_id == run_id
        )
        delete_run_statement = sqlalchemy.delete(run_table).where(
            run_table.c.id == run_id
        )
        delete_actions_statement = sqlalchemy.delete(action_table).where(
            action_table.c.run_id == run_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                # SQLite <3.35.0 doesn't support the RETURNING clause,
                # so we do it ourselves with a separate SELECT.
                row_to_delete = transaction.execute(select_run_statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise RunNotFoundError(run_id) from e
            actions = transaction.execute(select_action_statement).all()
            transaction.execute(delete_actions_statement)
            transaction.execute(delete_run_statement)
        return _convert_sql_row_to_run(
            row_to_delete,
            [_convert_sql_row_to_action(action) for action in actions],
            self._active_run,
        )


def _get_actions_no_transaction(
    run_id: str, transaction: sqlalchemy.engine.Connection
) -> List[sqlalchemy.engine.Row]:
    statement = action_table.select().where(action_table.c.run_id == run_id)
    return transaction.execute(statement).all()


def _insert_action_no_transaction(
    run_id: str, action: RunAction, transaction: sqlalchemy.engine.Connection
) -> None:
    transaction.execute(
        sqlalchemy.insert(action_table),
        _convert_action_to_sql_values(run_id=run_id, action=action),
    )


def _convert_sql_row_to_run(
    sql_row: sqlalchemy.engine.Row,
    actions: List[RunAction],
    current_run_id: Optional[str],
) -> RunResource:
    run_id = sql_row.id
    assert isinstance(run_id, str)

    created_at = sql_row.created_at
    assert isinstance(created_at, datetime)

    protocol_id = sql_row.protocol_id
    # key is optional in DB. If its not None assert type as string
    if protocol_id is not None:
        assert isinstance(protocol_id, str)

    is_current = current_run_id == run_id

    return RunResource(
        run_id=run_id,
        created_at=created_at,
        actions=actions,
        protocol_id=protocol_id,
        is_current=is_current,
    )


def _convert_run_to_sql_values(run: RunResource) -> Dict[str, object]:
    return {
        "id": run.run_id,
        "created_at": run.created_at,
        "protocol_id": run.protocol_id,
    }


def _convert_sql_row_to_action(sql_row: sqlalchemy.engine.Row) -> RunAction:
    action_id = sql_row.id
    assert isinstance(action_id, str)

    created_at = sql_row.created_at
    assert isinstance(created_at, datetime)

    action_type = sql_row.action_type
    assert isinstance(action_type, str)

    return RunAction(
        id=action_id, createdAt=created_at, actionType=RunActionType(action_type)
    )


def _convert_action_to_sql_values(action: RunAction, run_id: str) -> Dict[str, object]:
    return {
        "id": action.id,
        "created_at": action.createdAt,
        "action_type": action.actionType.value,
        "run_id": run_id,
    }

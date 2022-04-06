"""Runs' in-memory store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from .action_models import RunAction, RunActionType

import sqlalchemy
from ..data_access.models import run_table, action_runs_table
from ..data_access.data_access import get_all, get as get_row


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

    def insert_actions(self, run_id: str, actions: List[RunAction]) -> None:
        """Insert or update a run actions resource in the db.

        Arguments:
            run_id: current run id to get
            actions: a list of actions to store in the db
        """
        insert_actions = []
        for action in actions:
            insert_actions.append(_convert_action_to_sql_values(action, run_id))
        print(insert_actions)
        statement = sqlalchemy.insert(run_table).values(
            insert_actions
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.NoResultFound as e:
                raise e

    def update_active_runs(self, run_id: str) -> None:
        with self._sql_engine.begin() as transaction:
            try:
                update_statement = sqlalchemy.update(run_table).where(run_table.c.id != run_id,
                                                                      run_table.c.active_run == True).values(
                    active_run=False)
                transaction.execute(update_statement)
            except sqlalchemy.exc.NoResultFound as e:
                raise e

    def insert(self, run: RunResource) -> RunResource:
        """Insert run resource in the db.

        Arguments:
            run: Run resource to store. Reads `run.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """

        statement = sqlalchemy.insert(run_table).values(
            _convert_run_to_sql_values(run=run)
        )
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(statement)
            except sqlalchemy.exc.NoResultFound as e:
                print(e)
                raise RunNotFoundError(run.run_id) from e

        if run.is_current is True:
            self.update_active_runs(run.run_id)

        if run.actions:
            self.insert_actions(run_id=run.run_id, actions=run.actions)
        return run

    def update(self, run: RunResource) -> RunResource:
        """Insert or update a run resource in the store.

        Arguments:
            run: Run resource to store. Reads `run.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """

        update_statement = sqlalchemy.update(run_table).where(run_table.c.id == run.run_id).values(
            active_run=run.is_current)
        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(update_statement)
            except sqlalchemy.exc.NoResultFound:
                statement = sqlalchemy.insert(run_table).values(
                    _convert_run_to_sql_values(run=run)
                )
                with self._sql_engine.begin() as insert_transaction:
                    insert_transaction.execute(statement)

        if run.is_current is True:
            self.update_active_runs(run.run_id)

        self.upsert_actions(run_id=run.run_id, actions=run.actions)
        return run

    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Arguments:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry from the db.
        """
        statement = sqlalchemy.select(run_table).join(action_runs_table, action_runs_table.c.run_id == run_table.c.id,
                                                      isouter=True).where(
            run_table.c.id == run_id
        )
        try:
            row_run = get_row(self._sql_engine, statement=statement)
            print(row_run)
            run = _convert_sql_row_to_run(row_run)
            for action in row_run:
                run.actions.append(_convert_sql_row_to_action(action))
        except sqlalchemy.exc.NoResultFound as e:
            raise RunNotFoundError(run_id) from e
        return run

    def get_all(self) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        runs = get_all(self._sql_engine, query_table=run_table)
        return [_convert_sql_row_to_run(sql_row=row) for row in runs]

    def remove(self, run_id: str) -> RunResource:
        """Remove a run by its unique identifier.

        Arguments:
            run_id: The run's unique identifier.

        Returns:
            The run entry that was deleted.

        Raises:
            RunNotFoundError: The specified run ID was not found.
        """
        select_statement = sqlalchemy.select(run_table).where(
            run_table.c.id == run_id
        )
        delete_statement = sqlalchemy.delete(run_table).where(
            run_table.c.id == run_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                # SQLite <3.35.0 doesn't support the RETURNING clause,
                # so we do it ourselves with a separate SELECT.
                row_to_delete = transaction.execute(select_statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise RunNotFoundError(run_id) from e
            transaction.execute(delete_statement)

        return _convert_sql_row_to_run(row_to_delete)


def _convert_sql_row_to_run(sql_row: sqlalchemy.engine.Row) -> RunResource:
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
        run_id=run_id, created_at=created_at, actions=[],protocol_id=protocol_id, is_current=is_current
    )


def _convert_run_to_sql_values(run: RunResource) -> Dict[str, object]:
    return {
        "id": run.run_id,
        "created_at": run.created_at,
        "protocol_id": run.protocol_id,
        "active_run": run.is_current
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
        "action_type": action.actionType,
        "run_id": run_id
    }

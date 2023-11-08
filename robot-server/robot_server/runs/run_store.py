"""Runs' on-db store."""
import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Optional, cast

import sqlalchemy
from pydantic import parse_obj_as, ValidationError

from opentrons.util.helpers import utc_now
from opentrons.protocol_engine import StateSummary, CommandSlice
from opentrons.protocol_engine.commands import Command

from robot_server.persistence import run_table, action_table, sqlite_rowid
from robot_server.protocols import ProtocolNotFoundError

from .action_models import RunAction, RunActionType
from .run_models import RunNotFoundError

log = logging.getLogger(__name__)

_CACHE_ENTRIES = 32


@dataclass(frozen=True)
class RunResource:
    """An entry in the run store, used to construct response models.

    This represents all run data that cannot be derived from another
    location, such as a ProtocolEngine instance.
    """

    run_id: str
    protocol_id: Optional[str]
    created_at: datetime
    actions: List[RunAction]


class CommandNotFoundError(ValueError):
    """Error raised when a given command ID is not found in the store."""

    def __init__(self, command_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Command {command_id} was not found.")


class RunStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize a RunStore with sql engine."""
        self._sql_engine = sql_engine

    def update_run_state(
        self,
        run_id: str,
        summary: StateSummary,
        commands: List[Command],
    ) -> RunResource:
        """Update the run's state summary and commands list.

        Args:
            run_id: The run to update
            summary: The run's equipment and status summary.
            commands: The run's commands.

        Returns:
            The run resource.

        Raises:
            RunNotFoundError: Run ID was not found in the database.
        """
        update_run = (
            sqlalchemy.update(run_table)
            .where(run_table.c.id == run_id)
            .values(
                _convert_state_to_sql_values(
                    run_id=run_id,
                    commands=commands,
                    state_summary=summary,
                    engine_status=summary.status,
                )
            )
        )
        select_run_resource = sqlalchemy.select(_run_columns).where(
            run_table.c.id == run_id
        )

        select_actions = sqlalchemy.select(action_table).where(
            action_table.c.run_id == run_id
        )

        with self._sql_engine.begin() as transaction:
            transaction.execute(update_run)

            try:
                run_row = transaction.execute(select_run_resource).one()
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=run_id)

            action_rows = transaction.execute(select_actions).all()

        self._clear_caches()
        return _convert_row_to_run(row=run_row, action_rows=action_rows)

    def insert_action(self, run_id: str, action: RunAction) -> None:
        """Insert a run action into the store.

        Args:
            run_id: Run to add the action to.
            action: Action payload to persist.

        Raises:
            RunNotFoundError: The given run ID was not found in the store.
        """
        insert = sqlalchemy.insert(action_table).values(
            _convert_action_to_sql_values(run_id=run_id, action=action),
        )

        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(insert)
            except sqlalchemy.exc.IntegrityError as e:
                raise RunNotFoundError(run_id=run_id) from e

        self._clear_caches()

    def insert(
        self,
        run_id: str,
        created_at: datetime,
        protocol_id: Optional[str],
    ) -> RunResource:
        """Insert run resource in the db.

        Args:
            run_id: Unique identifier to use for the run.
            created_at: Run creation timestamp.
            protocol_id: Protocol resource used by the run, if any.

        Returns:
            The resource that was added to the store.

        Raises:
            ProtocolNotFoundError: The given protocol ID was not
                found in the store.
        """
        run = RunResource(
            run_id=run_id,
            created_at=created_at,
            protocol_id=protocol_id,
            actions=[],
        )
        insert = sqlalchemy.insert(run_table).values(
            _convert_run_to_sql_values(run=run)
        )

        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(insert)
            except sqlalchemy.exc.IntegrityError:
                assert (
                    run.protocol_id is not None
                ), "Insert run failed due to unexpected IntegrityError"
                raise ProtocolNotFoundError(protocol_id=run.protocol_id)

        self._clear_caches()
        return run

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def has(self, run_id: str) -> bool:
        """Whether a given run exists in the store."""
        statement = sqlalchemy.select(run_table.c.id).where(run_table.c.id == run_id)
        with self._sql_engine.begin() as transaction:
            return transaction.execute(statement).first() is not None

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Args:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry.

        Raises:
            RunNotFoundError: The given run ID was not found.
        """
        select_run_resource = sqlalchemy.select(_run_columns).where(
            run_table.c.id == run_id
        )

        select_actions = sqlalchemy.select(action_table).where(
            action_table.c.run_id == run_id
        )

        with self._sql_engine.begin() as transaction:
            try:
                run_row = transaction.execute(select_run_resource).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise RunNotFoundError(run_id) from e
            action_rows = transaction.execute(select_actions).all()

        return _convert_row_to_run(run_row, action_rows)

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get_all(self, length: Optional[int] = None) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        select_runs = sqlalchemy.select(_run_columns)
        select_actions = sqlalchemy.select(action_table).order_by(sqlite_rowid.asc())
        actions_by_run_id = defaultdict(list)

        with self._sql_engine.begin() as transaction:
            if length is not None:
                select_runs = (
                    select_runs.limit(length)
                    .order_by(sqlite_rowid.desc())
                    .limit(length)
                )
                # need to select the last inserted runs and return by asc order
                runs = list(reversed(transaction.execute(select_runs).all()))
            else:
                runs = transaction.execute(
                    select_runs.order_by(sqlite_rowid.asc())
                ).all()

            actions = transaction.execute(select_actions).all()

        for action_row in actions:
            actions_by_run_id[action_row.run_id].append(action_row)

        return [
            _convert_row_to_run(
                row=run_row,
                action_rows=actions_by_run_id[run_row.id],
            )
            for run_row in runs
        ]

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get_state_summary(self, run_id: str) -> Optional[StateSummary]:
        """Get the archived run state summary.

        This is a summary of run's ProtocolEngine state,
        captured when the run was archived. It contains
        status, equipment, and error information.
        """
        select_run_data = sqlalchemy.select(run_table.c.state_summary).where(
            run_table.c.id == run_id
        )

        with self._sql_engine.begin() as transaction:
            row = transaction.execute(select_run_data).one()

        try:
            return (
                StateSummary.parse_obj(row.state_summary)
                if row.state_summary is not None
                else None
            )
        except ValidationError as e:
            log.warn(f"Error retrieving state summary for {run_id}: {e}")
            return None

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def _get_all_unparsed_commands(self, run_id: str) -> List[Dict[str, Any]]:
        select_run_commands = sqlalchemy.select(run_table.c.commands).where(
            run_table.c.id == run_id
        )

        with self._sql_engine.begin() as transaction:
            try:
                row = transaction.execute(select_run_commands).one()
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=run_id)

        return (
            cast(List[Dict[str, Any]], row.commands) if row.commands is not None else []
        )

    def get_commands_slice(
        self,
        run_id: str,
        length: int,
        cursor: Optional[int],
    ) -> CommandSlice:
        """Get a slice of run commands from the store.

        Args:
            run_id: Run ID to pull commands from.
            length: Number of commands to return.
            cursor: The starting index of the slice in the whole collection.

        Returns:
            A collection of commands as well as the actual cursor used and
            the total length of the collection.

        Raises:
            RunNotFoundError: The given run ID was not found.
        """
        command_intent_dicts = self._get_all_unparsed_commands(run_id)
        commands_length = len(command_intent_dicts)
        if cursor is None:
            cursor = commands_length - length

        # start is inclusive, stop is exclusive
        actual_cursor = max(0, min(cursor, commands_length - 1))
        stop = min(commands_length, actual_cursor + length)
        sliced_commands: List[Command] = [
            parse_obj_as(Command, command)  # type: ignore[arg-type]
            for command in command_intent_dicts[actual_cursor:stop]
        ]

        return CommandSlice(
            cursor=actual_cursor,
            total_length=commands_length,
            commands=sliced_commands,
        )

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get_command(self, run_id: str, command_id: str) -> Command:
        """Get run command by id.

        Args:
            run_id: The run to pull the command from.
            command_id: The specific command to pull.

        Returns:
            The command.

        Raises:
            RunNotFoundError: The given run ID was not found in the store.
            CommandNotFoundError: The given command ID was not found in the store.
        """
        select_run_commands = sqlalchemy.select(run_table.c.commands).where(
            run_table.c.id == run_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                row = transaction.execute(select_run_commands).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise RunNotFoundError(run_id=run_id) from e

        try:
            command = next(c for c in row.commands if c["id"] == command_id)
        except StopIteration as e:
            raise CommandNotFoundError(command_id=command_id) from e

        return parse_obj_as(Command, command)  # type: ignore[arg-type]

    def remove(self, run_id: str) -> None:
        """Remove a run by its unique identifier.

        Arguments:
            run_id: The run's unique identifier.

        Raises:
            RunNotFoundError: The specified run ID was not found.
        """
        delete_run = sqlalchemy.delete(run_table).where(run_table.c.id == run_id)
        delete_actions = sqlalchemy.delete(action_table).where(
            action_table.c.run_id == run_id
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(delete_actions)
            result = transaction.execute(delete_run)

        if result.rowcount < 1:
            raise RunNotFoundError(run_id)

        self._clear_caches()

    def _clear_caches(self) -> None:
        self.has.cache_clear()
        self.get.cache_clear()
        self.get_all.cache_clear()
        self.get_state_summary.cache_clear()
        self.get_command.cache_clear()
        self._get_all_unparsed_commands.cache_clear()


# The columns that must be present in a row passed to _convert_row_to_run().
_run_columns = [run_table.c.id, run_table.c.protocol_id, run_table.c.created_at]


def _convert_row_to_run(
    row: sqlalchemy.engine.Row,
    action_rows: List[sqlalchemy.engine.Row],
) -> RunResource:
    run_id = row.id
    protocol_id = row.protocol_id
    created_at = row.created_at

    assert isinstance(run_id, str), f"Run ID {run_id} is not a string"
    assert protocol_id is None or isinstance(
        protocol_id, str
    ), f"Protocol ID {protocol_id} is not a string or None"

    return RunResource(
        run_id=run_id,
        created_at=created_at,
        protocol_id=protocol_id,
        actions=[
            RunAction(
                id=action_row.id,
                createdAt=action_row.created_at,
                actionType=RunActionType(action_row.action_type),
            )
            for action_row in action_rows
        ],
    )


def _convert_run_to_sql_values(run: RunResource) -> Dict[str, object]:
    return {
        "id": run.run_id,
        "created_at": run.created_at,
        "protocol_id": run.protocol_id,
    }


def _convert_action_to_sql_values(action: RunAction, run_id: str) -> Dict[str, object]:
    return {
        "id": action.id,
        "created_at": action.createdAt,
        "action_type": action.actionType.value,
        "run_id": run_id,
    }


def _convert_state_to_sql_values(
    run_id: str,
    state_summary: StateSummary,
    commands: List[Command],
    engine_status: str,
) -> Dict[str, object]:
    return {
        "state_summary": state_summary.dict(),
        "engine_status": engine_status,
        "commands": [command.dict() for command in commands],
        "_updated_at": utc_now(),
    }

"""Runs' on-db store."""
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

import sqlalchemy
from pydantic import parse_obj_as

from opentrons.util.helpers import utc_now
from opentrons.protocol_engine import ProtocolRunData, CommandSlice
from opentrons.protocol_engine.commands import Command

from robot_server.persistence import run_table, action_table, ensure_utc_datetime
from robot_server.protocols import ProtocolNotFoundError

from .action_models import RunAction, RunActionType


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


@dataclass(frozen=True)
class _RunStateResource:
    """An entry in the run state store, used to construct response models.

    This represents all run information derived from the run's ProtocolEngine.
    """

    run_id: str
    protocol_run_data: ProtocolRunData
    commands: List[Command]
    engine_status: str
    _updated_at: datetime = field(default_factory=utc_now)


class RunNotFoundError(ValueError):
    """Error raised when a given Run ID is not found in the store."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Run {run_id} was not found.")


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
            run_data: ProtocolRunData,
            commands: List[Command],
    ) -> RunResource:
        """Update run table with run protocol_run_data to db.

        Args:
            run_id: The run to update
            run_data: The run's equipment and status summary.
            commands: The run's commands.

        Returns:
            The run resource.
        """
        update_run = (
            sqlalchemy.update(run_table)
                .where(run_table.c.id == run_id)
                .values(
                _convert_state_to_sql_values(
                    state=_RunStateResource(
                        commands=commands,
                        protocol_run_data=run_data,
                        run_id=run_id,
                        engine_status=run_data.status,
                    )
                )
            )
        )
        select_run_resource = sqlalchemy.select(
            run_table.c.id,
            run_table.c.protocol_id,
            run_table.c.created_at,
        ).where(run_table.c.id == run_id)

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

        return _convert_row_to_run(row=run_row, action_rows=action_rows)

    def insert_action(self, run_id: str, action: RunAction) -> None:
        """Insert run action in the db.

        Arguments:
            run_id: current run id to get
            action: action to insert into the db
        """
        insert = sqlalchemy.insert(action_table).values(
            _convert_action_to_sql_values(run_id=run_id, action=action),
        )

        with self._sql_engine.begin() as transaction:
            try:
                transaction.execute(insert)
            except sqlalchemy.exc.IntegrityError:
                raise RunNotFoundError(run_id=run_id)

    def insert(
            self,
            run_id: str,
            created_at: datetime,
            protocol_id: Optional[str],
    ) -> RunResource:
        """Insert run resource in the db.

        Arguments:
            run: Run resource to store.

        Returns:
            The resource that was added to the store.
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

        return run

    def has(self, run_id: str) -> bool:
        """Whether a given run exists in the store."""
        statement = sqlalchemy.select(run_table).where(run_table.c.id == run_id)
        with self._sql_engine.begin() as transaction:
            try:
                exists = transaction.execute(statement).first() is not None
            except sqlalchemy.exc.NoResultFound:
                return False
            return exists

    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Arguments:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry from the db.
        """
        select_run_resource = sqlalchemy.select(
            run_table.c.id,
            run_table.c.protocol_id,
            run_table.c.created_at,
        ).where(run_table.c.id == run_id)

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

    def get_all(self) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        select_runs = sqlalchemy.select(run_table)
        select_actions = sqlalchemy.select(action_table)
        actions_by_run_id = defaultdict(list)

        with self._sql_engine.begin() as transaction:
            runs = transaction.execute(select_runs).all()
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

    def get_run_data(self, run_id: str) -> Optional[ProtocolRunData]:
        """Get the archived run data of a run."""
        select_run_data = sqlalchemy.select(run_table.c.protocol_run_data).where(
            run_table.c.id == run_id
        )

        with self._sql_engine.begin() as transaction:
            row = transaction.execute(select_run_data).one()

        return (
            ProtocolRunData.parse_obj(row.protocol_run_data)
            if row.protocol_run_data is not None
            else None
        )

    def get_run_commands(self, run_id: str) -> List[Command]:
        """Get the archived commands list of a run."""
        select_run_commands = sqlalchemy.select(run_table.c.commands).where(
            run_table.c.id == run_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                row = transaction.execute(select_run_commands).one()
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=run_id)

        return (
            [
                parse_obj_as(Command, command)  # type: ignore[arg-type]
                for command in row.commands
            ]
            if row.commands is not None
            else []
        )

    def get_commands_slice(self, cursor: Optional[int], length: int, run_id: str) -> CommandSlice:
        """Get run commands slice from db"""
        print("get_commands_slice")
        commands = self.get_run_commands(run_id=run_id)
        print("commands slice")
        print(commands)
        commands_length = len(commands)
        if cursor is None:
            cursor = commands_length - length

        # start is inclusive, stop is exclusive
        actual_cursor = max(0, min(cursor, commands_length - 1))
        stop = min(commands_length, actual_cursor + length)
        sliced_commands = commands[actual_cursor:stop]

        return CommandSlice(
            cursor=actual_cursor,
            total_length=commands_length,
            commands=sliced_commands
        )

    def get_command(self, run_id: str, command_id: str) -> Command:
        """Get run command by id"""
        select_run_commands = sqlalchemy.select(run_table.c.commands).where(
            run_table.c.id == run_id
        ).where(run_table.c.id == run_id)
        with self._sql_engine.begin() as transaction:
            try:
                row = transaction.execute(select_run_commands).one()
            except sqlalchemy.exc.NoResultFound:
                raise RunNotFoundError(run_id=run_id)
            try:
                command = next(filter(lambda x: x['id'] == command_id, row.commands))
            except StopIteration:
                raise CommandNotFoundError(command_id=command_id)
            return parse_obj_as(Command, command)

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


def _convert_row_to_run(
        row: sqlalchemy.engine.Row,
        action_rows: List[sqlalchemy.engine.Row],
) -> RunResource:
    run_id = row.id
    protocol_id = row.protocol_id
    created_at = ensure_utc_datetime(row.created_at)

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
                createdAt=ensure_utc_datetime(action_row.created_at),
                actionType=RunActionType(action_row.action_type),
            )
            for action_row in action_rows
        ],
    )


def _convert_run_to_sql_values(run: RunResource) -> Dict[str, object]:
    return {
        "id": run.run_id,
        "created_at": ensure_utc_datetime(run.created_at),
        "protocol_id": run.protocol_id,
    }


def _convert_action_to_sql_values(action: RunAction, run_id: str) -> Dict[str, object]:
    return {
        "id": action.id,
        "created_at": ensure_utc_datetime(action.createdAt),
        "action_type": action.actionType.value,
        "run_id": run_id,
    }


def _convert_state_to_sql_values(state: _RunStateResource) -> Dict[str, object]:
    return {
        "protocol_run_data": state.protocol_run_data.dict(),
        "engine_status": state.engine_status,
        "commands": [command.dict() for command in state.commands],
        "_updated_at": ensure_utc_datetime(state._updated_at),
    }

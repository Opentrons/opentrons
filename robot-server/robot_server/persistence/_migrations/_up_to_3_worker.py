# fmt: off

# We keep a list of all the modules that this file imports
# so we can preload them when launching the subprocesses.
from types import ModuleType
_imports: "list[ModuleType]" = []

import contextlib
import pathlib
import typing
_imports.extend([contextlib, pathlib, typing])

import pydantic
import sqlalchemy
_imports.extend([pydantic, sqlalchemy])

from opentrons.protocol_engine import commands
from server_utils import sql_utils
_imports.extend([commands, sql_utils])

from robot_server.persistence._tables import schema_2, schema_3
from robot_server.persistence import (
    _database,
    legacy_pickle,
    pydantic as pydantic_helpers
)
_imports.extend([schema_2, schema_3, _database, legacy_pickle, pydantic_helpers])

# fmt: on


imports: typing.List[str] = [m.__name__ for m in _imports]


def migrate_db_commands_for_run(
    args: typing.Tuple[
        pathlib.Path,
        pathlib.Path,
        str,
        # This is a multiprocessing.Lock, which can't be a type annotation for some reason.
        typing.ContextManager[object],
    ]
) -> None:
    source_db_file, dest_db_file, run_id, lock = args

    with _database.sql_engine_ctx(
        source_db_file
    ) as source_engine, _database.sql_engine_ctx(dest_db_file) as dest_engine:
        select_old_commands = sqlalchemy.select(schema_2.run_table.c.commands).where(
            schema_2.run_table.c.id == run_id
        )
        insert_new_command = sqlalchemy.insert(schema_3.run_command_table)

        with lock, source_engine.begin() as source_transaction:
            old_commands_bytes: typing.Optional[bytes] = source_transaction.execute(
                select_old_commands
            ).scalar_one()

        old_commands: typing.List[typing.Dict[str, object]] = (
            legacy_pickle.loads(old_commands_bytes) if old_commands_bytes else []
        )

        parsed_commands: typing.Iterable[commands.Command] = (
            pydantic.parse_obj_as(
                commands.Command,  # type: ignore[arg-type]
                c,
            )
            for c in old_commands
        )

        new_command_rows = [
            {
                "run_id": run_id,
                "index_in_run": index_in_run,
                "command_id": parsed_command.id,
                "command": pydantic_helpers.pydantic_to_json(parsed_command),
            }
            for index_in_run, parsed_command in enumerate(parsed_commands)
        ]

        # Insert all the commands for this run in one go, to avoid the overhead of
        # separate statements, and since we had to bring them all into memory at once
        # in order to parse them anyway.
        with lock, dest_engine.begin() as dest_transaction:
            if len(new_command_rows) > 0:
                # This needs to be guarded by a len>0 check because if the list is empty,
                # SQLAlchemy misinterprets this as inserting a single row with all default
                # values.
                dest_transaction.execute(insert_new_command, new_command_rows)

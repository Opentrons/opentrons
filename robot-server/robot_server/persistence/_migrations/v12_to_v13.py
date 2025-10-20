"""Migrate the persistence directory from schema 12 to 13.

Summary of changes from schema 13:

- This compatibility change adds additional camera related fields to the BooleanSettingKey table.
- Refactors data_files table into separate input/output tables with unified storage metadata.
- Adds input_data_files table for what are currently uploaded files.
- Adds output_data_files table for what are currently generated files with run/command associations.
- Updates run table to include input_file_ids and output_file_ids JSON arrays.
- Updates foreign key references in analysis_csv_rtp_table and run_csv_rtp_table to use composite keys.
"""

from pathlib import Path
import json

from ._util import copy_contents
from .._folder_migrator import Migration
import sqlalchemy
from ..database import sql_engine_ctx

from opentrons_shared_data.data_files import MimeType
from robot_server.persistence.tables import schema_11, schema_13
from robot_server.persistence.file_and_directory_names import DB_FILE


class Migration12to13(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 12 to 13."""
        copy_contents(source_dir=source_dir, dest_dir=dest_dir)

        with sql_engine_ctx(
            dest_dir / DB_FILE
        ) as engine, engine.begin() as transaction:
            assert (
                schema_11.boolean_setting_table.name
                != schema_13.boolean_setting_table.name
            )
            _migrate_boolean_settings_table(transaction)
            _migrate_data_files_tables(transaction)
            _migrate_run_table(transaction)
            _update_foreign_key_references(transaction)


def _migrate_boolean_settings_table(connection: sqlalchemy.engine.Connection) -> None:
    """Migrate the exist `boolean_settings` table to the new schema."""
    old_boolean_settings = connection.execute(
        sqlalchemy.select(schema_11.boolean_setting_table)
    )
    # create a new boolean settings table to account for new constraints
    schema_13.boolean_setting_table.create(connection)

    # up-migrate all the old elements and new elements to the new table
    for table_row in old_boolean_settings:
        connection.execute(
            sqlalchemy.insert(schema_13.boolean_setting_table).values(
                key=table_row.key, value=table_row.value
            )
        )
    new_rows = [
        {"key": str(schema_13.BooleanSettingKey.ENABLE_CAMERA.value), "value": False},
        {
            "key": str(schema_13.BooleanSettingKey.ENABLE_LIVE_STREAM.value),
            "value": False,
        },
        {
            "key": str(schema_13.BooleanSettingKey.ENABLE_ERROR_RECOVERY_CAMERA.value),
            "value": False,
        },
    ]
    connection.execute(sqlalchemy.insert(schema_13.boolean_setting_table), new_rows)

    # drop the old boolean settings table
    schema_11.boolean_setting_table.drop(connection)


def _migrate_data_files_tables(connection: sqlalchemy.engine.Connection) -> None:
    """Migrate data_files table to new schema with separate input/output tables."""
    old_data_files = connection.execute(
        sqlalchemy.select(schema_11.data_files_table)
    ).fetchall()

    schema_11.data_files_table.drop(connection)

    schema_13.data_files_table.create(connection)
    schema_13.input_data_files_table.create(connection)
    schema_13.output_data_files_table.create(connection)

    for old_row in old_data_files:
        # Determine mime_type based on file extension if not present
        if hasattr(old_row, "mime_type") and old_row.mime_type:
            mime_type = old_row.mime_type
        else:
            mime_type = (
                MimeType.IMAGE_JPEG.value
                if old_row.name.endswith(".jpeg")
                else MimeType.TEXT_CSV.value
            )

        # Determine if file was generated or uploaded
        is_generated = old_row.source == "generated" if old_row.source else False

        # Create a path for the file. If it's an image, we can't know the run associated with it in schema 11.
        path = (
            f"data_files/{old_row.id}/{old_row.name}"
            if mime_type == MimeType.TEXT_CSV.value
            else ""
        )

        connection.execute(
            sqlalchemy.insert(schema_13.data_files_table).values(
                id=old_row.id,
                name=old_row.name,
                path=path,
                stored=True,
                generated=is_generated,
                mime_type=mime_type,
                file_hash=old_row.file_hash,
                created_at=old_row.created_at,
            )
        )

        # Schema 11 does not have the necessary information to migrate
        # existing generated files to the output_files table.
        # For input files, we'll populate run_id later when we process run_csv_rtp_table
        if not is_generated:
            connection.execute(
                sqlalchemy.insert(schema_13.input_data_files_table).values(
                    file_id=old_row.id,
                    run_id="",  # Placeholder, will be updated later
                )
            )


def _migrate_run_table(connection: sqlalchemy.engine.Connection) -> None:
    """Add input_file_ids and output_file_ids columns to run table."""
    old_runs = connection.execute(sqlalchemy.select(schema_11.run_table)).fetchall()

    schema_11.run_table.drop(connection)

    schema_13.run_table.create(connection)

    # Migrate run data
    for old_run in old_runs:
        connection.execute(
            sqlalchemy.insert(schema_13.run_table).values(
                id=old_run.id,
                created_at=old_run.created_at,
                protocol_id=old_run.protocol_id,
                state_summary=old_run.state_summary,
                engine_status=old_run.engine_status,
                _updated_at=old_run._updated_at,
                run_time_parameters=old_run.run_time_parameters,
                input_file_ids=None,  # Will be populated later
                output_file_ids=None,
            )
        )


def _update_foreign_key_references(connection: sqlalchemy.engine.Connection) -> None:
    """Update foreign key references in related tables and populate run file associations."""

    old_analysis_csv = connection.execute(
        sqlalchemy.select(schema_11.analysis_csv_rtp_table)
    ).fetchall()

    old_run_csv = connection.execute(
        sqlalchemy.select(schema_11.run_csv_rtp_table)
    ).fetchall()

    schema_11.analysis_csv_rtp_table.drop(connection)
    schema_11.run_csv_rtp_table.drop(connection)

    schema_13.analysis_csv_rtp_table.create(connection)
    schema_13.run_csv_rtp_table.create(connection)

    run_input_files = {}

    # First pass: Update input_data_files with actual run_ids from run_csv_rtp_table
    # and track which files belong to which runs
    for old_row in old_run_csv:
        # Update the placeholder run_id in input_data_files_table
        connection.execute(
            sqlalchemy.update(schema_13.input_data_files_table)
            .where(
                sqlalchemy.and_(
                    schema_13.input_data_files_table.c.file_id == old_row.file_id,
                    schema_13.input_data_files_table.c.run_id == "",
                )
            )
            .values(run_id=old_row.run_id)
        )

        # Track this input file for the run
        if old_row.run_id not in run_input_files:
            run_input_files[old_row.run_id] = []
        if old_row.file_id not in run_input_files[old_row.run_id]:
            run_input_files[old_row.run_id].append(old_row.file_id)

    # Clean up any input_data_files entries that still have placeholder run_id
    # (files that weren't associated with any run in schema 11)
    connection.execute(
        sqlalchemy.delete(schema_13.input_data_files_table).where(
            schema_13.input_data_files_table.c.run_id == ""
        )
    )

    # Migrate analysis_csv_rtp_table data with composite foreign key
    for old_row in old_analysis_csv:
        # We need to find a run_id for this file. Since analysis doesn't have direct run association,
        # we'll use the first run that uses this file, or skip if no run uses it
        input_file = connection.execute(
            sqlalchemy.select(schema_13.input_data_files_table).where(
                schema_13.input_data_files_table.c.file_id == old_row.file_id
            )
        ).first()

        if input_file:
            connection.execute(
                sqlalchemy.insert(schema_13.analysis_csv_rtp_table).values(
                    analysis_id=old_row.analysis_id,
                    parameter_variable_name=old_row.parameter_variable_name,
                    input_file_id=input_file.file_id,
                    input_run_id=input_file.run_id,
                )
            )

    # Migrate run_csv_rtp_table data with composite foreign key
    for old_row in old_run_csv:
        input_file = connection.execute(
            sqlalchemy.select(schema_13.input_data_files_table).where(
                sqlalchemy.and_(
                    schema_13.input_data_files_table.c.file_id == old_row.file_id,
                    schema_13.input_data_files_table.c.run_id == old_row.run_id,
                )
            )
        ).first()

        if input_file:
            connection.execute(
                sqlalchemy.insert(schema_13.run_csv_rtp_table).values(
                    run_id=old_row.run_id,
                    parameter_variable_name=old_row.parameter_variable_name,
                    input_file_id=input_file.file_id,
                    input_run_id=input_file.run_id,
                )
            )

    # Update run table with input file associations
    all_runs = connection.execute(
        sqlalchemy.select(schema_13.run_table.c.id)
    ).fetchall()

    for run_row in all_runs:
        run_id = run_row.id

        input_ids = run_input_files.get(run_id, [])

        # Update the run with JSON arrays of file IDs
        connection.execute(
            sqlalchemy.update(schema_13.run_table)
            .where(schema_13.run_table.c.id == run_id)
            .values(
                input_file_ids=json.dumps(input_ids) if input_ids else None,
            )
        )

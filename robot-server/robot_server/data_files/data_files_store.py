"""Store and retrieve information about uploaded data files from the database."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Set

import sqlalchemy.engine

from robot_server.deletion_planner import FileUsageInfo
from robot_server.persistence.database import sqlite_rowid
from robot_server.persistence.tables import (
    data_files_table,
    input_data_files_table,
    output_data_files_table,
    analysis_csv_rtp_table,
    run_csv_rtp_table,
)
from opentrons_shared_data.data_files import (
    DataFileInfo,
    InputDataFileInfo,
    OutputDataFileInfo,
    IODataFileInfo,
    CmdDataFileInfo,
    MimeType,
    DataFileInfoWithCommands,
)

from .models import FileIdNotFoundError, FileInUseError


@dataclass(frozen=True)
class DataFileWithCommandsInfoSlice:
    """A subset of data file info."""

    file_info: List[DataFileInfoWithCommands]
    total_length: int


@dataclass(frozen=True)
class DataFilesByRunInfo:
    """Container for input and output data file metadata for a run."""

    input_files: List[DataFileInfo]
    output_files: List[DataFileInfo]


class DataFilesStore:
    """Store and retrieve info about uploaded data files."""

    def __init__(
        self,
        sql_engine: sqlalchemy.engine.Engine,
        data_files_directory: Path,
        images_directory: Path,
    ) -> None:
        """Create a new DataFilesStore."""
        self._sql_engine = sql_engine
        self._data_files_directory = data_files_directory
        self._images_directory = images_directory

    def get_file_info_by_hash(self, file_hash: str) -> Optional[DataFileInfo]:
        """Get the data file info having the provided hash."""
        statement = sqlalchemy.select(data_files_table).where(
            data_files_table.c.file_hash == file_hash
        )
        with self._sql_engine.begin() as transaction:
            result = transaction.execute(statement).first()
            if result is None:
                return None
            else:
                return _convert_row_to_data_file_info(result)

    def get_files_info_by_run_mime_type(
        self,
        run_id: str,
        mime_type: MimeType,
        limit: int,
        offset: int,
    ) -> DataFileWithCommandsInfoSlice:
        """Get all data files associated with a specific run, ordered oldest to newest."""
        statement = (
            sqlalchemy.select(
                data_files_table,
                output_data_files_table.c.command_id,
                output_data_files_table.c.prev_command_id,
                sqlalchemy.func.count().over().label("total_count"),
            )
            .join(
                output_data_files_table,
                data_files_table.c.id == output_data_files_table.c.file_id,
            )
            .where(output_data_files_table.c.run_id == run_id)
            .where(data_files_table.c.mime_type == mime_type.value)
            .order_by(data_files_table.c.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        with self._sql_engine.begin() as transaction:
            rows = transaction.execute(statement).all()

        if not rows:
            return DataFileWithCommandsInfoSlice(file_info=[], total_length=0)
        else:
            total_count = rows[0].total_count
            file_info = [
                _convert_row_to_data_file_info_with_commands(row) for row in rows
            ]

            return DataFileWithCommandsInfoSlice(
                file_info=file_info, total_length=total_count
            )

    async def insert(self, file_info: DataFileInfo) -> None:
        """Insert data file info in the database."""
        file_info_dict = {
            "id": file_info.id,
            "name": file_info.name,
            "path": file_info.path,
            "stored": file_info.stored,
            "generated": file_info.generated,
            "file_hash": file_info.file_hash,
            "mime_type": file_info.mime_type,
            "created_at": file_info.created_at,
        }
        statement = sqlalchemy.insert(data_files_table).values(file_info_dict)
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

    async def insert_input_file(self, input_file_info: InputDataFileInfo) -> None:
        """Insert input data file info in the input data files table."""
        input_file_dict = {
            "file_id": input_file_info.file_id,
            "run_id": input_file_info.run_id,
        }
        statement = sqlalchemy.insert(input_data_files_table).values(input_file_dict)
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

    async def insert_output_file(self, output_file_info: OutputDataFileInfo) -> None:
        """Insert output data file info in the output data files table."""
        output_file_dict = {
            "file_id": output_file_info.file_id,
            "run_id": output_file_info.run_id,
            "command_id": output_file_info.command_info.command_id,
            "prev_command_id": output_file_info.command_info.prev_command_id,
        }
        statement = sqlalchemy.insert(output_data_files_table).values(output_file_dict)
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

    def get(self, data_file_id: str) -> DataFileInfo:
        """Get data file info from the database."""
        statement = sqlalchemy.select(data_files_table).where(
            data_files_table.c.id == data_file_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                data_file_row = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise FileIdNotFoundError(data_file_id) from e

        return _convert_row_to_data_file_info(data_file_row)

    def get_io_file_info(self, file_id: str, run_id: str) -> IODataFileInfo:
        """Get input or output data file info given a file ID and run ID.

        Raises:
            FileIdNotFoundError: if the file ID and run ID combination is not found
        """
        input_statement = sqlalchemy.select(input_data_files_table).where(
            sqlalchemy.and_(
                input_data_files_table.c.file_id == file_id,
                input_data_files_table.c.run_id == run_id,
            )
        )
        with self._sql_engine.begin() as transaction:
            input_result = transaction.execute(input_statement).first()

            if input_result is not None:
                return InputDataFileInfo(
                    run_id=input_result.run_id,
                    file_id=input_result.file_id,
                    command_info=None,
                )

            output_statement = sqlalchemy.select(output_data_files_table).where(
                sqlalchemy.and_(
                    output_data_files_table.c.file_id == file_id,
                    output_data_files_table.c.run_id == run_id,
                )
            )
            output_result = transaction.execute(output_statement).first()

            if output_result is not None:
                return OutputDataFileInfo(
                    run_id=output_result.run_id,
                    file_id=output_result.file_id,
                    command_info=CmdDataFileInfo(
                        command_id=output_result.command_id,
                        prev_command_id=output_result.prev_command_id,
                    ),
                )

            raise FileIdNotFoundError(f"{file_id}:{run_id}")

    def get_data_file_from_io_id(self, file_id: str, run_id: str) -> DataFileInfo:
        """Get DataFileInfo given a file ID and run ID.

        Raises:
            FileIdNotFoundError: if the file ID and run ID combination or associated data file is not found
        """
        io_info = self.get_io_file_info(file_id, run_id)
        return self.get(io_info.file_id)

    def sql_get_all_from_engine(self) -> List[DataFileInfo]:
        """Get all data file entries from the database."""
        statement = sqlalchemy.select(data_files_table).order_by(sqlite_rowid)
        with self._sql_engine.begin() as transaction:
            all_rows = transaction.execute(statement).all()
        return [_convert_row_to_data_file_info(sql_row) for sql_row in all_rows]

    def get_data_files_by_run_id(self, run_id: str) -> DataFilesByRunInfo:
        """Get all input and output data files associated with a run."""
        input_statement = (
            sqlalchemy.select(data_files_table)
            .join(
                input_data_files_table,
                data_files_table.c.id == input_data_files_table.c.file_id,
            )
            .where(input_data_files_table.c.run_id == run_id)
            .order_by(data_files_table.c.created_at.desc())
        )

        output_statement = (
            sqlalchemy.select(data_files_table)
            .join(
                output_data_files_table,
                data_files_table.c.id == output_data_files_table.c.file_id,
            )
            .where(output_data_files_table.c.run_id == run_id)
            .order_by(data_files_table.c.created_at.desc())
        )

        with self._sql_engine.begin() as transaction:
            input_rows = transaction.execute(input_statement).all()
            input_files = [_convert_row_to_data_file_info(row) for row in input_rows]

            output_rows = transaction.execute(output_statement).all()
            output_files = [_convert_row_to_data_file_info(row) for row in output_rows]

        return DataFilesByRunInfo(input_files=input_files, output_files=output_files)

    def get_usage_info(self, generated: Optional[bool] = None) -> List[FileUsageInfo]:
        """Return information about usage of all the existing data files in runs & analyses.

        Results are ordered with the oldest-added data file first.
        """
        if generated is None:
            select_all_data_file_ids = sqlalchemy.select(
                data_files_table.c.id
            ).order_by(sqlite_rowid)
        else:
            select_all_data_file_ids = (
                sqlalchemy.select(data_files_table.c.id)
                .where(data_files_table.c.generated == generated)
                .order_by(sqlite_rowid)
            )

        select_ids_used_in_analyses = sqlalchemy.select(
            analysis_csv_rtp_table.c.file_id
        ).where(analysis_csv_rtp_table.c.file_id.is_not(None))

        select_ids_used_in_runs = sqlalchemy.select(run_csv_rtp_table.c.file_id).where(
            run_csv_rtp_table.c.file_id.is_not(None)
        )

        with self._sql_engine.begin() as transaction:
            all_file_ids: List[str] = (
                transaction.execute(select_all_data_file_ids).scalars().all()
            )
            files_used_in_analyses: Set[str] = set(
                transaction.execute(select_ids_used_in_analyses).scalars().all()
            )
            files_used_in_runs: Set[str] = set(
                transaction.execute(select_ids_used_in_runs).scalars().all()
            )

        usage_info = [
            FileUsageInfo(
                file_id=file_id,
                used_by_run_or_analysis=(
                    file_id in files_used_in_runs or file_id in files_used_in_analyses
                ),
            )
            for file_id in all_file_ids
        ]
        return usage_info

    def remove_stored(self, file_id: str) -> None:
        """Remove the persisted data file and clean up associated records.

        Strategy:
        - Always remove physical file from disk
        - If file only exists in input_data_files table: fully delete from input_data_files and data_files
        - If file exists in output_data_files table: mark as not stored in data_files, preserve output_data_files
        records, and delete any input_data_files records.

        This should only be called when the specified file has no references
        in analysis_csv_rtp_table or run_csv_rtp_table.

        Raises:
            FileIdNotFoundError: the given file ID was not found in the store.
            FileInUseError: the given file is referenced by an analysis or run
                            and cannot be deleted.
        """
        # Check if file is used in analyses
        select_ids_used_in_analyses = sqlalchemy.select(
            analysis_csv_rtp_table.c.analysis_id
        ).where(analysis_csv_rtp_table.c.file_id == file_id)

        # Check if file is used in runs
        select_ids_used_in_runs = sqlalchemy.select(run_csv_rtp_table.c.run_id).where(
            run_csv_rtp_table.c.file_id == file_id
        )

        # Check if file exists in output_data_files table
        select_output_file_entries = sqlalchemy.select(
            output_data_files_table.c.file_id
        ).where(output_data_files_table.c.file_id == file_id)

        # Check if file exists in input_data_files table
        select_input_file_entries = sqlalchemy.select(
            input_data_files_table.c.file_id
        ).where(input_data_files_table.c.file_id == file_id)

        with self._sql_engine.begin() as transaction:
            file_exists = transaction.execute(
                sqlalchemy.select(data_files_table).where(
                    data_files_table.c.id == file_id
                )
            ).first()

            if not file_exists:
                raise FileIdNotFoundError(file_id)

            files_used_in_analyses: Set[str] = set(
                transaction.execute(select_ids_used_in_analyses).scalars().all()
            )
            files_used_in_runs: Set[str] = set(
                transaction.execute(select_ids_used_in_runs).scalars().all()
            )

            if len(files_used_in_analyses) + len(files_used_in_runs) > 0:
                raise FileInUseError(
                    data_file_id=file_id,
                    ids_used_in_runs=files_used_in_runs,
                    ids_used_in_analyses=files_used_in_analyses,
                )

            output_entries = list(
                transaction.execute(select_output_file_entries).scalars().all()
            )
            has_output_entries = len(output_entries) > 0

            input_entries = list(
                transaction.execute(select_input_file_entries).scalars().all()
            )
            has_input_entries = len(input_entries) > 0

            if has_output_entries:
                # File is generated output - preserve it for history
                # Delete all input file entries (if any)
                if has_input_entries:
                    transaction.execute(
                        input_data_files_table.delete().where(
                            input_data_files_table.c.file_id == file_id
                        )
                    )

                # Mark as not stored in data_files table instead of deleting from data_files table
                transaction.execute(
                    sqlalchemy.update(data_files_table)
                    .where(data_files_table.c.id == file_id)
                    .values(stored=False)
                )
            else:
                if has_input_entries:
                    transaction.execute(
                        input_data_files_table.delete().where(
                            input_data_files_table.c.file_id == file_id
                        )
                    )

                # Delete from data_files table
                transaction.execute(
                    data_files_table.delete().where(data_files_table.c.id == file_id)
                )

        file_path = Path(file_exists.path)
        self._remove_directory_and_contents(file_path.parent)

    def remove_all_by_run_id(self, run_id: str) -> None:
        """Remove all data files associated with a specific run.

        Strategy:
        - Always delete all entries from output_data_files table for this run
        - Always delete all physical files in the images directory for this run
        - For each output file: if it has no entries in input_data_files table,
          fully remove from data_files table and delete the physical file
        - If a file has entries in input_data_files table, preserve the physical file
          and entries in the input_data_files table and the data_files table
        """
        run_image_dir = self._images_directory / run_id
        self._remove_directory_and_contents(run_image_dir)

        select_output_files_for_run = sqlalchemy.select(
            output_data_files_table.c.file_id
        ).where(output_data_files_table.c.run_id == run_id)

        with self._sql_engine.begin() as transaction:
            output_file_ids = list(
                transaction.execute(select_output_files_for_run).scalars().all()
            )

            if output_file_ids:
                transaction.execute(
                    output_data_files_table.delete().where(
                        output_data_files_table.c.run_id == run_id
                    )
                )

                files_to_fully_remove = []
                for file_id in output_file_ids:
                    select_input_entries = sqlalchemy.select(
                        input_data_files_table.c.file_id
                    ).where(input_data_files_table.c.file_id == file_id)

                    input_entries = transaction.execute(select_input_entries).first()

                    if input_entries is None:
                        files_to_fully_remove.append(file_id)

                if files_to_fully_remove:
                    select_files = sqlalchemy.select(data_files_table).where(
                        data_files_table.c.id.in_(files_to_fully_remove)
                    )
                    file_rows = transaction.execute(select_files).all()

                    transaction.execute(
                        data_files_table.delete().where(
                            data_files_table.c.id.in_(files_to_fully_remove)
                        )
                    )

                    for file_row in file_rows:
                        file_path = Path(file_row.path)
                        self._remove_directory_and_contents(file_path.parent)

    def _remove_directory_and_contents(self, directory: Path) -> None:
        """Remove a directory and all its contents."""
        if directory.exists():
            for file in directory.glob("*"):
                file.unlink()
            directory.rmdir()


def _convert_row_to_data_file_info(row: sqlalchemy.engine.Row) -> DataFileInfo:
    """Convert a database row to DataFileInfo."""
    return DataFileInfo(
        id=row.id,
        name=row.name,
        path=row.path,
        stored=row.stored,
        generated=row.generated,
        file_hash=row.file_hash,
        mime_type=row.mime_type,
        created_at=row.created_at,
    )


def _convert_row_to_data_file_info_with_commands(
    row: sqlalchemy.engine.Row,
) -> DataFileInfoWithCommands:
    """Convert a database row to DataFileInfoWithCommands."""
    return DataFileInfoWithCommands(
        id=row.id,
        name=row.name,
        path=row.path,
        stored=row.stored,
        generated=row.generated,
        file_hash=row.file_hash,
        mime_type=row.mime_type,
        created_at=row.created_at,
        command_info=CmdDataFileInfo(
            command_id=row.command_id,
            prev_command_id=row.prev_command_id,
        ),
    )

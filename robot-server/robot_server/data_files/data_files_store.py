"""Store and retrieve information about uploaded data files from the database."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import sqlalchemy.engine


@dataclass(frozen=True)
class DataFileInfo:
    """Metadata info of a saved data file."""

    id: str
    name: str
    file_hash: str
    created_at: datetime


class DataFilesStore:
    """Store and retrieve info about uploaded data files."""

    def __init__(
        self,
        *,
        _sql_engine: sqlalchemy.engine.Engine,
    ) -> None:
        """Do not call directly.

        Use `create_empty()` or `rehydrate()` instead.
        """

    @classmethod
    async def create_empty(cls, sql_engine: sqlalchemy.engine.Engine) -> DataFilesStore:
        """Return a new, empty DataFilesStore."""
        return cls(_sql_engine=sql_engine)

    @classmethod
    async def rehydrate(
        cls,
        sql_engine: sqlalchemy.engine.Engine,
        files_directory: Path,
    ) -> DataFilesStore:
        """Returns a new DataFilesStore, picking up where a former one left off."""

    def get_file_info_by_hash(self, file_hash: str) -> Optional[DataFileInfo]:
        """Get the ID of data file having the provided hash."""

    async def insert(self, file_info: DataFileInfo) -> None:
        """Insert data file info in the database."""

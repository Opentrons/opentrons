"""Auto-delete old data files to make room for new ones."""
from logging import getLogger
from typing import Final

from robot_server.data_files.data_files_store import DataFilesStore

_log = getLogger(__name__)

_MAX_DATA_FILES_TO_STORE: Final = 50


class DataFileAutoDeleter:
    """Auto deleter for data files."""

    def __init__(
        self,
        data_files_store: DataFilesStore,
    ) -> None:
        self._data_files_store = data_files_store

    async def make_room_for_new_file(self) -> None:
        """Delete old data files to make room for a new one."""
        all_files = {
            file_info.id
            for file_info in self._data_files_store.sql_get_all_from_engine()
        }
        if len(all_files) < _MAX_DATA_FILES_TO_STORE:
            return

        data_file_usage_info = [
            usage_info for usage_info in self._data_files_store.get_usage_info()
        ]

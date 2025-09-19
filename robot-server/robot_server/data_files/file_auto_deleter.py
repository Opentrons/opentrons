"""Auto-delete old user data files to make room for new ones."""
from logging import getLogger

from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.models import DataFileSource
from robot_server.deletion_planner import DataFileDeletionPlanner

_log = getLogger(__name__)


class DataFileAutoDeleter:
    """Auto deleter for uploaded data files."""

    def __init__(
        self,
        data_files_store: DataFilesStore,
        deletion_planner: DataFileDeletionPlanner,
    ) -> None:
        self._data_files_store = data_files_store
        self._deletion_planner = deletion_planner

    async def make_room_for_new_file(self) -> None:
        """Delete old data files to make room for a new one."""
        # It feels wasteful to collect usage info of upto 50 files
        # even when there's no need for deletion
        data_file_usage_info = self._data_files_store.get_usage_info(
            DataFileSource.UPLOADED
        )

        if len(data_file_usage_info) < self._deletion_planner.maximum_allowed_files:
            return
        file_ids_to_delete = self._deletion_planner.plan_for_new_file(
            existing_files=data_file_usage_info
        )

        if file_ids_to_delete:
            _log.info(
                f"Auto-deleting these files to make room for a new one: {file_ids_to_delete}"
            )
            for file_id in file_ids_to_delete:
                self._data_files_store.remove(file_id)

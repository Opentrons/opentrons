"""Auto-delete old resources to make room for new ones."""

from logging import getLogger

from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.data_files.file_auto_deleter import DataFileAutoDeleter
from .run_store import RunStore


_log = getLogger(__name__)


class RunAutoDeleter:  # noqa: D101
    def __init__(
        self,
        run_store: RunStore,
        deletion_planner: RunDeletionPlanner,
        data_file_auto_deleter: DataFileAutoDeleter,
    ) -> None:
        self._run_store = run_store
        self._deletion_planner = deletion_planner
        self._data_file_auto_deleter = data_file_auto_deleter

    def make_room_for_new_run(self) -> None:  # noqa: D102
        runs = self._run_store.get_all()
        run_ids = [r.run_id for r in runs]

        run_ids_to_delete = self._deletion_planner.plan_for_new_run(
            existing_runs=run_ids
        )

        if run_ids_to_delete:
            _log.info(
                f"Auto-deleting these runs to make room for a new one: {run_ids_to_delete}"
            )

            self._data_file_auto_deleter.make_room_for_new_generated_files(
                run_ids_to_delete
            )

            for id in run_ids_to_delete:
                self._run_store.remove(run_id=id)

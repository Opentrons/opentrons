"""Auto-delete old resources to make room for new ones."""


from logging import getLogger

from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolStore
from .run_store import RunStore


_log = getLogger(__name__)


class RunAutoDeleter:  # noqa: D101
    def __init__(
        self,
        run_store: RunStore,
        protocol_store: ProtocolStore,
        deletion_planner: RunDeletionPlanner,
        protocol_kind: ProtocolKind,
    ) -> None:
        self._run_store = run_store
        self._protocol_store = protocol_store
        self._deletion_planner = deletion_planner
        self._protocol_kind = protocol_kind

    def make_room_for_new_run(self) -> None:  # noqa: D102
        protocols = self._protocol_store.get_all()
        protocol_ids = [p.protocol_id for p in protocols]
        filtered_protocol_ids = [
            p.protocol_id for p in protocols if p.protocol_kind == self._protocol_kind
        ]

        # runs with no protocols first, then oldest to newest.
        runs = self._run_store.get_all()
        run_ids = [
            r.run_id
            for r in runs
            if r.protocol_id not in protocol_ids
            or r.protocol_id in filtered_protocol_ids
        ]

        run_ids_to_delete = self._deletion_planner.plan_for_new_run(
            existing_runs=run_ids
        )
        if run_ids_to_delete:
            _log.info(
                f"Auto-deleting these runs to make room for a new one: {run_ids_to_delete}"
            )
            for id in run_ids_to_delete:
                self._run_store.remove(run_id=id)

"""Auto-delete old resources to make room for new ones."""


from logging import getLogger
from typing import Optional

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
    ) -> None:
        self._run_store = run_store
        self._protocol_store = protocol_store
        self._deletion_planner = deletion_planner

    def make_room_for_new_run(  # noqa: D102
        self, exclude_kind: Optional[ProtocolKind] = None
    ) -> None:
        excluded_protocols = [
            p.protocol_id
            for p in self._protocol_store.get_all()
            if p.protocol_kind == exclude_kind
        ]
        run_ids = [
            r.run_id
            for r in self._run_store.get_all()
            if r.protocol_id not in excluded_protocols
        ]

        run_ids_to_delete = self._deletion_planner.plan_for_new_run(
            existing_runs=run_ids,
        )

        _log.info(
            f"Auto-deleting these runs to make room for a new one:"
            f" {run_ids_to_delete}"
        )
        for id in run_ids_to_delete:
            self._run_store.remove(run_id=id)

"""Auto-delete old resources to make room for new ones."""


from logging import getLogger

from robot_server.deletion_planner import ProtocolDeletionPlanner
from robot_server.protocols.protocol_models import ProtocolKind
from .protocol_store import ProtocolStore


_log = getLogger(__name__)


class ProtocolAutoDeleter:  # noqa: D101
    def __init__(
        self,
        protocol_store: ProtocolStore,
        deletion_planner: ProtocolDeletionPlanner,
        protocol_kind: ProtocolKind,
    ) -> None:
        self._protocol_store = protocol_store
        self._deletion_planner = deletion_planner
        self._protocol_kind = protocol_kind

    def make_room_for_new_protocol(self) -> None:
        """Finds unused protocols and deletes them."""
        protocols = {
            p.protocol_id
            for p in self._protocol_store.get_all()
            if p.protocol_kind == self._protocol_kind
        }

        protocol_run_usage_info = [
            p
            for p in self._protocol_store.get_usage_info()
            if p.protocol_id in protocols
        ]

        protocol_ids_to_delete = self._deletion_planner.plan_for_new_protocol(
            existing_protocols=protocol_run_usage_info,
        )

        if protocol_ids_to_delete:
            _log.info(
                f"Auto-deleting these protocols to make room for a new one:"
                f" {protocol_ids_to_delete}"
            )
            for protocol_id in protocol_ids_to_delete:
                self._protocol_store.remove(protocol_id=protocol_id)

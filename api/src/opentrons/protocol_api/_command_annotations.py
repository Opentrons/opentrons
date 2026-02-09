from .core.common import ProtocolCore


class GroupedSteps:
    """Represents a created grouping of steps."""

    def __init__(self, annotation_id: str, protocol_core: ProtocolCore) -> None:
        self._annotation_id = annotation_id
        self._protocol_core = protocol_core
        self._annotation_closed = False

    def close_group(self) -> None:
        if not self._annotation_closed:
            self._protocol_core.close_command_annotation(
                annotation_id=self._annotation_id
            )
            self._annotation_closed = True

from .core.common import ProtocolCore
from opentrons.protocols.api_support.types import APIVersion


class GroupedSteps:
    """Represents a created grouping of steps."""

    def __init__(
        self, annotation_id: str, protocol_core: ProtocolCore, api_version: APIVersion
    ) -> None:
        self._annotation_id = annotation_id
        self._protocol_core = protocol_core
        self._api_version = api_version
        self._annotation_closed = False

    # TODO(jbl, 2026-02-12) when feature flag is removed add a version check decorator
    def end_group(self) -> None:
        if not self._annotation_closed:
            self._protocol_core.end_step_grouping(annotation_id=self._annotation_id)
            self._annotation_closed = True

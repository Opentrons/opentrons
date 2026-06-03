from .core.common import ProtocolCore
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version


class GroupedSteps:
    """Represents a created grouping of protocol steps.

    *New in version 2.29*
    """

    def __init__(
        self, annotation_id: str, protocol_core: ProtocolCore, api_version: APIVersion
    ) -> None:
        self._annotation_id = annotation_id
        self._protocol_core = protocol_core
        self._api_version = api_version
        self._annotation_closed = False

    @requires_version(2, 29)
    def end_group(self) -> None:
        """End a step group begun with
        [`ProtocolContext.create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group]."""
        if not self._annotation_closed:
            self._protocol_core.end_step_grouping(annotation_id=self._annotation_id)
            self._annotation_closed = True

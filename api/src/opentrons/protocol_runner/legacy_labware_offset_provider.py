"""TODO BEFORE MERGE: docstring."""


from typing import Optional

from opentrons.types import DeckSlotName, Point

from opentrons.protocol_engine import DeckSlotLocation
from opentrons.protocol_engine.state import LabwareView

from .legacy_wrappers import (
    LegacyAbstractLabwareOffsetProvider,
    LegacyProvidedLabwareOffset,
)


class LegacyLabwareOffsetProvider(LegacyAbstractLabwareOffsetProvider):
    """Provides a `ProtocolEngine`'s labware offsets."""

    def __init__(self, labware_view: LabwareView) -> None:
        """TODO BEFORE MERGE: docstring."""
        # TODO before merge: Work out view thread safety, or leave a todo
        self._labware_view = labware_view

    def find(
        self,
        labware_definition_uri: str,
        module_model: Optional[str],
        deck_slot: DeckSlotName,
    ) -> LegacyProvidedLabwareOffset:
        """TODO BEFORE MERGE: docstring."""
        if module_model is not None:
            # TODO BEFORE MERGE: Ideally fix in this PR
            raise NotImplementedError(
                "Loading offsets for labware loaded atop modules"
                " is not currently supported."
            )
        offset = self._labware_view.find_applicable_labware_offset(
            definition_uri=labware_definition_uri,
            location=DeckSlotLocation(slotName=deck_slot),
        )
        if offset is None:
            return LegacyProvidedLabwareOffset(
                delta=Point(x=0, y=0, z=0),
                protocol_engine_id=None,
            )
        else:
            return LegacyProvidedLabwareOffset(
                delta=Point(x=offset.vector.x, y=offset.vector.y, z=offset.vector.z),
                protocol_engine_id=offset.id,
            )

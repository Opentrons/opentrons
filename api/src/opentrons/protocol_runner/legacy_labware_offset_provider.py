"""TODO BEFORE MERGE: docstring."""


from typing import Optional

from opentrons.protocol_api.labware_offset_provider import (
    AbstractLabwareOffsetProvider,
    ProvidedLabwareOffset,
)
from opentrons.types import DeckSlotName, Point

from opentrons.protocol_engine import DeckSlotLocation, StateView


class LegacyLabwareOffsetProvider(AbstractLabwareOffsetProvider):
    """Provides a `ProtocolEngine`'s labware offsets."""

    def __init__(self, state_view: StateView) -> None:
        """TODO BEFORE MERGE: docstring."""
        self._snapshotted_labware_view = state_view.snapshot().labware

    def find(
        self,
        labware_definition_uri: str,
        module_model: Optional[str],
        deck_slot: DeckSlotName,
    ) -> ProvidedLabwareOffset:
        """TODO BEFORE MERGE: docstring."""
        if module_model is not None:
            raise NotImplementedError(
                "Loading offsets for labware loaded atop modules"
                " is not currently supported."
            )
        offset = self._snapshotted_labware_view.find_applicable_labware_offset(
            definition_uri=labware_definition_uri,
            location=DeckSlotLocation(slotName=deck_slot),
        )
        if offset is None:
            return ProvidedLabwareOffset(
                delta=Point(x=0, y=0, z=0),
                protocol_engine_id=None,
            )
        else:
            return ProvidedLabwareOffset(
                delta=Point(x=offset.vector.x, y=offset.vector.y, z=offset.vector.z),
                protocol_engine_id=offset.id,
            )

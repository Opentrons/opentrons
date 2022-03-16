"""Interfaces to provide ProtocolEngine labware offsets to PAPIv2 protocols."""

from typing import Optional

from opentrons.types import DeckSlotName, Point
from opentrons.protocol_api.labware_offset_provider import (
    ProvidedLabwareOffset as LegacyProvidedLabwareOffset,
    AbstractLabwareOffsetProvider as AbstractLegacyLabwareOffsetProvider,
)

from opentrons.protocol_engine import LabwareOffsetLocation, ModuleModel
from opentrons.protocol_engine.state import LabwareView

from .legacy_wrappers import LegacyModuleModel


class LegacyLabwareOffsetProvider(AbstractLegacyLabwareOffsetProvider):
    """Provides a `ProtocolEngine`'s labware offsets."""

    def __init__(self, labware_view: LabwareView) -> None:
        """Initialize an offset provider with access to ProtocolEngine state."""
        self._labware_view = labware_view

    def find(
        self,
        labware_definition_uri: str,
        requested_module_model: Optional[LegacyModuleModel],
        deck_slot: DeckSlotName,
    ) -> LegacyProvidedLabwareOffset:
        """Look up an offset in ProtocolEngine state and return it, if one exists.

        See the parent class for param details.
        """
        offset = self._labware_view.find_applicable_labware_offset(
            definition_uri=labware_definition_uri,
            location=LabwareOffsetLocation(
                slotName=deck_slot,
                moduleModel=(
                    None
                    if requested_module_model is None
                    else ModuleModel(requested_module_model.value)
                ),
            ),
        )
        if offset is None:
            return LegacyProvidedLabwareOffset(
                delta=Point(x=0, y=0, z=0),
                offset_id=None,
            )
        else:
            return LegacyProvidedLabwareOffset(
                delta=Point(x=offset.vector.x, y=offset.vector.y, z=offset.vector.z),
                offset_id=offset.id,
            )


__all__ = [
    "LegacyLabwareOffsetProvider",
    "LegacyProvidedLabwareOffset",
]

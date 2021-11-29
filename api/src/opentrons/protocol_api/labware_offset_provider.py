from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from opentrons.types import DeckSlotName, Point


@dataclass
class ProvidedLabwareOffset:
    """A labware offset provided externally.

    Parameters:
        delta: The positional adjustment that should apply to all movements
            to this labware. Measured in deck coordinates, from the nominal
            position to the adjusted position.
        offset_id: An ID referencing the relevant external offset resource.
            `None` means no matching offset.
    """

    delta: Point
    offset_id: Optional[str]


class AbstractLabwareOffsetProvider(ABC):
    @abstractmethod
    def find(
        self,
        labware_definition_uri: str,
        # todo(mm, 2021-11-22): When there's a good module model enum that's usable
        # by both Protocol Engine and the legacy Python Protocol API, use that here
        # instead of an unconstrained str.
        module_model: Optional[str],
        deck_slot: DeckSlotName,
    ) -> ProvidedLabwareOffset:
        """Return the offset that should apply to a newly loaded labware.

        An APIv2 protocol's `ProtocolContext` should call this once for each labware,
        as it loads it.

        Args:
            labware_definition_uri: The labware's definition URI.
            module_model: If the labware is atop a module, the module's model string,
                          like "temperatureModuleV1". During protocol execution, this
                          should be the model that's actually physically connected,
                          which may be upgraded from the one that the protocol requested
                          with `ProtocolContext.load_module()`.
            deck_slot: The deck slot that the labware occupies. Or, if the labware is
                       atop a module, the deck slot that the module occupies.
        """
        ...


class NullLabwareOffsetProvider(AbstractLabwareOffsetProvider):
    """Always provides (0, 0, 0)."""

    def find(
        self,
        labware_definition_uri: str,
        module_model: Optional[str],
        deck_slot: DeckSlotName,
    ) -> ProvidedLabwareOffset:
        return ProvidedLabwareOffset(delta=Point(0, 0, 0), offset_id=None)

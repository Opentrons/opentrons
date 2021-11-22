from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from opentrons.types import DeckSlotName, Point


@dataclass
class ProvidedLabwareOffset:
    delta: Point
    """The positional adjustment that should apply to all movements to this labware.

    Measured in deck coordinates, from the nominal position to the adjusted position.
    """

    protocol_engine_id: Optional[str]
    """An ID referencing the relevant Protocol Engine labware offset resource.

    `None` means Protocol Engine had no matching offset.
    """
    # todo(mm, 2021-11-18): APIv2 internals should not have to know about
    # Protocol Engine ideas of labware offsets.


class AbstractLabwareOffsetProvider(ABC):
    @abstractmethod
    def find(
        self,
        labware_definition_uri: str,
        # todo(mm, 2021-11-22): Use an enum, not a str, for the module model.
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


class NullLabwareOffsetProvider(AbstractLabwareOffsetProvider):
    """Always provides (0, 0, 0)."""

    def find(
        self,
        labware_definition_uri: str,
        module_model: Optional[str],
        deck_slot: DeckSlotName,
    ) -> ProvidedLabwareOffset:
        return ProvidedLabwareOffset(delta=Point(0, 0, 0), protocol_engine_id=None)

from abc import ABC, abstractmethod
from typing import NamedTuple, Optional

from opentrons.types import DeckSlotName, Point


class LabwareOffsetDetails(NamedTuple):
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
    # TODO: Figure out how to account for labware on modules. PE's LabwareView will need
    # the module type and its deck slot to correctly look up the offset.
    @abstractmethod
    def find(
        self, deck_slot: DeckSlotName, definition_uri: str
    ) -> LabwareOffsetDetails:
        """Return details about the offset to apply to a newly loaded labware.

        This should be called once for each labware, when it's loaded.
        """


class NullLabwareOffsetProvider(AbstractLabwareOffsetProvider):
    """Always provides ((0, 0, 0), None)."""

    def find(
        self, deck_slot: DeckSlotName, definition_uri: str
    ) -> LabwareOffsetDetails:
        return LabwareOffsetDetails(protocol_engine_id=None, delta=Point(0, 0, 0))

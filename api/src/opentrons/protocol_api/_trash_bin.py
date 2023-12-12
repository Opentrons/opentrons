from opentrons.types import DeckSlotName


class TrashBin:
    """Represents a Flex trash bin.

    See :py:obj:`ProtocolContext.load_trash_bin`.
    """

    def __init__(self, location: DeckSlotName, addressable_area_name: str) -> None:
        self._location = location
        self._addressable_area_name = addressable_area_name

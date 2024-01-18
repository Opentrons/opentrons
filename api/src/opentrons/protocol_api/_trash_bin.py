from opentrons.types import DeckSlotName


class TrashBin:
    """Represents a Flex trash bin.

    See :py:obj:`ProtocolContext.load_trash_bin`.
    """

    def __init__(self, location: DeckSlotName, addressable_area_name: str) -> None:
        self._location = location
        self._addressable_area_name = addressable_area_name

    @property
    def location(self) -> DeckSlotName:
        """Location of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guarenteed API.
        """
        return self._location

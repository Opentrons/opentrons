from __future__ import annotations

from opentrons.types import DeckSlotName, Point


class TrashBin:
    """Represents a Flex or OT-2 trash bin.

    See :py:meth:`.ProtocolContext.load_trash_bin`.
    """

    def __init__(
        self,
        location: DeckSlotName,
        addressable_area_name: str,
        offset: Point = Point(x=0, y=0, z=0),
    ) -> None:
        self._location = location
        self._addressable_area_name = addressable_area_name
        # TODO maybe make this some sort of offset vector
        self._offset = offset

    def top(self, x: float = 0, y: float = 0, z: float = 0) -> TrashBin:
        return TrashBin(
            self._location, self._addressable_area_name, Point(x=x, y=y, z=z)
        )

    @property
    def offset(self) -> Point:
        return self._offset

    @property
    def location(self) -> DeckSlotName:
        """Location of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._location

    @property
    def area_name(self) -> str:
        """Addressable area name of the trash bin.

        :meta private:

        This is intended for Opentrons internal use only and is not a guaranteed API.
        """
        return self._addressable_area_name

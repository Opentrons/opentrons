from __future__ import annotations

from opentrons.types import Point


class WasteChute:
    """Represents a Flex waste chute.

    See :py:meth:`.ProtocolContext.load_waste_chute`.
    """

    def __init__(self, offset: Point = Point()) -> None:
        # TODO maybe make this some sort of offset vector
        self._offset = offset

    @staticmethod
    def top(x: float = 0, y: float = 0, z: float = 0) -> WasteChute:
        return WasteChute(Point(x=x, y=y, z=z))

    @property
    def offset(self) -> Point:
        return self._offset

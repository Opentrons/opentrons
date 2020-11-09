import typing

from opentrons import types
from opentrons.protocols.api_support.labware_like import LabwareLike


class LocationCache:
    def __init__(self):
        self._location: typing.Optional[types.Location] = None

    @property
    def location(self) -> typing.Optional[types.Location]:
        return self._location

    @location.setter
    def location(self, location: types.Location):
        self._location = location

    def clear(self):
        self._location = None

    @property
    def point(self) -> typing.Optional[types.Point]:
        return self._location.point if self._location else None

    @property
    def location_labware(self) -> typing.Optional[LabwareLike]:
        return self._location.labware if self._location else None

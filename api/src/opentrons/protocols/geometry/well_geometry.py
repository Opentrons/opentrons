from typing import Optional

from opentrons.types import Location, Point
from opentrons_shared_data.labware.dev_types import WellDefinition


class WellGeometry:

    def __init__(self,
                 well_props: WellDefinition,
                 parent: Location):

        self._position\
            = Point(well_props['x'],
                    well_props['y'],
                    well_props['z'] + well_props['depth']) + parent.point

        if not parent.labware:
            raise ValueError("Wells must have a parent")
        self._parent = parent

        self._shape = well_props['shape']
        if well_props['shape'] == 'rectangular':
            self._length: Optional[float] = well_props['xDimension']
            self._width: Optional[float] = well_props['yDimension']
            self._diameter: Optional[float] = None
        elif well_props['shape'] == 'circular':
            self._length = None
            self._width = None
            self._diameter = well_props['diameter']
        else:
            raise ValueError(
                'Shape "{}" is not a supported well shape'.format(
                    well_props['shape']))
        self._max_volume = well_props['totalLiquidVolume']
        self._depth = well_props['depth']

    @property
    def parent(self) -> Location:
        return self._parent

    @property
    def diameter(self) -> Optional[float]:
        return self._diameter

    def top(self, z: float = 0.0) -> Point:
        return self._position + Point(0, 0, z)

    def bottom(self, z: float = 0.0) -> Point:
        top = self.top()
        bottom_z = top.z - self._depth + z
        return Point(x=top.x, y=top.y, z=bottom_z)

    def center(self) -> Point:
        top = self.top()
        center_z = top.z - (self._depth / 2.0)
        return Point(x=top.x, y=top.y, z=center_z)

    @property
    def max_volume(self) -> float:
        return self._max_volume

    def from_center_cartesian(
            self, x: float, y: float, z: float) -> Point:
        """
        Specifies an arbitrary point in deck coordinates based
        on percentages of the radius in each axis. For example, to specify the
        back-right corner of a well at 1/4 of the well depth from the bottom,
        the call would be `_from_center_cartesian(1, 1, -0.5)`.

        No checks are performed to ensure that the resulting position will be
        inside of the well.

        :param x: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/length in the X axis
        :param y: a float in the range [-1.0, 1.0] for a percentage of half of
            the radius/width in the Y axis
        :param z: a float in the range [-1.0, 1.0] for a percentage of half of
            the height above/below the center

        :return: a Point representing the specified location in absolute deck
        coordinates
        """
        center = self.center()
        if self._shape == 'rectangular':
            x_size: float = self._length  # type: ignore
            y_size: float = self._width  # type: ignore
        else:
            x_size = self._diameter  # type: ignore
            y_size = self._diameter  # type: ignore
        z_size = self._depth

        return Point(
            x=center.x + (x * (x_size / 2.0)),
            y=center.y + (y * (y_size / 2.0)),
            z=center.z + (z * (z_size / 2.0)))

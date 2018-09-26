"""
This module will replace Placeable, and should eventually be renamed to
`labware`
"""
from typing import List, Tuple, Dict
from enum import Enum, auto
import math


class WellShape(Enum):
    RECTANGULAR = auto()
    CIRCULAR = auto()


well_shapes = {
    'rectangular': WellShape.RECTANGULAR,
    'circular': WellShape.CIRCULAR
}


class Well:
    def __init__(self, well_props: dict) -> None:
        self._relative_position = (
            well_props['x'],
            well_props['y'],
            well_props['z'] + well_props['depth'])

        self._shape = well_shapes.get(well_props['shape'])
        if self._shape is WellShape.RECTANGULAR:
            self._length = well_props['length']
            self._width = well_props['width']
            self._diameter = None
        elif self._shape is WellShape.CIRCULAR:
            self._length = None
            self._width = None
            self._diameter = well_props['diameter']
        else:
            raise ValueError(
                'Shape "{}" is not a supported well shape'.format(
                    well_props['shape']))

        self._depth = well_props['depth']

    def top(self) -> Tuple[float, float, float]:
        return self._relative_position

    def bottom(self) -> Tuple[float, float, float]:
        top = self.top()
        bottom_z = top[2] - self._depth
        return top[0], top[1], bottom_z

    def center(self) -> Tuple[float, float, float]:
        top = self.top()
        center_z = top[2] - (self._depth / 2.0)
        return top[0], top[1], center_z

    def _from_center_cartesian(
            self, x: float, y: float, z: float) -> Tuple[float, float, float]:
        c_x, c_y, c_z = self.center()
        if self._shape is WellShape.RECTANGULAR:
            x_size = self._width
            y_size = self._length
        else:
            x_size = self._diameter
            y_size = self._diameter
        z_size = self._depth

        return (
            c_x + (x * (x_size / 2.0)),
            c_y + (y * (y_size / 2.0)),
            c_z + (z * (z_size / 2.0)))

    def _from_center_polar(
            self,
            r: float, theta: float, h: float) -> Tuple[float, float, float]:
        c_x, c_y, c_z = self.center()
        if self._shape is WellShape.RECTANGULAR:
            x_size = self._width
            y_size = self._length
        else:
            x_size = self._diameter
            y_size = self._diameter
        z_size = self._depth

        delta_x = r * x_size / 2.0 * math.cos(theta)
        delta_y = r * y_size / 2.0 * math.sin(theta)
        delta_z = h * z_size

        return (
            c_x + delta_x,
            c_y + delta_y,
            c_z + delta_z)


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack, trough,
    tip rack, etc. It defines the physical geometry of the labware, and
    provides methods for accessing wells within the labware.
    """
    def __init__(self, definition: dict) -> None:
        pass

    def wells(self) -> List[Well]:
        pass

    def wells_by_index(self) -> Dict[str, Well]:
        pass

    def rows(self) -> List[List[Well]]:
        pass

    def rows_by_index(self) -> Dict[str, List[Well]]:
        pass

    def columns(self) -> List[List[Well]]:
        pass

    def columns_by_index(self) -> Dict[str, List[Well]]:
        pass


def load(displayName: str) -> Labware:
    """
    Load a labware definition by name. Definition must have been previously
    stored locally on the robot.
    """
    pass


def load_from_definition(definition: dict) -> Labware:
    """
    Create a labware object from a labware definition dict
    """
    return Labware(definition)

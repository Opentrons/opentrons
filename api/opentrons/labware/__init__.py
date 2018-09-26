from typing import List, Tuple
from collections import OrderedDict


class Well:
    """
    This class represents a well within a labware. It provides methods for
    specifying a location within a well.
    """

    def __init__(self) -> None:
        pass

    def top(self) -> Tuple[float, float, float]:
        pass

    def bottom(self) -> Tuple[float, float, float]:
        pass

    def from_center(self) -> Tuple[float, float, float]:
        pass


class Labware:
    """
    This class represents a labware, such as a PCR plate, a tube rack, trough,
    tip rack, etc. It defines the physical geometry of the labware, and
    provides methods for accessing wells within the labware.
    """
    def __init__(self, defintion: dict) -> None:
        pass

    def wells(self) -> List[Well]:
        pass

    def wells_by_index(self) -> OrderedDict[str, Well]:
        pass

    def rows(self) -> List[List[Well]]:
        pass

    def rows_by_index(self) -> OrderedDict[str, List[Well]]:
        pass

    def columns(self) -> List[List[Well]]:
        pass

    def columns_by_index(self) -> OrderedDict[str, List[Well]]:
        pass


def load(name: str) -> Labware:
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

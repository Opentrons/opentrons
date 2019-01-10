import enum
from typing import Tuple

import opentrons.types


class Axis(enum.Enum):
    X = 0
    Y = 1
    Z = 2
    A = 3
    B = 4
    C = 5

    @classmethod
    def by_mount(cls, mount: opentrons.types.Mount):
        bm = {opentrons.types.Mount.LEFT: cls.Z,
              opentrons.types.Mount.RIGHT: cls.A}
        return bm[mount]

    @classmethod
    def gantry_axes(cls) -> Tuple['Axis', 'Axis', 'Axis', 'Axis']:
        """ The axes which are tied to the gantry and require the deck
        calibration transform
        """
        return (cls.X, cls.Y, cls.Z, cls.A)

    @classmethod
    def of_plunger(cls, mount: opentrons.types.Mount):
        pm = {opentrons.types.Mount.LEFT: cls.B,
              opentrons.types.Mount.RIGHT: cls.C}
        return pm[mount]

    def __str__(self):
        return self.name


class HardwareAPILike:
    """ A dummy class useful in isinstance checks to accept an API or adapter
    """
    pass


class CriticalPoint(enum.Enum):
    MOUNT = enum.auto()
    NOZZLE = enum.auto()
    TIP = enum.auto()

import enum
import asyncio
import functools
import logging
from typing import Tuple

import opentrons.types

MODULE_LOG = logging.getLogger(__name__)


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

    @classmethod
    def to_mount(cls, inst: 'Axis'):
        return {
            cls.Z: opentrons.types.Mount.LEFT,
            cls.A: opentrons.types.Mount.RIGHT,
            cls.B: opentrons.types.Mount.LEFT,
            cls.C: opentrons.types.Mount.RIGHT
        }[inst]

    def __str__(self):
        return self.name


class HardwareAPILike:
    """ A dummy class useful in isinstance checks to accept an API or adapter
    """
    pass


class CriticalPoint(enum.Enum):
    """ Possibilities for the point to move in a move call.

    The active critical point determines the offsets that are added to the
    gantry position when moving a pipette around.
    """
    MOUNT = enum.auto()
    """
    For legacy reasons, the position of the end of a P300 single. The default
    when no pipette is attached, and used for consistent behavior in certain
    contexts (like change pipette) when a variety of different pipettes might
    be attached.
    """

    NOZZLE = enum.auto()
    """
    The end of the nozzle of a single pipette or the end of the back-most
    nozzle of a multipipette. Only relevant when a pipette is present.
    """

    TIP = enum.auto()
    """
    The end of the tip of a single pipette or the end of the back-most
    tip of a multipipette. Only relevant when a pipette is present and
    a tip with known tip length is attached.
    """

    XY_CENTER = enum.auto()
    """
    Separately from the z component of the critical point, XY_CENTER means
    the critical point under consideration is the XY center of the pipette.
    This changes nothing for single pipettes, but makes multipipettes
    move their centers - so between channels 4 and 5 - to the specified
    point.
    """

    FRONT_NOZZLE = enum.auto()
    """
    The end of the front-most nozzle of a multipipette with a tip attached.
    Only relevant when a multichannel pipette is present.
    """


def pausable(func):
    @functools.wraps(func)
    async def pausable_wrapped_obj(*args, **kwargs):
        self = args[0]
        try:
            await self.pause_manager.hold_while_paused()
        except AttributeError as e:
            MODULE_LOG.exception(f'Pausable cannot decorate function without'
                                 f'reference to pause_manager: {e}')
        return func(*args, **kwargs)
    return pausable_wrapped_obj


class PauseManager():
    def __init__(self, loop: asyncio.AbstractEventLoop, is_simulating: bool):
        self._run_flag = asyncio.Event(loop=loop)
        self._is_simulating = is_simulating

    async def hold_while_paused(self):
        if self._is_simulating:
            return True
        else:
            return await self._run_flag.wait()

    def pause():
        self._run_flag.clear()

    def resume():
        self._run_flag.set()

    def is_paused():
        self._run_flag.is_set()

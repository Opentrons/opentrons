import logging
import time
from typing import Optional, TYPE_CHECKING

from .util import log_call
from .. import contexts
from opentrons import commands


log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from ..contexts import ProtocolContext


@log_call(log)
def load(ctx: 'ProtocolContext',
         name: str,
         slot: str):
    new_mod = ctx.load_module(name, slot)
    if isinstance(new_mod, contexts.TemperatureModuleContext):
        return TempDeckV1(new_mod)
    elif isinstance(new_mod, contexts.MagneticModuleContext):
        return MagDeckV1(new_mod)
    else:
        raise RuntimeError(f'Module {name} is not compatible with API V1')


class TempDeckV1(commands.CommandPublisher):
    """
    Legacy wrapper for the temperature module
    """
    def __init__(self, td: contexts.TemperatureModuleContext):
        self._ctx = td
        super().__init__(self._ctx.broker)

    @commands.publish.both(command=commands.tempdeck_set_temp)
    def set_temperature(self, celsius: float):
        """
        Set temperature in degree Celsius
        Range: 4 to 95 degree Celsius (QA tested).
        The internal temp range is -9 to 99 C, which is limited by the 2-digit
        temperature display. Any input outside of this range will be clipped
        to the nearest limit
        """
        # need to reach all the way down to the driver to make this return
        # immediately
        return self._ctx._module._driver.legacy_set_temperature(celsius)

    def deactivate(self):
        """ Stop heating/cooling and turn off the fan """
        return self._ctx.deactivate()

    def wait_for_temp(self):
        """
        This method exits only if set temperature has reached.
        """
        while self._ctx._module.status != 'holding at target':
            time.sleep(0.1)

    @property
    def status(self) -> str:
        """
        Returns a string: 'heating'/'cooling'/'holding at target'/'idle'.
        """
        return self._ctx._module.status

    @property
    def temperature(self) -> float:
        """ Current temperature in degrees celsius """
        return self._ctx.temperature

    @property
    def target(self) -> Optional[float]:
        """
        Target temperature in degree celsius.
        Returns None if no target set
        """
        return self._ctx.target


class MagDeckV1:
    '''
    Legacy wrapper for the magdeck module
    '''
    def __init__(self, md: contexts.MagneticModuleContext):
        self._ctx = md

    def engage(self, **kwargs):
        '''
        Move the magnet to either:
            the default height for the labware loaded on magdeck
            [engage()]
        or  a +/- 'offset' from the default height for the labware
            [engage(offset=2)]
        or  a 'height' value specified as mm from magdeck home position
            [engage(height=20)]
        '''
        return self._ctx.engage(**kwargs)

    def disengage(self):
        '''
        Home the magnet
        '''
        return self._ctx.disengage()

    @property
    def status(self):
        return self._ctx.status

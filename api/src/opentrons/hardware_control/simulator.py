import asyncio
from typing import Dict, Optional, List, Tuple

from opentrons import types
from opentrons.config.pipette_config import configs
from . import modules
from .types import Axis


def find_config(prefix: str) -> str:
    """ Find the most recent config matching `prefix` or None """
    matches = [conf for conf in configs if conf.startswith(prefix)]
    if prefix in matches:
        return prefix
    else:
        return sorted(matches)[0]


class Simulator:
    """ This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """
    def __init__(self,
                 attached_instruments: Dict[types.Mount, str],
                 attached_modules: List[str],
                 config, loop) -> None:
        self._config = config
        self._loop = loop
        self._attached_instruments = attached_instruments
        self._attached_modules = [('mod' + str(idx), mod)
                                  for idx, mod
                                  in enumerate(attached_modules)]

    def move(self, target_position: Dict[str, float]):
        pass

    def home(self, axes: List[Axis] = None) -> Dict[str, float]:
        # driver_3_0-> HOMED_POSITION
        return {'X': 418, 'Y': 353, 'Z': 218, 'A': 218, 'B': 19, 'C': 19}

    def get_attached_instruments(
            self, expected: Dict[types.Mount, str])\
            -> Dict[types.Mount, Optional[str]]:
        """ Update the internal cache of attached instruments.

        This method allows after-init-time specification of attached simulated
        instruments. The method will return
        - the instruments specified at init-time, or if those do not exists,
        - the instruments specified in expected, or if that is not passed,
        - nothing

        :param expected: A mapping of mount to instrument model prefixes. When
                         loading instruments from a prefix, we return the
                         lexically-first model that matches the prefix. If the
                         models specified in expected do not match the models
                         specified in the `attached_instruments` argument of
                         :py:meth:`__init__`, :py:attr:`RuntimeError` is
                         raised.
        :raises RuntimeError: If an instrument is expected but not found.
        :returns: A dict of mount to either instrument model names or `None`.
        """
        to_return: Dict[types.Mount, Optional[str]] = {}
        for mount in types.Mount:
            expected_instr = expected.get(mount, None)
            init_instr = self._attached_instruments.get(mount, None)
            if expected_instr and init_instr\
               and not init_instr.startswith(expected_instr):
                raise RuntimeError(
                    'mount {}: expected instrument {} but got {}'
                    .format(mount.name, expected_instr, init_instr))
            elif init_instr and expected_instr:
                to_return[mount] = init_instr
            elif init_instr:
                to_return[mount] = init_instr
            elif expected_instr:
                to_return[mount] = find_config(expected_instr)
            else:
                to_return[mount] = None
        return to_return

    def set_active_current(self, axis, amp):
        pass

    def set_pipette_speed(self, speed):
        pass

    def get_attached_modules(self) -> List[Tuple[str, str]]:
        return self._attached_modules

    def build_module(self, port: str, model: str) -> modules.AbstractModule:
        return modules.build(port, model, True)

    async def update_module(
            self, module: modules.AbstractModule,
            firmware_file: str,
            loop: Optional[asyncio.AbstractEventLoop])\
            -> modules.AbstractModule:
        return module

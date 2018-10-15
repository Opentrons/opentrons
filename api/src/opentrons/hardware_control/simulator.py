import asyncio
from typing import Dict, Optional, List, Tuple

from opentrons import types
from . import modules
from .types import Axis


class Simulator:
    """ This is a subclass of hardware_control that only simulates the
    hardware actions. It is suitable for use on a dev machine or on
    a robot with no smoothie connected.
    """
    def __init__(self,
                 attached_instruments: Dict[types.Mount, Optional[str]],
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

    def get_attached_instruments(self, mount) -> Optional[str]:
        return self._attached_instruments[mount]

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

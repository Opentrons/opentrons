from typing import Optional, Dict, Union

from opentrons.drivers.smoothie_drivers.constants import (
    HOMED_POSITION,
    Y_BOUND_OVERRIDE,
    DISABLE_AXES,
    AXES,
)
from opentrons.drivers.types import MoveSplits


class SimulatingDriver:
    def __init__(self) -> None:
        self._steps_per_mm: Dict[str, float] = {}
        self._homed_flags: Dict[str, bool] = {}

    @property
    def homed_flags(self) -> Dict[str, bool]:
        return self._homed_flags

    async def home(self, axis: str = AXES, disabled: str = DISABLE_AXES) -> None:
        for ax in axis:
            self._homed_flags[ax] = True

    async def _smoothie_reset(self) -> None:
        self._homed_flags.clear()

    async def read_pipette_id(self, mount: str) -> Optional[str]:
        pass

    async def read_pipette_model(self, mount: str) -> Optional[str]:
        pass

    async def write_pipette_id(self, mount: str, data_string: str) -> None:
        pass

    async def write_pipette_model(self, mount: str, data_string: str) -> None:
        pass

    # def _send_command(self, command, timeout=None):
    #     pass

    def turn_on_blue_button_light(self) -> None:
        pass

    def turn_on_red_button_light(self) -> None:
        pass

    async def update_pipette_config(
        self, axis: str, data: Dict[str, float]
    ) -> Dict[str, Dict[str, float]]:
        """
        Updates the following configs for a given pipette mount based on
        the detected pipette type:
        - homing positions M365.0
        - Max Travel M365.1
        - endstop debounce M365.2 (NOT for zprobe debounce)
        - retract from endstop distance M365.3
        """
        return {}

    @property
    def current(self) -> Dict[str, float]:
        return {}

    @property
    def speed(self) -> None:
        pass

    @property
    def steps_per_mm(self) -> Dict[str, float]:
        return self._steps_per_mm

    # @steps_per_mm.setter
    # def steps_per_mm(self, axis, mm):
    #     # Keep track of any updates to the steps per mm per axis
    #     self._steps_per_mm[axis] = mm

    async def update_steps_per_mm(self, data: Union[Dict[str, float], str]) -> None:
        pass

    def configure_splits_for(self, config: MoveSplits) -> None:
        pass

    def set_dwelling_current(self, settings: Dict[str, float]) -> None:
        pass

    def set_acceleration(self, settings: Dict[str, float]) -> None:
        pass

    @property
    def homed_position(self) -> Dict[str, float]:
        return HOMED_POSITION.copy()

    @property
    def axis_bounds(self) -> Dict[str, float]:
        position = HOMED_POSITION.copy()
        position["Y"] = Y_BOUND_OVERRIDE
        return position

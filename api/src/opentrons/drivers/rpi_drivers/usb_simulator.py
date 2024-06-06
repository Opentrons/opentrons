"""
USB Simulating Driver.

A class to convert info from the usb bus into a
more readable format.
"""
from typing import List, Union

from opentrons.hardware_control.modules.types import (
    ModuleAtPort,
    SimulatingModuleAtPort,
)

from .interfaces import USBDriverInterface


class USBBusSimulator(USBDriverInterface):
    def match_virtual_ports(
        self,
        virtual_port: Union[List[ModuleAtPort], List[SimulatingModuleAtPort]],
    ) -> Union[List[ModuleAtPort], List[SimulatingModuleAtPort]]:
        return virtual_port

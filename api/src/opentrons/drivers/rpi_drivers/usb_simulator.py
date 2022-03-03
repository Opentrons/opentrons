"""
USB Simulating Driver.

A class to convert info from the usb bus into a
more readable format.
"""
from typing import List

from opentrons.hardware_control.modules.types import ModuleAtPort

from .interfaces import USBDriverInterface


class USBBusSimulator(USBDriverInterface):
    def match_virtual_ports(
        self, virtual_port: List[ModuleAtPort]
    ) -> List[ModuleAtPort]:
        return virtual_port

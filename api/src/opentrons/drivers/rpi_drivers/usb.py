"""
USB Driver.

A class to convert info from the usb bus into a
more readable format.
"""

import subprocess
import os
from typing import List, Union

from opentrons.hardware_control.modules.types import (
    ModuleAtPort,
    SimulatingModuleAtPort,
)
from opentrons.hardware_control.types import BoardRevision

from .interfaces import USBDriverInterface
from .types import BUS_PATH, USBPort


class USBBus(USBDriverInterface):
    def __init__(self, board_revision: BoardRevision):
        self._board_revision = board_revision

    @staticmethod
    def _read_bus() -> List[str]:
        """
        Read the USB Bus information.

        Use the sys bus path to find all of the USBs with
        active devices connected to them.
        """
        read = [""]
        try:
            read = (
                subprocess.check_output(["find", BUS_PATH, "-name", "dev"])
                .decode()
                .splitlines()
            )
        except Exception:
            pass
        return read

    @staticmethod
    def _read_symlink(virtual_port: str) -> str:
        """ """
        symlink = ""
        try:
            symlink = os.readlink(virtual_port)
        except OSError:
            pass
        return symlink

    def _read_usb_bus(self) -> List[USBPort]:
        """
        Read usb bus

        Take the value returned from the USB bus and match
        the paths to the expected port paths for modules.
        :returns: A list of matching ports as dataclasses
        """
        active_ports = self._read_bus()
        port_matches = []
        for port in active_ports:
            usb_port = USBPort.build(port.strip("/"), self._board_revision)
            if usb_port:
                port_matches.append(usb_port)
        return port_matches

    def match_virtual_ports(
        self,
        virtual_ports: Union[List[ModuleAtPort], List[SimulatingModuleAtPort]],
    ) -> Union[List[ModuleAtPort], List[SimulatingModuleAtPort]]:
        """
        Match Virtual Ports

        Given a list of virtual module ports, look up the
        symlink to find the device path and link that to
        the physical usb port information.
        The virtual port path looks something like:
        dev/ot_module_[MODULE NAME]
        :param virtual_ports: A list of ModuleAtPort or SimulatingModuleAtPort objects
        that hold the name and virtual port of each module
        connected to the robot.

        :returns: The updated list of ModuleAtPort
        dataclasses with the physical usb port
        information updated.
        """
        actual_ports = self._read_usb_bus()
        sorted_virtual_ports = []

        for p in actual_ports:
            for vp in virtual_ports:
                serial_port = self._read_symlink(vp.port)
                if serial_port in p.device_path:
                    vp.usb_port = p
                    sorted_virtual_ports.append(vp)
                    break

        return sorted_virtual_ports or virtual_ports

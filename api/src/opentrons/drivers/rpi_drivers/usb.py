"""
USB Driver.

A class to convert info from the usb bus into a
more readable format.
"""

import subprocess
import re
from typing import List, Set

from opentrons.algorithms.dfs import DFS

from .interfaces import USBDriverInterface
from .types import USBPort


# Example usb path might look like:
# '/sys/bus/usb/devices/usb1/1-1/1-1.3/1-1.3:1.0/tty/ttyACM1/dev'.
# There is only 1 bus that supports USB on the raspberry pi.
BUS_PATH = '/sys/bus/usb/devices/usb1/'
PORT_PATTERN = r'(/\d-\d(\.?\d)+)+:'
DEVICE_PATH = r'\d.\d/tty/tty(\w{4})/dev'
USB_PORT_INFO = re.compile(PORT_PATTERN + DEVICE_PATH)


class USBBus(USBDriverInterface):
    def __init__(self):
        self._usb_dev: List[USBPort] = self.read_usb_bus()
        self._dfs: DFS = DFS(self._usb_dev)
        self._sorted = self._dfs.dfs()

    @staticmethod
    def read_bus() -> List[str]:
        """
        Read the USB Bus information.

        Use the sys bus path to find all of the USBs with
        active devices connected to them.
        """
        read = ['']
        try:
            read = subprocess.check_output(
                ['find', BUS_PATH, '-name', 'dev']).decode().splitlines()
        except Exception:
            pass
        return read

    @staticmethod
    def read_symlink(virtual_port: str) -> str:
        """
        """
        symlink = ''
        try:
            read = subprocess.check_output(
                ['readlink', virtual_port]).strip().decode()
            symlink = f'dev/{read}'
        except Exception:
            pass
        return symlink

    @staticmethod
    def convert_port_path(full_port_path: str) -> USBPort:
        """
        Convert port path.

        Take the value returned from the USB bus and format
        that information into a dataclass
        :param full_port_path: The string port path
        :returns: The USBPort dataclass
        """
        return USBPort.build(full_port_path.strip('/'))

    @property
    def usb_dev(self) -> List[USBPort]:
        """
        USBBus property: usb_dev.

        :returns: The list of ports found from
        the usb bus.
        """
        return self._usb_dev

    @usb_dev.setter
    def usb_dev(self, ports: List[USBPort]) -> None:
        """
        USBBus setter: usb_dev.

        :param ports: The list of ports found from
        the usb bus.
        """
        self._usb_dev = ports

    @property
    def sorted_ports(self) -> Set:
        """
        USBBus property: sorted_ports.

        :returns: The set of sorted ports
        """
        return self._sorted

    @sorted_ports.setter
    def sorted_ports(self, sorted: Set) -> None:
        """
        USBBus setter: sorted_ports.

        :param sorted: The updated set of usb ports.
        """
        self._sorted = sorted

    def read_usb_bus(self) -> List[USBPort]:
        """
        Read usb bus

        Take the value returned from the USB bus and match
        the paths to the expected port paths for modules.
        :returns: A list of matching ports as dataclasses
        """
        active_ports = self.read_bus()
        port_matches = []
        for port in active_ports:
            match = USB_PORT_INFO.search(port)
            if match:
                port_matches.append(self.convert_port_path(match.group(0)))
        return port_matches

    def find_port(self, device_path: str) -> USBPort:
        """
        Find port.

        Take the value returned from the USB bus and match
        the paths to the expected port paths for modules.
        :param device_path: The device path of a module, which
        generally contains tty/tty* in its name.
        :returns: The matching port, or an empty port dataclass
        """
        for s in self.sorted_ports:
            vertex = self._dfs.graph.get_vertex(s)
            port = vertex.vertex
            if port.device_path.find(device_path):
                return port
        return USBPort(
            name='', sub_names=[], hub=None,
            port_number=None, device_path=device_path)

    def sort_ports(self) -> None:
        """
        Sort ports.

        Check the cached bus read vs the new bus read. Update
        graph and sorted ports accordingly.
        :param device_path: The device path of a module, which
        generally contains tty/tty* in its name.
        :returns: The matching port, or an empty port dataclass
        """
        updated_bus = self.read_usb_bus()
        remove_difference = set(self.usb_dev) - set(updated_bus)
        add_difference = set(updated_bus) - set(self.usb_dev)

        if remove_difference or add_difference:
            for d in remove_difference:
                self._dfs.graph.remove_vertex(d)
            for d in add_difference:
                self._dfs.graph.add_vertex(d)
            self.sorted_ports = self._dfs.dfs()
            self.usb_dev = updated_bus

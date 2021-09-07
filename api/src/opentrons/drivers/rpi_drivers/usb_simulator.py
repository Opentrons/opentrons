"""
USB Simulating Driver.

A class to convert info from the usb bus into a
more readable format.
"""
from typing import List, Set, Union

from opentrons.hardware_control.modules.types import ModuleAtPort
from opentrons.hardware_control.types import BoardRevision

from .interfaces import USBDriverInterface
from .types import USBPort


class USBBusSimulator(USBDriverInterface):
    def __init__(self, board_revision: BoardRevision):
        self._usb_dev: List[USBPort] = self.read_usb_bus()
        self._sorted: Set[Union[int, str]] = set()
        self._board_revision = board_revision

    @staticmethod
    def read_bus() -> List[str]:
        """
        Read the USB Bus information.

        Use the sys bus path to find all of the USBs with
        active devices connected to them.
        """
        return [""]

    @staticmethod
    def read_symlink(virtual_port: str) -> str:
        """ """
        return ""

    @property
    def board_revision(self) -> BoardRevision:
        return self._board_revision

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
        return []

    def find_port(self, device_path: str) -> USBPort:
        """
        Find port.

        Take the value returned from the USB bus and match
        the paths to the expected port paths for modules.
        :param device_path: The device path of a module, which
        generally contains tty/tty* in its name.
        :returns: The matching port, or an empty port dataclass
        """
        return USBPort(name="", sub_names=[], device_path=device_path)

    def sort_ports(self) -> None:
        pass

    def match_virtual_ports(
        self, virtual_port: List[ModuleAtPort]
    ) -> List[ModuleAtPort]:
        return virtual_port

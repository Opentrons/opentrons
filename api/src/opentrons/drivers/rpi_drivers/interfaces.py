from typing import List, Set
from typing_extensions import Protocol

from opentrons.hardware_control.modules.types import ModuleAtPort
from opentrons.hardware_control.types import BoardRevision

from .types import USBPort


class USBDriverInterface(Protocol):

    @staticmethod
    def read_bus() -> List[str]:
        ...

    @staticmethod
    def read_symlink(virtual_port: str) -> str:
        ...

    @property
    def board_revision(self) -> BoardRevision:
        ...

    @property
    def usb_dev(self) -> List[USBPort]:
        ...

    @usb_dev.setter
    def usb_dev(self, ports: List[USBPort]) -> None:
        ...

    @property
    def sorted_ports(self) -> Set:
        ...

    @sorted_ports.setter
    def sorted_ports(self, sorted: Set) -> None:
        ...

    def read_usb_bus(self) -> List[USBPort]:
        ...

    def find_port(self, device_path: str) -> USBPort:
        ...

    def sort_ports(self) -> None:
        ...

    def match_virtual_ports(
            self, virtual_port: List[ModuleAtPort]
            ) -> List[ModuleAtPort]:
        ...

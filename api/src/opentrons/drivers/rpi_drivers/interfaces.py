import abc
from typing import List, Set
from typing_extensions import Protocol

from .types import USBPort


class USBDriverInterface(Protocol):

    @staticmethod
    def read_bus() -> List[str]:
        ...

    @staticmethod
    def convert_port_path(full_port_path: str) -> USBPort:
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

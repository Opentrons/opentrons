from typing import List
from typing_extensions import Protocol

from opentrons.hardware_control.modules.types import ModuleAtPort


class USBDriverInterface(Protocol):
    def match_virtual_ports(
        self,
        virtual_port: List[ModuleAtPort],
    ) -> List[ModuleAtPort]:
        ...

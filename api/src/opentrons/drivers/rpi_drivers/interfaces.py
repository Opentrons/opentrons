from typing import List, Union
from typing_extensions import Protocol

from opentrons.hardware_control.modules.types import (
    ModuleAtPort,
    SimulatingModuleAtPort,
)


class USBDriverInterface(Protocol):
    def match_virtual_ports(
        self,
        virtual_port: Union[List[ModuleAtPort], List[SimulatingModuleAtPort]],
    ) -> Union[List[ModuleAtPort], List[SimulatingModuleAtPort]]:
        ...

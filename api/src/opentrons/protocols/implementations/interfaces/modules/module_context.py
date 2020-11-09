from abc import abstractmethod
from typing import Optional

from opentrons.protocols.implementations.interfaces.labware import LabwareInterface
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons_shared_data.labware import LabwareDefinition


class ModuleContextInterface:

    @abstractmethod
    def load_labware_object(self, labware: LabwareInterface) -> LabwareInterface:
        ...

    @abstractmethod
    def load_labware_from_definition(
            self,
            definition: LabwareDefinition,
            label: str = None) -> LabwareInterface:
        ...

    @abstractmethod
    def get_labware(self) -> Optional[LabwareInterface]:
        ...

    @abstractmethod
    def get_geometry(self) -> ModuleGeometry:
        ...

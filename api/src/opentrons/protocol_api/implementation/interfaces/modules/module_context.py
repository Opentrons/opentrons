from abc import abstractmethod
from typing import Optional

from opentrons.protocol_api.implementation.interfaces.versioned import \
    ApiVersioned
from opentrons.protocol_api.labware import Labware
from opentrons.protocols.geometry.module_geometry import ModuleGeometry
from opentrons_shared_data.labware import LabwareDefinition


class AbstractModuleContextImplementation(ApiVersioned):

    @abstractmethod
    def load_labware_object(self, labware: Labware) -> Labware:
        ...

    @abstractmethod
    def load_labware(
            self,
            name: str,
            label: str = None,
            namespace: str = None,
            version: int = 1,
    ) -> Labware:
        ...

    @abstractmethod
    def load_labware_from_definition(
            self,
            definition: LabwareDefinition,
            label: str = None) -> Labware:
        ...

    @abstractmethod
    def get_labware(self) -> Optional[Labware]:
        ...

    @abstractmethod
    def get_geometry(self) -> ModuleGeometry:
        ...

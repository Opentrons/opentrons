"""Resources used by command execution handlers."""
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point


class IdGenerator():
    def generate_id(self) -> str:
        raise NotImplementedError()


class LabwareData():
    def get_labware_definition(
        self,
        load_name: str,
        namespace: str,
        version: int,
    ) -> LabwareDefinition:
        raise NotImplementedError()

    def get_labware_calibration(self, definition: LabwareDefinition) -> Point:
        raise NotImplementedError()

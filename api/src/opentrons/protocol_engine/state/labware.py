"""Basic labware data state and store."""
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition,
    WellDefinition,
)

from .. import command_models as cmd, errors
from .substore import Substore, CommandReactive


@dataclass(frozen=True)
class LabwareData():
    """Labware data entry."""
    location: int
    definition: LabwareDefinition
    calibration: Tuple[float, float, float]


@dataclass
class LabwareState():
    """Basic labware data state and getter methods."""
    _labware_by_id: Dict[str, LabwareData] = field(default_factory=dict)

    def get_labware_data_by_id(self, uid: str) -> LabwareData:
        """Get labware data by the labware's unique identifier."""
        try:
            return self._labware_by_id[uid]
        except KeyError:
            raise errors.LabwareDoesNotExistError(f"Labware {uid} not found.")

    def get_all_labware(self) -> List[Tuple[str, LabwareData]]:
        """Get a list of all labware entries in state."""
        return [entry for entry in self._labware_by_id.items()]

    def get_well_definition(
        self,
        labware_id: str,
        well_id: str,
    ) -> WellDefinition:
        """Get a well's definition by labware and well identifier."""
        labware_data = self.get_labware_data_by_id(labware_id)

        try:
            return labware_data.definition["wells"][well_id]
        except KeyError:
            raise errors.WellDoesNotExistError(
                f"{well_id} does not exist in {labware_id}."
            )


class LabwareStore(Substore[LabwareState], CommandReactive):
    """Labware state store container class."""

    def __init__(self):
        """Initialize a labware store and its state."""
        self._state = LabwareState()

    def handle_completed_command(
        self,
        command: cmd.CompletedCommandType
    ) -> None:
        if isinstance(command.result, cmd.LoadLabwareResult):
            self._state._labware_by_id[command.result.labwareId] = LabwareData(
                location=command.request.location,
                definition=command.result.definition,
                calibration=command.result.calibration
            )

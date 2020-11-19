"""Basic labware data state and store."""
from dataclasses import dataclass
from typing import Dict, List, Sequence, Tuple
from typing_extensions import final

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition,
    WellDefinition,
)
from opentrons.calibration_storage.helpers import uri_from_definition

from .. import errors
from ..resources import DeckFixedLabware
from ..commands import CompletedCommandType, LoadLabwareResult
from ..types import LabwareLocation
from .substore import Substore, CommandReactive


@final
@dataclass(frozen=True)
class LabwareData:
    """Labware data entry."""

    location: LabwareLocation
    definition: LabwareDefinition
    calibration: Tuple[float, float, float]


class LabwareState:
    """Basic labware data state and getter methods."""

    _labware_by_id: Dict[str, LabwareData]

    def __init__(self, deck_fixed_labware: Sequence[DeckFixedLabware]) -> None:
        """Initialize a LabwareState instance."""
        self._labware_by_id = {
            fixed_labware.labware_id: LabwareData(
                location=fixed_labware.location,
                definition=fixed_labware.definition,
                calibration=(0, 0, 0),
            ) for fixed_labware in deck_fixed_labware
        }

    def get_labware_data_by_id(self, labware_id: str) -> LabwareData:
        """Get labware data by the labware's unique identifier."""
        try:
            return self._labware_by_id[labware_id]
        except KeyError:
            raise errors.LabwareDoesNotExistError(f"Labware {labware_id} not found.")

    def get_all_labware(self) -> List[Tuple[str, LabwareData]]:
        """Get a list of all labware entries in state."""
        return [entry for entry in self._labware_by_id.items()]

    def get_labware_has_quirk(self, labware_id: str, quirk: str) -> bool:
        """Get if a labware has a certain quirk."""
        data = self.get_labware_data_by_id(labware_id)
        return quirk in data.definition["parameters"].get("quirks", ())

    def get_well_definition(
        self,
        labware_id: str,
        well_name: str,
    ) -> WellDefinition:
        """Get a well's definition by labware and well identifier."""
        labware_data = self.get_labware_data_by_id(labware_id)

        try:
            return labware_data.definition["wells"][well_name]
        except KeyError:
            raise errors.WellDoesNotExistError(
                f"{well_name} does not exist in {labware_id}."
            )

    def get_tip_length(self, labware_id: str) -> float:
        """Get the tip length of a tip rack."""
        data = self.get_labware_data_by_id(labware_id)
        try:
            return data.definition["parameters"]["tipLength"]
        except KeyError:
            raise errors.LabwareIsNotTipRackError(
                f"Labware {labware_id} has no tip length defined."
            )

    def get_definition_uri(self, labware_id: str) -> str:
        """Get a labware's definition URI."""
        return uri_from_definition(self.get_labware_data_by_id(labware_id).definition)


class LabwareStore(Substore[LabwareState], CommandReactive):
    """Labware state container."""

    _state: LabwareState

    def __init__(self, deck_fixed_labware: Sequence[DeckFixedLabware]) -> None:
        """Initialize a labware store and its state."""
        self._state = LabwareState(deck_fixed_labware=deck_fixed_labware)

    def handle_completed_command(self, command: CompletedCommandType) -> None:
        """Modify state in reaction to a completed command."""
        if isinstance(command.result, LoadLabwareResult):
            self._state._labware_by_id[command.result.labwareId] = LabwareData(
                location=command.request.location,
                definition=command.result.definition,
                calibration=command.result.calibration
            )

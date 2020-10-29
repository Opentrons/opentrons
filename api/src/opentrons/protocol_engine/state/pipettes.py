"""Basic pipette data state and store."""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import MountType

from .. import command_models as cmd, errors
from .substore import Substore, CommandReactive


@dataclass(frozen=True)
class PipetteData:
    """Pipette state data."""
    mount: MountType
    pipette_name: PipetteName


@dataclass
class PipetteState:
    """Basic labware data state and getter methods."""
    _pipettes_by_id: Dict[str, PipetteData] = field(default_factory=dict)

    def get_pipette_data_by_id(self, pipette_id: str) -> PipetteData:
        """Get pipette data by the pipette's unique identifier."""
        try:
            return self._pipettes_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteDoesNotExistError(
                f"Pipette {pipette_id} not found."
            )

    def get_all_pipettes(self) -> List[Tuple[str, PipetteData]]:
        """Get a list of all pipette entries in state."""
        return [entry for entry in self._pipettes_by_id.items()]

    def get_pipette_data_by_mount(
        self,
        mount: MountType
    ) -> Optional[PipetteData]:
        """Get pipette data by the pipette's mount."""
        for pipette in self._pipettes_by_id.values():
            if pipette.mount == mount:
                return pipette
        return None


class PipetteStore(Substore[PipetteState], CommandReactive):
    def __init__(self):
        self._state = PipetteState()

    def handle_completed_command(
        self,
        command: cmd.CompletedCommandType
    ) -> None:
        if isinstance(command.result, cmd.LoadPipetteResult):
            pipette_id = command.result.pipetteId
            self._state._pipettes_by_id[pipette_id] = PipetteData(
                pipette_name=command.request.pipetteName,
                mount=command.request.mount
            )

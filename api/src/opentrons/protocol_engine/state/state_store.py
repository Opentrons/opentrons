"""Protocol engine state management."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import MountType
from .. import command_models as cmd


@dataclass
class LabwareData():
    """Labware state data."""
    location: int
    definition: Any
    calibration: Tuple[float, float, float]


@dataclass
class PipetteData():
    """Pipette state data."""
    mount: MountType
    pipette_name: PipetteName


@dataclass
class State():
    """
    ProtocolEngine State class.

    This dataclass contains protocol state as well as selector methods to
    retrieve views of the data. The State should be considered read-only by
    everything that isn't a StateStore.
    """
    _commands_by_id: Dict[str, cmd.CommandType] = field(default_factory=dict)
    _labware_by_id: Dict[str, LabwareData] = field(default_factory=dict)
    _pipettes_by_id: Dict[str, PipetteData] = field(default_factory=dict)

    def get_command_by_id(self, uid: str) -> Optional[cmd.CommandType]:
        """Get a command by its unique identifier."""
        return self._commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, cmd.CommandType]]:
        """Get a list of all command entries in state."""
        return [entry for entry in self._commands_by_id.items()]

    def get_labware_data_by_id(self, uid: str) -> Optional[LabwareData]:
        """Get labware data by the labware's unique identifier."""
        return self._labware_by_id.get(uid)

    def get_all_labware(self) -> List[Tuple[str, LabwareData]]:
        """Get a list of all labware entries in state."""
        return [entry for entry in self._labware_by_id.items()]

    def get_pipette_data_by_id(self, uid: str) -> Optional[PipetteData]:
        """Get pipette data by the pipette's unique identifier."""
        return self._pipettes_by_id.get(uid)

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


class StateStore():
    """
    ProtocolEngine state store.

    A StateStore manages a single State instance, modifying the State in
    reaction to commands and other protocol events. The StateStore is the
    only thing that should be allowed to modify State.
    """

    def __init__(self):
        """Initialize a StateStore."""
        self.state: State = State()

    def handle_command(self, command: cmd.CommandType, uid: str) -> None:
        """Modify State in reaction to a Command."""
        self.state._commands_by_id[uid] = command

        if isinstance(command, cmd.CompletedCommand):
            self._handle_completed(command)

    def _handle_completed(self, command: cmd.CompletedCommandType) -> None:
        """Modify State in reaction to a CompletedCommand."""
        if isinstance(command.result, cmd.LoadLabwareResult):
            self.state._labware_by_id[command.result.labwareId] = LabwareData(
                location=command.request.location,
                definition=command.result.definition,
                calibration=command.result.calibration
            )

        elif isinstance(command.result, cmd.LoadPipetteResult):
            self.state._pipettes_by_id[command.result.pipetteId] = \
                PipetteData(
                    pipette_name=command.request.pipetteName,
                    mount=command.request.mount)

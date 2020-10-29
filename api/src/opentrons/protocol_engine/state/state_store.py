"""Protocol engine state management."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Location, MountType, Point

from .. import command_models as cmd
from ..errors import LabwareDoesNotExistError, WellDoesNotExistError


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
class LocationData():
    pipette_id: str
    labware_id: str
    well_id: str


@dataclass
class State():
    """
    ProtocolEngine State class.

    This dataclass contains protocol state as well as selector methods to
    retrieve views of the data. The State should be considered read-only by
    everything that isn't a StateStore.
    """
    _deck_definition: DeckDefinitionV2
    _commands_by_id: Dict[str, cmd.CommandType] = field(default_factory=dict)
    _labware_by_id: Dict[str, LabwareData] = field(default_factory=dict)
    _pipettes_by_id: Dict[str, PipetteData] = field(default_factory=dict)
    _current_location: Optional[LocationData] = None

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

    def get_current_location_data(self) -> Optional[LocationData]:
        """Get the current pipette and deck location the protocol is at."""
        return self._current_location

    def get_deck_definition(self) -> DeckDefinitionV2:
        return self._deck_definition

    def get_slot_position(self, slot: int) -> Point:
        deck_def = self.get_deck_definition()
        position = deck_def["locations"]["orderedSlots"][slot]["position"]

        return Point(x=position[0], y=position[1], z=position[2])

    def get_well_position(self, labware_id: str, well_id: str) -> Point:
        labware_data = self.get_labware_data_by_id(labware_id)

        if labware_data is None:
            raise LabwareDoesNotExistError(f"{labware_id} does not exist.")

        slot_pos = self.get_slot_position(labware_data.location)
        cal_offset = labware_data.calibration
        well_def = labware_data.definition["wells"].get(well_id)

        if well_def is None:
            raise WellDoesNotExistError(
                f"{well_id} does not exist in {labware_id}."
            )

        return Point(
            x=slot_pos[0] + cal_offset[0] + well_def["x"],
            y=slot_pos[1] + cal_offset[1] + well_def["y"],
            z=slot_pos[2] + cal_offset[2] + well_def["z"],
        )


class StateStore():
    """
    ProtocolEngine state store.

    A StateStore manages a single State instance, modifying the State in
    reaction to commands and other protocol events. The StateStore is the
    only thing that should be allowed to modify State.
    """

    def __init__(self, deck_definition: DeckDefinitionV2):
        """Initialize a StateStore."""
        self.state: State = State(_deck_definition=deck_definition)

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

        elif isinstance(
            command.result,
            (cmd.MoveToWellResult, cmd.AspirateResult, cmd.DispenseResult)
        ):
            self.state._current_location = LocationData(
                pipette_id=command.request.pipetteId,
                labware_id=command.request.labwareId,
                well_id=command.request.wellId,
            )

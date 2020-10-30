"""Protocol engine state management."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import MountType, Point
from opentrons.hardware_control.types import CriticalPoint

from opentrons.protocols.geometry.planning import (
    Waypoint,
    MoveType,
    get_waypoints,
)

from .. import command_models as cmd, errors


@dataclass(frozen=True)
class LabwareData():
    """Labware state data."""
    location: int
    definition: Any
    calibration: Tuple[float, float, float]


@dataclass(frozen=True)
class PipetteData():
    """Pipette state data."""
    mount: MountType
    pipette_name: PipetteName


@dataclass(frozen=True)
class LocationData():
    pipette_id: str
    labware_id: str
    well_id: str


@dataclass(frozen=True)
class PipetteLocationData():
    mount: MountType
    critical_point: Optional[CriticalPoint]


@dataclass
class State():
    """
    ProtocolEngine State class.

    This dataclass contains protocol state as well as selector methods to
    retrieve views of the data. The State should be considered read-only by
    everything that isn't a StateStore.
    """
    # TODO(mc, 2020-10-29): it is time to split this state into its own file,
    # at least, and probably several files / classes, too.
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

    def get_labware_data_by_id(self, uid: str) -> LabwareData:
        """Get labware data by the labware's unique identifier."""
        try:
            return self._labware_by_id[uid]
        except KeyError:
            raise errors.LabwareDoesNotExistError(f"Labware {uid} not found.")

    def get_labware_highest_z(self, uid: str) -> float:
        """Get the highest Z-point of a labware."""
        data = self.get_labware_data_by_id(uid)
        z_dim = data.definition["dimensions"]["zDimension"]
        slot_pos = self.get_slot_position(data.location)

        return z_dim + slot_pos[2] + data.calibration[2]

    def get_all_labware_highest_z(self) -> float:
        """Get the highest Z-point of a labware."""
        return max([
            self.get_labware_highest_z(uid)
            for uid in self._labware_by_id.keys()
        ])

    def get_labware_has_quirk(self, uid: str, quirk: str) -> bool:
        data = self.get_labware_data_by_id(uid)
        return quirk in data.definition["parameters"].get("quirks", ())

    def get_all_labware(self) -> List[Tuple[str, LabwareData]]:
        """Get a list of all labware entries in state."""
        return [entry for entry in self._labware_by_id.items()]

    def get_pipette_data_by_id(self, uid: str) -> PipetteData:
        """Get pipette data by the pipette's unique identifier."""
        try:
            return self._pipettes_by_id[uid]
        except KeyError:
            raise errors.PipetteDoesNotExistError(f"Pipette {uid} not found.")

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
        # TODO(mc, 2020-10-29): implement CSS-style key point + offset option
        # rather than defaulting to well top
        labware_data = self.get_labware_data_by_id(labware_id)

        slot_pos = self.get_slot_position(labware_data.location)
        cal_offset = labware_data.calibration
        well_def = labware_data.definition["wells"].get(well_id)

        if well_def is None:
            raise errors.WellDoesNotExistError(
                f"{well_id} does not exist in {labware_id}."
            )

        return Point(
            x=slot_pos[0] + cal_offset[0] + well_def["x"],
            y=slot_pos[1] + cal_offset[1] + well_def["y"],
            z=slot_pos[2] + cal_offset[2] + well_def["z"] + well_def["depth"],
        )

    def get_pipette_location(self, pipette_id: str) -> PipetteLocationData:
        pipette_data = self.get_pipette_data_by_id(pipette_id)
        current_loc = self.get_current_location_data()
        critical_point = None

        if (
            current_loc is not None and
            current_loc.pipette_id == pipette_id and
            self.get_labware_has_quirk(
                current_loc.labware_id,
                "centerMultichannelOnWells"
            )
        ):
            critical_point = CriticalPoint.XY_CENTER

        return PipetteLocationData(
            mount=pipette_data.mount,
            critical_point=critical_point,
        )

    def get_movement_waypoints(
        self,
        pipette_id: str,
        labware_id: str,
        well_id: str,
        origin: Point,
        origin_cp: Optional[CriticalPoint],
        max_travel_z: float
    ) -> List[Waypoint]:
        location = self.get_current_location_data()
        center_dest = self.get_labware_has_quirk(
            labware_id,
            "centerMultichannelOnWells",
        )

        if (
            location is not None and
            pipette_id == location.pipette_id and
            labware_id == location.labware_id
        ):
            move_type = (
                MoveType.IN_LABWARE_ARC
                if well_id != location.well_id else
                MoveType.DIRECT
            )
            min_travel_z = self.get_labware_highest_z(labware_id)
        else:
            move_type = MoveType.GENERAL_ARC
            min_travel_z = self.get_all_labware_highest_z()

        return get_waypoints(
            move_type=move_type,
            origin=origin,
            origin_cp=origin_cp,
            dest=self.get_well_position(labware_id, well_id),
            dest_cp=CriticalPoint.XY_CENTER if center_dest else None,
            min_travel_z=min_travel_z,
            max_travel_z=max_travel_z,
            xy_waypoints=[],
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

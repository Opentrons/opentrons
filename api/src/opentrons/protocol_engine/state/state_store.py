"""
Protocol engine StateStore class

Reacts to command requests and command responses to update the protocol engine
state reactively.
"""
from dataclasses import dataclass, field
from logging import getLogger
from typing import Any, Dict, Optional, Tuple

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Mount
from .. import command_models as cmd


log = getLogger(__name__)


@dataclass
class LabwareData():
    location: int
    definition: Any
    calibration: Tuple[float, float, float]


@dataclass
class PipetteData():
    mount: Mount
    pipette_name: PipetteName


@dataclass
class State():
    _commands_by_id: Dict[str, cmd.CommandType] = field(default_factory=dict)
    _labware_by_id: Dict[str, LabwareData] = field(default_factory=dict)
    _pipettes_by_id: Dict[str, PipetteData] = field(default_factory=dict)

    def get_command_by_id(self, uid: str) -> Optional[cmd.CommandType]:
        return self._commands_by_id.get(uid)

    def get_labware_data_by_id(self, uid: str) -> Optional[LabwareData]:
        return self._labware_by_id.get(uid)

    def get_pipette_data_by_id(self, uid: str) -> Optional[PipetteData]:
        return self._pipettes_by_id.get(uid)

    def get_pipette_data_by_mount(
        self,
        mount: Mount
    ) -> Optional[PipetteData]:
        for pipette in self._pipettes_by_id.values():
            if pipette.mount == mount:
                return pipette
        return None


class StateStore():
    state: State

    def __init__(self):
        self.state = State()

    def handle_command(self, command: cmd.CommandType) -> None:
        self.state._commands_by_id[command.uid] = command

        if isinstance(command, cmd.CompletedCommand):
            self._handle_completed(command)

    def _handle_completed(self, command: cmd.CompletedCommandType) -> None:
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

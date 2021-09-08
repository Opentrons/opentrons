"""Basic pipette data state and store."""
from __future__ import annotations
from dataclasses import dataclass, replace
from typing import Dict, List, Mapping, Optional

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.types import MountType, Mount as HwMount

from .. import errors
from ..types import LoadedPipette

from ..commands import (
    Command,
    LoadPipetteResult,
    AspirateResult,
    DispenseResult,
    MoveToWellResult,
    PickUpTipResult,
    DropTipResult,
)
from .actions import Action, UpdateCommandAction
from .abstract_store import HasState, HandlesActions


@dataclass(frozen=True)
class HardwarePipette:
    """Hardware pipette data."""

    mount: HwMount
    config: PipetteDict


@dataclass(frozen=True)
class CurrentWell:
    """The latest well that the robot has accessed."""

    pipette_id: str
    labware_id: str
    well_name: str


@dataclass(frozen=True)
class PipetteState:
    """Basic labware data state and getter methods."""

    pipettes_by_id: Dict[str, LoadedPipette]
    aspirated_volume_by_id: Dict[str, float]
    current_well: Optional[CurrentWell]


class PipetteStore(HasState[PipetteState], HandlesActions):
    """Pipette state container."""

    _state: PipetteState

    def __init__(self) -> None:
        """Initialize a PipetteStore and its state."""
        self._state = PipetteState(
            pipettes_by_id={},
            aspirated_volume_by_id={},
            current_well=None,
        )

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, UpdateCommandAction):
            self._handle_command(action.command)

    def _handle_command(self, command: Command) -> None:
        if isinstance(
            command.result,
            (
                MoveToWellResult,
                PickUpTipResult,
                DropTipResult,
                AspirateResult,
                DispenseResult,
            ),
        ):
            self._state = replace(
                self._state,
                current_well=CurrentWell(
                    pipette_id=command.data.pipetteId,
                    labware_id=command.data.labwareId,
                    well_name=command.data.wellName,
                ),
            )

        if isinstance(command.result, LoadPipetteResult):
            pipette_id = command.result.pipetteId
            pipettes_by_id = self._state.pipettes_by_id.copy()
            aspirated_volume_by_id = self._state.aspirated_volume_by_id.copy()

            pipettes_by_id[pipette_id] = LoadedPipette(
                id=pipette_id,
                pipetteName=command.data.pipetteName,
                mount=command.data.mount,
            )
            aspirated_volume_by_id[pipette_id] = 0

            self._state = replace(
                self._state,
                pipettes_by_id=pipettes_by_id,
                aspirated_volume_by_id=aspirated_volume_by_id,
            )

        elif isinstance(command.result, AspirateResult):
            pipette_id = command.data.pipetteId
            aspirated_volume_by_id = self._state.aspirated_volume_by_id.copy()

            previous_volume = self._state.aspirated_volume_by_id[pipette_id]
            next_volume = previous_volume + command.result.volume
            aspirated_volume_by_id[pipette_id] = next_volume

            self._state = replace(
                self._state,
                aspirated_volume_by_id=aspirated_volume_by_id,
            )

        elif isinstance(command.result, DispenseResult):
            pipette_id = command.data.pipetteId
            aspirated_volume_by_id = self._state.aspirated_volume_by_id.copy()

            previous_volume = self._state.aspirated_volume_by_id[pipette_id]
            next_volume = max(0, previous_volume - command.result.volume)
            aspirated_volume_by_id[pipette_id] = next_volume

            self._state = replace(
                self._state,
                aspirated_volume_by_id=aspirated_volume_by_id,
            )


class PipetteView(HasState[PipetteState]):
    """Read-only view of computed pipettes state."""

    _state: PipetteState

    def __init__(self, state: PipetteState) -> None:
        """Initialize the view with its backing state value."""
        self._state = state

    def get(self, pipette_id: str) -> LoadedPipette:
        """Get pipette data by the pipette's unique identifier."""
        try:
            return self._state.pipettes_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteDoesNotExistError(f"Pipette {pipette_id} not found.")

    def get_all(self) -> List[LoadedPipette]:
        """Get a list of all pipette entries in state."""
        return list(self._state.pipettes_by_id.values())

    def get_by_mount(self, mount: MountType) -> Optional[LoadedPipette]:
        """Get pipette data by the pipette's mount."""
        for pipette in self._state.pipettes_by_id.values():
            if pipette.mount == mount:
                return pipette
        return None

    def get_hardware_pipette(
        self,
        pipette_id: str,
        attached_pipettes: Mapping[HwMount, Optional[PipetteDict]],
    ) -> HardwarePipette:
        """Get a pipette's hardware configuration and state by ID."""
        pipette_data = self.get(pipette_id)
        pipette_name = pipette_data.pipetteName
        mount = pipette_data.mount

        hw_mount = mount.to_hw_mount()
        hw_config = attached_pipettes[hw_mount]

        if hw_config is None:
            raise errors.PipetteNotAttachedError(f"No pipetted attached on {mount}")
        # TODO(mc, 2020-11-12): support hw_pipette.act_as
        elif hw_config["name"] != pipette_name:
            raise errors.PipetteNotAttachedError(
                f"Found {hw_config['name']} on {mount}, "
                f"but {pipette_id} is a {pipette_name}"
            )

        return HardwarePipette(mount=hw_mount, config=hw_config)

    def get_current_well(self) -> Optional[CurrentWell]:
        """Get the last accessed well and which pipette accessed it."""
        return self._state.current_well

    def get_aspirated_volume(self, pipette_id: str) -> float:
        """Get the currently aspirated volume of a pipette by ID."""
        try:
            return self._state.aspirated_volume_by_id[pipette_id]
        except KeyError:
            raise errors.PipetteDoesNotExistError(
                f"Pipette {pipette_id} not found; unable to get current volume."
            )

    def get_is_ready_to_aspirate(
        self,
        pipette_id: str,
        pipette_config: PipetteDict,
    ) -> bool:
        """Get whether a pipette is ready to aspirate."""
        return (
            self.get_aspirated_volume(pipette_id) > 0
            or pipette_config["ready_to_aspirate"]
        )

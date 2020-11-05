"""Protocol engine state management."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2

from .. import command_models as cmd
from .labware import LabwareStore, LabwareState
from .pipettes import PipetteStore, PipetteState
from .geometry import GeometryStore, GeometryState
from .motion import MotionStore, MotionState


@dataclass
class CommandState():
    """Command state and getters."""
    _commands_by_id: Dict[str, cmd.CommandType] = field(default_factory=dict)

    def get_command_by_id(self, uid: str) -> Optional[cmd.CommandType]:
        """Get a command by its unique identifier."""
        return self._commands_by_id.get(uid)

    def get_all_commands(self) -> List[Tuple[str, cmd.CommandType]]:
        """Get a list of all command entries in state."""
        return [entry for entry in self._commands_by_id.items()]


class StateView():
    def __init__(
        self,
        labware_store: LabwareStore,
        pipette_store: PipetteStore,
        geometry_store: GeometryStore,
        motion_store: MotionStore,
    ) -> None:
        self._labware_store = labware_store
        self._pipette_store = pipette_store
        self._geometry_store = geometry_store
        self._motion_store = motion_store

    @classmethod
    def create_view(cls, target: StateView) -> StateView:
        return cls(
            labware_store=target._labware_store,
            pipette_store=target._pipette_store,
            geometry_store=target._geometry_store,
            motion_store=target._motion_store,
        )

    @property
    def labware(self) -> LabwareState:
        return self._labware_store.state

    @property
    def pipettes(self) -> PipetteState:
        return self._pipette_store.state

    @property
    def geometry(self) -> GeometryState:
        return self._geometry_store.state

    @property
    def motion(self) -> MotionState:
        return self._motion_store.state


class StateStore(StateView):
    """
    ProtocolEngine state store.

    A StateStore manages several substores, which will modify themselves in
    reaction to commands and other protocol events. Only Store classes should
    be allowed to modify State classes.
    """

    def __init__(self, deck_definition: DeckDefinitionV2):
        """Initialize a StateStore."""
        labware_store = LabwareStore()
        pipette_store = PipetteStore()
        geometry_store = GeometryStore(
            deck_definition=deck_definition,
            labware_store=labware_store,
        )
        motion_store = MotionStore(
            labware_store=labware_store,
            pipette_store=pipette_store,
            geometry_store=geometry_store,
        )

        super().__init__(
            labware_store=labware_store,
            pipette_store=pipette_store,
            geometry_store=geometry_store,
            motion_store=motion_store,
        )

        self.commands = CommandState()
        self._substores = (
            labware_store,
            pipette_store,
            geometry_store,
            motion_store,
        )

    def handle_command(self, command: cmd.CommandType, uid: str) -> None:
        """Modify State in reaction to a Command."""
        self.commands._commands_by_id[uid] = command

        if isinstance(command, cmd.CompletedCommand):
            for substore in self._substores:
                substore.handle_completed_command(command)

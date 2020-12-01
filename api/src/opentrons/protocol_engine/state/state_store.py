"""Protocol engine state management."""
from __future__ import annotations
from typing import List, Sequence

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2

from .. import commands as cmd
from ..resources import DeckFixedLabware
from .substore import CommandReactive
from .commands import CommandStore, CommandState
from .labware import LabwareStore, LabwareState
from .pipettes import PipetteStore, PipetteState
from .geometry import GeometryStore, GeometryState
from .motion import MotionStore, MotionState


class StateView:
    """A read-only view of a StateStore."""

    _command_store: CommandStore
    _labware_store: LabwareStore
    _pipette_store: PipetteStore
    _geometry_store: GeometryStore
    _motion_store: MotionStore

    def __init__(
        self,
        command_store: CommandStore,
        labware_store: LabwareStore,
        pipette_store: PipetteStore,
        geometry_store: GeometryStore,
        motion_store: MotionStore,
    ) -> None:
        """Initialize a StateView."""
        self._command_store = command_store
        self._labware_store = labware_store
        self._pipette_store = pipette_store
        self._geometry_store = geometry_store
        self._motion_store = motion_store

    @classmethod
    def create_view(cls, target: StateStore) -> StateView:
        """Create a read-only view of a target StateStore."""
        return cls(
            command_store=target._command_store,
            labware_store=target._labware_store,
            pipette_store=target._pipette_store,
            geometry_store=target._geometry_store,
            motion_store=target._motion_store,
        )

    @property
    def commands(self) -> CommandState:
        """Get commands sub-state."""
        return self._command_store.state

    @property
    def labware(self) -> LabwareState:
        """Get labware sub-state."""
        return self._labware_store.state

    @property
    def pipettes(self) -> PipetteState:
        """Get pipettes sub-state."""
        return self._pipette_store.state

    @property
    def geometry(self) -> GeometryState:
        """Get geometry sub-state."""
        return self._geometry_store.state

    @property
    def motion(self) -> MotionState:
        """Get motion sub-state."""
        return self._motion_store.state


class StateStore(StateView):
    """
    ProtocolEngine state store.

    A StateStore manages several substores, which will modify themselves in
    reaction to commands and other protocol events. Only Store classes should
    be allowed to modify State classes.
    """

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        deck_fixed_labware: Sequence[DeckFixedLabware],
    ) -> None:
        """Initialize a StateStore."""
        command_store = CommandStore()
        labware_store = LabwareStore(
            deck_fixed_labware=deck_fixed_labware
        )
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

        # attach stores to self via StateView constructor
        super().__init__(
            command_store=command_store,
            labware_store=labware_store,
            pipette_store=pipette_store,
            geometry_store=geometry_store,
            motion_store=motion_store
        )

        self._lifecycle_substores: List[CommandReactive] = [
            labware_store,
            pipette_store,
            geometry_store,
            motion_store,
        ]

    def handle_command(
        self,
        command: cmd.CommandType,
        command_id: str
    ) -> None:
        """Modify State in reaction to a Command."""
        self._command_store.handle_command(command, command_id)

        if isinstance(command, cmd.CompletedCommand):
            for substore in self._lifecycle_substores:
                substore.handle_completed_command(command)

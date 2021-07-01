"""Protocol engine state management."""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Sequence

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2

from .. import commands as cmd
from ..resources import DeckFixedLabware
from .substore import CommandReactive
from .commands import CommandState, CommandStore, CommandView
from .labware import LabwareState, LabwareStore, LabwareView
from .pipettes import PipetteState, PipetteStore, PipetteView
from .geometry import GeometryView
from .motion import MotionView


@dataclass(frozen=True)
class State:
    """Underlying engine state."""

    commands: CommandState
    labware: LabwareState
    pipettes: PipetteState


class StateStore:
    """ProtocolEngine state store.

    A StateStore manages several substores, which will modify themselves in
    reaction to commands and other protocol events. State instances inside
    stores should be treated as immutable.
    """

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        deck_fixed_labware: Sequence[DeckFixedLabware],
    ) -> None:
        """Initialize a StateStore and its substores."""
        self._command_store = CommandStore()
        self._pipette_store = PipetteStore()
        self._labware_store = LabwareStore(
            deck_fixed_labware=deck_fixed_labware,
            deck_definition=deck_definition,
        )

        self._lifecycle_substores: List[CommandReactive] = [
            self._command_store,
            self._pipette_store,
            self._labware_store,
        ]

        self._update_state()

    @property
    def state_view(self) -> StateView:
        """Get a read-only view of state-derived data."""
        return self._state_view

    def get_state(self) -> State:
        """Get an immutable copy of the current engine state."""
        return self._state

    def handle_command(self, command: cmd.Command) -> None:
        """Modify State in reaction to a Command."""
        for substore in self._lifecycle_substores:
            substore.handle_command(command)

        self._update_state()

    def _update_state(self) -> None:
        """Set state data and view interface to latest underlying values."""
        self._state = State(
            commands=self._command_store.state,
            labware=self._labware_store.state,
            pipettes=self._pipette_store.state,
        )
        self._state_view = StateView(state=self._state)


class StateView:
    """An interface that returns calculated and derived values from the state."""

    def __init__(self, state: State) -> None:
        """Initialize a StateView and its underlying subviews."""
        # Base states
        self._commands = CommandView(state.commands)
        self._labware = LabwareView(state.labware)
        self._pipettes = PipetteView(state.pipettes)

        # Derived states
        self._geometry = GeometryView(
            labware_view=self._labware,
        )
        self._motion = MotionView(
            labware_view=self._labware,
            pipette_view=self._pipettes,
            geometry_view=self._geometry,
        )

    @property
    def commands(self) -> CommandView:
        """Get state view selectors for commands state."""
        return self._commands

    @property
    def labware(self) -> LabwareView:
        """Get state view selectors for labware state."""
        return self._labware

    @property
    def pipettes(self) -> PipetteView:
        """Get state view selectors for pipette state."""
        return self._pipettes

    @property
    def geometry(self) -> GeometryView:
        """Get state view selectors for derived geometry state."""
        return self._geometry

    @property
    def motion(self) -> MotionView:
        """Get state view selectors for derived motion state."""
        return self._motion

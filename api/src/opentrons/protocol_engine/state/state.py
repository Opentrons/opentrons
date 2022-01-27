"""Protocol engine state management."""
from __future__ import annotations

from dataclasses import dataclass
from functools import partial
from typing import Any, Callable, List, Optional, Sequence, TypeVar

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2

from ..resources import DeckFixedLabware
from ..actions import Action, ActionHandler
from .abstract_store import HasState, HandlesActions
from .change_notifier import ChangeNotifier
from .commands import CommandState, CommandStore, CommandView
from .labware import LabwareState, LabwareStore, LabwareView
from .pipettes import PipetteState, PipetteStore, PipetteView
from .modules import ModuleState, ModuleStore, ModuleView
from .geometry import GeometryView
from .motion import MotionView
from .configs import EngineConfigs


ReturnT = TypeVar("ReturnT")


@dataclass(frozen=True)
class State:
    """Underlying engine state."""

    commands: CommandState
    labware: LabwareState
    pipettes: PipetteState
    modules: ModuleState


class StateView(HasState[State]):
    """A read-only view of computed state."""

    _state: State
    _commands: CommandView
    _labware: LabwareView
    _pipettes: PipetteView
    _modules: ModuleView
    _geometry: GeometryView
    _motion: MotionView
    _configs: EngineConfigs

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
    def modules(self) -> ModuleView:
        """Get state view selectors for hardware module state."""
        return self._modules

    @property
    def geometry(self) -> GeometryView:
        """Get state view selectors for derived geometry state."""
        return self._geometry

    @property
    def motion(self) -> MotionView:
        """Get state view selectors for derived motion state."""
        return self._motion

    # TODO (spp, 2021-10-19): make this a property once EngineConfigsView is added.
    def get_configs(self) -> EngineConfigs:
        """Get Protocol Engine configurations."""
        return self._configs


class StateStore(StateView, ActionHandler):
    """ProtocolEngine state store.

    A StateStore manages several substores, which will modify themselves in
    reaction to commands and other protocol events. State instances inside
    stores should be treated as immutable.
    """

    def __init__(
        self,
        deck_definition: DeckDefinitionV2,
        deck_fixed_labware: Sequence[DeckFixedLabware],
        is_door_blocking: bool,
        configs: EngineConfigs = EngineConfigs(),
        change_notifier: Optional[ChangeNotifier] = None,
    ) -> None:
        """Initialize a StateStore and its substores.

        Arguments:
            deck_definition: The deck definition to preload into
                labware state.
            deck_fixed_labware: Labware definitions from the deck
                definition to preload into labware state.
            is_door_blocking: Whether the robot's door state is blocking protocol run
            configs: Configurations for the engine.
            change_notifier: Internal state change notifier.
        """
        self._command_store = CommandStore(is_door_blocking)
        self._pipette_store = PipetteStore()
        self._labware_store = LabwareStore(
            deck_fixed_labware=deck_fixed_labware,
            deck_definition=deck_definition,
        )
        self._module_store = ModuleStore()

        self._substores: List[HandlesActions] = [
            self._command_store,
            self._pipette_store,
            self._labware_store,
            self._module_store,
        ]
        self._configs = configs
        self._change_notifier = change_notifier or ChangeNotifier()
        self._initialize_state()

    def handle_action(self, action: Action) -> None:
        """Modify State in reaction to an action.

        Arguments:
            action: An action object representing a state change. Will be
                passed to all substores so they can react accordingly.
        """
        for substore in self._substores:
            substore.handle_action(action)

        self._update_state_views()

    async def wait_for(
        self,
        condition: Callable[..., Optional[ReturnT]],
        *args: Any,
        **kwargs: Any,
    ) -> ReturnT:
        """Wait for a condition to become true, checking whenever state changes.

        !!! Warning:
            In general, callers should not trigger a state change via
            `handle_action` directly after a `wait_for`, as it may interfere
            with other subscribers. If you _must_ trigger a state change, ensure
            the change cannot affect the `condition`'s of other `wait_for`'s.

        Arguments:
            condition: A function that returns a truthy value when the `await`
                should resolve
            *args: Positional arguments to pass to `condition`
            **kwargs: Named arguments to pass to `condition`

        Returns:
            The truthy value returned by the `condition` function.
        """
        predicate = partial(condition, *args, **kwargs)
        is_done = predicate()

        while not is_done:
            await self._change_notifier.wait()
            is_done = predicate()

        return is_done

    def _get_next_state(self) -> State:
        """Get a new instance of the state value object."""
        return State(
            commands=self._command_store.state,
            labware=self._labware_store.state,
            pipettes=self._pipette_store.state,
            modules=self._module_store.state,
        )

    def _initialize_state(self) -> None:
        """Initialize state data and view."""
        state = self._get_next_state()

        # Base states
        self._state = state
        self._commands = CommandView(state.commands)
        self._labware = LabwareView(state.labware)
        self._pipettes = PipetteView(state.pipettes)
        self._modules = ModuleView(state.modules)

        # Derived states
        self._geometry = GeometryView(
            labware_view=self._labware,
            module_view=self._modules,
        )
        self._motion = MotionView(
            labware_view=self._labware,
            pipette_view=self._pipettes,
            geometry_view=self._geometry,
            module_view=self._modules,
        )

    def _update_state_views(self) -> None:
        """Update state view interfaces to use latest underlying values."""
        next_state = self._get_next_state()
        self._state = next_state
        self._commands._state = next_state.commands
        self._labware._state = next_state.labware
        self._pipettes._state = next_state.pipettes
        self._modules._state = next_state.modules
        self._change_notifier.notify()

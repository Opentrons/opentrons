"""Protocol engine state management."""
from __future__ import annotations

from dataclasses import dataclass
from functools import partial
from typing import Any, Callable, Dict, List, Optional, Sequence, TypeVar

from opentrons_shared_data.deck.dev_types import DeckDefinitionV3

from opentrons.protocol_engine.types import ModuleOffsetData
from opentrons.util.broker import ReadOnlyBroker

from ..resources import DeckFixedLabware
from ..actions import Action, ActionHandler
from .abstract_store import HasState, HandlesActions
from .change_notifier import ChangeNotifier
from .commands import CommandState, CommandStore, CommandView
from .labware import LabwareState, LabwareStore, LabwareView
from .pipettes import PipetteState, PipetteStore, PipetteView
from .modules import ModuleState, ModuleStore, ModuleView
from .liquids import LiquidState, LiquidView, LiquidStore
from .tips import TipState, TipView, TipStore
from .geometry import GeometryView
from .motion import MotionView
from .config import Config
from .state_summary import StateSummary

ReturnT = TypeVar("ReturnT")


@dataclass(frozen=True)
class State:
    """Underlying engine state."""

    commands: CommandState
    labware: LabwareState
    pipettes: PipetteState
    modules: ModuleState
    liquids: LiquidState
    tips: TipState


class StateView(HasState[State]):
    """A read-only view of computed state."""

    _state: State
    _commands: CommandView
    _labware: LabwareView
    _pipettes: PipetteView
    _modules: ModuleView
    _liquid: LiquidView
    _tips: TipView
    _geometry: GeometryView
    _motion: MotionView
    _config: Config

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
    def liquid(self) -> LiquidView:
        """Get state view selectors for liquid state."""
        return self._liquid

    @property
    def tips(self) -> TipView:
        """Get state view selectors for tip state."""
        return self._tips

    @property
    def geometry(self) -> GeometryView:
        """Get state view selectors for derived geometry state."""
        return self._geometry

    @property
    def motion(self) -> MotionView:
        """Get state view selectors for derived motion state."""
        return self._motion

    @property
    def config(self) -> Config:
        """Get ProtocolEngine configuration."""
        return self._config

    def get_summary(self) -> StateSummary:
        """Get protocol run data."""
        error = self._commands.get_error()
        return StateSummary.construct(
            status=self._commands.get_status(),
            errors=[] if error is None else [error],
            pipettes=self._pipettes.get_all(),
            labware=self._labware.get_all(),
            labwareOffsets=self._labware.get_labware_offsets(),
            modules=self._modules.get_all(),
            completedAt=self._state.commands.run_completed_at,
            startedAt=self._state.commands.run_started_at,
            liquids=self._liquid.get_all(),
        )


class StateStore(StateView, ActionHandler):
    """ProtocolEngine state store.

    A StateStore manages several substores, which will modify themselves in
    reaction to commands and other protocol events. State instances inside
    stores should be treated as immutable.
    """

    def __init__(
        self,
        *,
        config: Config,
        deck_definition: DeckDefinitionV3,
        deck_fixed_labware: Sequence[DeckFixedLabware],
        is_door_open: bool,
        change_notifier: Optional[ChangeNotifier] = None,
        module_calibration_offsets: Optional[Dict[str, ModuleOffsetData]] = None,
    ) -> None:
        """Initialize a StateStore and its substores.

        Arguments:
            config: Top-level configuration.
            deck_definition: The deck definition to preload into
                labware state.
            deck_fixed_labware: Labware definitions from the deck
                definition to preload into labware state.
            is_door_open: Whether the robot's door is currently open.
            change_notifier: Internal state change notifier.
            module_calibration_offsets: Module offsets to preload.
        """
        self._command_store = CommandStore(config=config, is_door_open=is_door_open)
        self._pipette_store = PipetteStore()
        self._labware_store = LabwareStore(
            deck_fixed_labware=deck_fixed_labware,
            deck_definition=deck_definition,
        )
        self._module_store = ModuleStore(
            module_calibration_offsets=module_calibration_offsets
        )
        self._liquid_store = LiquidStore()
        self._tip_store = TipStore()

        self._substores: List[HandlesActions] = [
            self._command_store,
            self._pipette_store,
            self._labware_store,
            self._module_store,
            self._liquid_store,
            self._tip_store,
        ]
        self._config = config
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

        If the condition is already true, return immediately.

        !!! Warning:
            This will only return when `condition` is true right now.
            If you're not careful, this can cause you to miss updates,
            and potentially wait forever.

            For example, suppose:

            1. Things start out in state A.
            2. You start waiting specifically for state B.
            3. State transitions A -> B.
               Your task could theoretically run now,
               but the event loop decides not to do that.
            4. State transitions B -> C.
            5. The event loop decides to run your task now.
               But this method will only return when the state is B,
               which it isn't now, so your task will stay waiting indefinitely.

            To fix this, design your `condition` to look for something that,
            after it first becomes true, remains true forever. For example,
            suppose you want to wait for the engine to reach a specific command.
            Don't use a `condition` that checks if that command is running now.
            Instead, use a `condition` that checks if it ever has been running.

            If this isn't possible, then you need other means to ensure that
            no other task can transition the state out of the condition that you
            care about until after you've had a chance to operate on the state
            while it's in that condition.

        Arguments:
            condition: A function that returns a truthy value when the `await`
                should resolve.
            *args: Positional arguments to pass to `condition`.
            **kwargs: Named arguments to pass to `condition`.

        Returns:
            The truthy value returned by the `condition` function.

        Raises:
            The exception raised by the `condition` function, if any.
        """
        predicate = partial(condition, *args, **kwargs)
        is_done = predicate()

        while not is_done:
            await self._change_notifier.wait()
            is_done = predicate()

        return is_done

    # We return ReadOnlyBroker[None] instead of ReadOnlyBroker[StateView] in order to avoid
    # confusion with state mutability. If a caller needs to know the new state, they can
    # retrieve it explicitly with `ProtocolEngine.state_view`.
    @property
    def update_broker(self) -> ReadOnlyBroker[None]:
        """Return a broker that you can use to get notified of all state updates.

        This is an alternative interface to `wait_for()`.
        """
        return self._change_notifier.broker

    def _get_next_state(self) -> State:
        """Get a new instance of the state value object."""
        return State(
            commands=self._command_store.state,
            labware=self._labware_store.state,
            pipettes=self._pipette_store.state,
            modules=self._module_store.state,
            liquids=self._liquid_store.state,
            tips=self._tip_store.state,
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
        self._liquid = LiquidView(state.liquids)
        self._tips = TipView(state.tips)

        # Derived states
        self._geometry = GeometryView(
            config=self._config,
            labware_view=self._labware,
            module_view=self._modules,
            pipette_view=self._pipettes,
        )
        self._motion = MotionView(
            config=self._config,
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
        self._liquid._state = next_state.liquids
        self._tips._state = next_state.tips
        self._change_notifier.notify()

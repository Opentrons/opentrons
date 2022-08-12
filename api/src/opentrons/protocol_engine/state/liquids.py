"""Basic liquid data state and store."""
from dataclasses import dataclass
from typing import List
from opentrons.protocol_engine.commands.load_liquid import Liquid

from .abstract_store import HasState, HandlesActions
from ..actions import Action, AddLiquidAction


@dataclass
class LiquidState:
    """State of all loaded liquids."""

    liquids: List[Liquid]


class LiquidStore(HasState[LiquidState], HandlesActions):
    """Liquid state container."""

    _state: LiquidState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = LiquidState(liquids=[])

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, AddLiquidAction):
            self.add_liquid(action)

    def add_liquid(self, action: AddLiquidAction) -> None:
        """Add liquid to protocol liquids."""
        self._state.liquids.append(action.liquid)


class LiquidView(HasState[LiquidState]):
    """Read-only labware state view."""

    _state: LiquidState

    def __init__(self, state: LiquidState) -> None:
        """Initialize the computed view of liquid state.

        Arguments:
            state: Labware state dataclass used for all calculations.
        """
        self._state = state

    def get_all(self) -> List[Liquid]:
        """Get all protocol liquids."""
        return self._state.liquids

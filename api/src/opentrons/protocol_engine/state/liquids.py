"""Basic liquid data state and store."""
from dataclasses import dataclass
from typing import Dict, List
from opentrons.protocol_engine.types import Liquid

from .abstract_store import HasState, HandlesActions
from ..actions import Action, AddLiquidAction


@dataclass
class LiquidState:
    """State of all loaded liquids."""

    liquids_by_id: Dict[str, Liquid]


class LiquidStore(HasState[LiquidState], HandlesActions):
    """Liquid state container."""

    _state: LiquidState

    def __init__(self) -> None:
        """Initialize a liquid store and its state."""
        self._state = LiquidState(liquids_by_id={})

    def handle_action(self, action: Action) -> None:
        """Modify state in reaction to an action."""
        if isinstance(action, AddLiquidAction):
            self._add_liquid(action)

    def _add_liquid(self, action: AddLiquidAction) -> None:
        """Add liquid to protocol liquids."""
        self._state.liquids_by_id[action.liquid.id] = action.liquid


class LiquidView(HasState[LiquidState]):
    """Read-only liquid state view."""

    _state: LiquidState

    def __init__(self, state: LiquidState) -> None:
        """Initialize the computed view of liquid state.

        Arguments:
            state: Liquid state dataclass used for all calculations.
        """
        self._state = state

    def get_all(self) -> List[Liquid]:
        """Get all protocol liquids."""
        return list(self._state.liquids_by_id.values())

    def has(self, liquid_id: str) -> bool:
        """Check if liquid_id exists in liquids."""
        return any(liquid.id == liquid_id for liquid in self.get_all())

"""Heater-Shaker Module sub-state."""
from dataclasses import dataclass
from typing import Dict, List
from opentrons.protocol_engine.commands.load_liquid import Liquid


@dataclass(frozen=True)
class LiquidsLabwareSubState:
    """Liquids state."""

    # Indexed by liquidId.
    liquids_by_id: Dict[str, Liquid]

    def get_liquids(self) -> List[Liquid]:
        """Get all protocol liquids."""
        return list(self.liquids_by_id.values())

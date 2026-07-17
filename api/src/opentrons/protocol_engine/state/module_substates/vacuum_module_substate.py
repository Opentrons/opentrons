"""Vacuum Module substate."""

from dataclasses import dataclass
from typing import NewType, Optional

from opentrons.protocol_engine.state.update_types import (
    VacuumModuleStateUpdate,
)

VacuumModuleId = NewType("VacuumModuleId", str)


@dataclass(frozen=True)
class VacuumModuleSubState:
    """Vacuum Module-specific state.

    Provides calculations and read-only state access
    for an individual loaded Vacuum Module.
    """

    module_id: VacuumModuleId
    pump_engaged: bool
    target_pressure: Optional[float] = None

    def new_from_state_change(
        self, update: VacuumModuleStateUpdate
    ) -> "VacuumModuleSubState":
        """Return a new state with the given update applied."""
        new_pump_engaged = self.pump_engaged
        if isinstance(update.pump_engaged, bool):
            new_pump_engaged = update.pump_engaged
        return VacuumModuleSubState(
            module_id=self.module_id,
            pump_engaged=new_pump_engaged,
        )

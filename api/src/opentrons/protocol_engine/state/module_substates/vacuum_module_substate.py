"""Vacuum Module substate."""

from dataclasses import dataclass
from typing import NewType, Optional

from opentrons.protocol_engine.state.update_types import (
    NO_CHANGE,
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
    residual_vacuum: bool = False
    target_pressure: Optional[float] = None

    def new_from_state_change(
        self, update: VacuumModuleStateUpdate
    ) -> "VacuumModuleSubState":
        """Return a new state with the given update applied."""
        new_pump_engaged = self.pump_engaged
        if isinstance(update.pump_engaged, bool):
            new_pump_engaged = update.pump_engaged

        new_residual_vacuum = self.residual_vacuum
        if isinstance(update.residual_vacuum, bool):
            new_residual_vacuum = update.residual_vacuum

        new_target_pressure = self.target_pressure
        if update.target_pressure != NO_CHANGE:
            new_target_pressure = update.target_pressure

        return VacuumModuleSubState(
            module_id=self.module_id,
            pump_engaged=new_pump_engaged,
            residual_vacuum=new_residual_vacuum,
            target_pressure=new_target_pressure,
        )

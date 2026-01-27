"""Vacuum Module substate."""

from dataclasses import dataclass
from typing import NewType

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

    def new_from_state_change(
        self, update: VacuumModuleStateUpdate
    ) -> "VacuumModuleSubState":
        """Return a new state with the given update applied."""

        return VacuumModuleSubState(
            module_id=self.module_id,
        )

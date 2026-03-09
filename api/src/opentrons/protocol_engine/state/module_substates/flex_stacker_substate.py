"""Flex Stacker substate."""

from dataclasses import dataclass
from typing import NewType
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocol_engine.types.module import (
    StackerStoredLabwareGroup,
    StackerPoolDefinition,
)
from opentrons.protocol_engine.state.update_types import (
    FlexStackerStateUpdate,
    NO_CHANGE,
)


FlexStackerId = NewType("FlexStackerId", str)


@dataclass(frozen=True)
class FlexStackerSubState:
    """Flex Stacker-specific state.

    Provides calculations and read-only state access
    for an individual loaded Flex Stacker Module.
    """

    module_id: FlexStackerId
    pool_primary_definition: LabwareDefinition | None
    pool_adapter_definition: LabwareDefinition | None
    pool_lid_definition: LabwareDefinition | None
    max_pool_count: int
    pool_height: float
    pool_overlap: float
    contained_labware_bottom_first: list[StackerStoredLabwareGroup]

    def new_from_state_change(
        self, update: FlexStackerStateUpdate
    ) -> "FlexStackerSubState":
        """Return a new state with the given update applied."""
        pool_primary_definition = self.pool_primary_definition
        pool_adapter_definition = self.pool_adapter_definition
        pool_lid_definition = self.pool_lid_definition
        max_pool_count = self.max_pool_count
        pool_overlap = self.pool_overlap
        pool_height = self.pool_height
        if update.pool_constraint != NO_CHANGE:
            max_pool_count = update.pool_constraint.max_pool_count
            pool_primary_definition = update.pool_constraint.primary_definition
            pool_adapter_definition = update.pool_constraint.adapter_definition
            pool_lid_definition = update.pool_constraint.lid_definition
            pool_overlap = update.pool_constraint.pool_overlap
            pool_height = update.pool_constraint.pool_height

        contained_labware = self.contained_labware_bottom_first

        if update.contained_labware_bottom_first != NO_CHANGE:
            contained_labware = update.contained_labware_bottom_first

        return FlexStackerSubState(
            module_id=self.module_id,
            pool_primary_definition=pool_primary_definition,
            pool_adapter_definition=pool_adapter_definition,
            pool_lid_definition=pool_lid_definition,
            contained_labware_bottom_first=contained_labware,
            max_pool_count=max_pool_count,
            pool_overlap=pool_overlap,
            pool_height=pool_height,
        )

    def get_pool_definition_ordered_list(self) -> list[LabwareDefinition] | None:
        """Get the pool definitions in a list suitable for getting the height."""
        if not self.pool_primary_definition:
            return None

        defs: list[LabwareDefinition] = []
        if self.pool_lid_definition is not None:
            defs.append(self.pool_lid_definition)
        defs.append(self.pool_primary_definition)
        if self.pool_adapter_definition is not None:
            defs.append(self.pool_adapter_definition)
        return defs

    def get_pool_height_minus_overlap(self) -> float:
        """Get the height used in dispense/store action."""
        return self.pool_height - self.pool_overlap

    def get_contained_labware(self) -> list[StackerStoredLabwareGroup]:
        """Get the labware inside the hopper."""
        return self.contained_labware_bottom_first

    def get_max_pool_count(self) -> int | None:
        """Get the maximum number of currently-configured labware.

        If the stacker has not been configured, return None.
        """
        if not self.pool_primary_definition:
            return None
        return self.max_pool_count

    def get_pool_overlap(self) -> float:
        """Get the overlap of the currently-configured labware."""
        return self.pool_overlap

    def get_pool_definition(self) -> StackerPoolDefinition | None:
        """Get the labware definitions of the stacker pool."""
        if not self.pool_primary_definition:
            return None
        return StackerPoolDefinition(
            primaryLabwareDefinition=self.pool_primary_definition,
            adapterLabwareDefinition=self.pool_adapter_definition,
            lidLabwareDefinition=self.pool_lid_definition,
        )

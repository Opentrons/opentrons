"""Module containing labware interface that works with Protocol Engine."""
from functools import lru_cache
from typing import Dict, List

from opentrons.protocol_engine import StateView
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.implementations.tip_tracker import TipTracker
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.well_grid import WellGrid
from opentrons.types import Point, Location
from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition, LabwareParameters
)
from opentrons.protocols.implementations.interfaces.labware\
    import LabwareInterface


class LabwareContext(LabwareInterface):
    """LabwareInterface implementation that works with the Protocol Engine."""

    def __init__(self, labware_id: str, state_view: StateView, parent: Location):
        """Construct"""
        self._id = labware_id
        self._state_view = state_view
        self._parent = parent

    def get_uri(self) -> str:
        """Get the labware uri."""
        return self._state_view.labware.get_definition_uri(labware_id=self._id)

    def get_display_name(self) -> str:
        """Get the display name."""
        lw = self._state_view.labware.get_labware_data_by_id(labware_id=self._id)
        # TODO AL 20210225 - this is not consistent with reference
        #  implementation. It is either the supplied label or displayName in
        #  definition on the location, which is either a slot or module.
        return f"{lw.definition['metadata']['displayName']} on {lw.location.slot}"

    def get_name(self) -> str:
        """Get the name."""
        # TODO AL 20210225 - this is not consistent with reference
        #  implementation. It is either the supplied label or loadName in
        #  definition.
        return self._state_view.labware.get_load_name(labware_id=self._id)

    def set_name(self, new_name: str) -> None:
        # TODO AL 2020304 - Is Labware.name setter necessary?
        raise NotImplementedError()

    def get_definition(self) -> LabwareDefinition:
        """Get the labware definition."""
        return self._state_view.labware.get_labware_data_by_id(
            labware_id=self._id).definition

    def get_parameters(self) -> LabwareParameters:
        """Get the labware definition parameters."""
        return self.get_definition()['parameters']

    def get_quirks(self) -> List[str]:
        """Get the labware quirks."""
        return self._state_view.labware.get_quirks(labware_id=self._id)

    def set_calibration(self, delta: Point) -> None:
        # TODO AL 2020304 - Is this only here to support labware
        #  calibration over RPC
        raise NotImplementedError()

    def get_calibrated_offset(self) -> Point:
        """Get the calibrated offset."""
        x, y, z = self._state_view.labware.get_labware_data_by_id(
            labware_id=self._id).calibration
        return Point(x=x, y=y, z=z) + self.get_geometry().offset

    def is_tiprack(self) -> bool:
        """Return whether this labware is a tiprack."""
        return self._state_view.labware.is_tiprack(labware_id=self._id)

    def get_tip_length(self) -> float:
        """Get the tip length."""
        return self._state_view.labware.get_tip_length(labware_id=self._id)

    def set_tip_length(self, length: float):
        # TODO AL 2020304 - Is Labware.tip_length setter necessary?
        raise NotImplementedError()

    def reset_tips(self) -> None:
        # TODO AL 2020304 - Tip tracking should only happen within
        #  protocol engine's command processing
        raise NotImplementedError()

    @lru_cache(maxsize=1)
    def get_tip_tracker(self) -> TipTracker:
        """Returns a tip tracker."""
        return TipTracker(columns=self.get_well_grid().get_columns())

    @lru_cache(maxsize=1)
    def get_well_grid(self) -> WellGrid:
        """Returns a well grid."""
        return WellGrid(self.get_wells())

    @lru_cache(maxsize=1)
    def get_wells(self) -> List[WellImplementation]:
        """Return a list of wells."""
        return self._build_wells()

    @lru_cache(maxsize=1)
    def get_wells_by_name(self) -> Dict[str, WellImplementation]:
        """Get a dictionary of wells by name."""
        return {well.get_name(): well for well in self.get_wells()}

    @lru_cache(maxsize=1)
    def get_geometry(self) -> LabwareGeometry:
        """Return LabwareGeometry"""
        return LabwareGeometry(
            definition=self.get_definition(),
            parent=self._parent
        )

    @property
    def highest_z(self) -> float:
        return self._state_view.geometry.get_labware_highest_z(labware_id=self._id)

    @property
    def separate_calibration(self) -> bool:
        # TODO AL 20210304 What does this mean? It is used in
        #  opentrons.protocols.labware.definition._get_parent_identifier to
        #  indicate that a DeckItem is a module?
        #  ModuleGeometry.separate_calibration returns True.
        return False

    @property
    def load_name(self) -> str:
        """Get the load name."""
        return self._state_view.labware.get_load_name(labware_id=self._id)

    def _build_wells(self) -> List[WellImplementation]:
        """Create well objects."""
        definition = self.get_definition()
        flat_wells = (well for column in definition['ordering'] for well in column)
        return [
            WellImplementation(
                well_geometry=WellGeometry(
                    well_props=definition['wells'][well_name],
                    parent_point=self.get_calibrated_offset(),
                    parent_object=self
                ),
                display_name=f"{well_name} of {self.get_display_name()}",
                name=well_name,
                has_tip=self.is_tiprack()
            )
            for well_name in flat_wells
        ]

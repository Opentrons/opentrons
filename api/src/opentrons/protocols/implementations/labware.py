from typing import List, Sequence

from opentrons.calibration_storage import helpers
from opentrons.protocols.geometry.deck_item import DeckItem
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.implementations.interfaces.labware import \
    AbstractLabwareImplementation
from opentrons.protocols.implementations.tip_tracker import TipTracker
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.well_grid import WellGrid
from opentrons.types import Point, LocationLabware, Location
from opentrons_shared_data.labware.dev_types import LabwareParameters, \
    LabwareDefinition


class LabwareImplementation(AbstractLabwareImplementation):

    def __init__(self,
                 definition: LabwareDefinition,
                 parent: Location,
                 label: str = None):
        """Construct an implementation of a labware object"""
        if label:
            dn = label
            self._name = dn
        else:
            dn = definition['metadata']['displayName']
            self._name = definition['parameters']['loadName']

        self._display_name = f"{dn} on {str(parent.labware)}"
        # Directly from definition
        self._well_definition = definition['wells']
        self._parameters = definition['parameters']
        self._definition = definition

        self._geometry = LabwareGeometry(definition, parent)
        self._ordering = [well
                          for col in definition['ordering']
                          for well in col]

        self._calibrated_offset: Point = Point(0, 0, 0)
        self._wells: Sequence[WellImplementation] = self._build_wells()
        self._well_name_grid = WellGrid(well_names=self._ordering,
                                        well_objects=self._wells)
        self._tip_tracker = TipTracker(
            columns=self._well_name_grid.get_columns()
        )

    def get_uri(self) -> str:
        return helpers.uri_from_definition(self._definition)

    def get_name(self) -> str:
        return self._name

    def set_name(self, new_name: str) -> None:
        self._name = new_name

    def get_parameters(self) -> LabwareParameters:
        return self._parameters

    def get_quirks(self) -> List[str]:
        return self._parameters.get('quirks', [])

    def set_calibration(self, delta: Point) -> None:
        self._calibrated_offset = Point(x=self._geometry.x_dimension + delta.x,
                                        y=self._geometry.y_dimension + delta.y,
                                        z=self._geometry.z_dimension + delta.z)

    def get_calibrated_offset(self) -> Point:
        return self._calibrated_offset

    def is_tiprack(self) -> bool:
        return self._parameters['isTiprack']

    def get_tip_length(self) -> float:
        return self._parameters['tipLength']

    def set_tip_length(self, length: float):
        self._parameters['tipLength'] = length

    def reset_tips(self) -> None:
        if self.is_tiprack():
            for well in self._wells:
                well.has_tip = True

    def get_tip_tracker(self) -> TipTracker:
        return self._tip_tracker

    def get_well_grid(self) -> WellGrid:
        return self._well_name_grid

    def get_geometry(self) -> LabwareGeometry:
        return self._geometry

    @property
    def highest_z(self):
        return self._geometry.z_dimension + self._calibrated_offset.z

    @property
    def separate_calibration(self) -> bool:
        return False

    @property
    def load_name(self) -> str:
        return self._parameters['loadName']

    def _build_wells(self) -> Sequence[WellImplementation]:
        return [
            WellImplementation(
                well_geometry=WellGeometry(
                    well_props=self._well_definition[well],
                    parent=Location(self._calibrated_offset, self)
                ),
                display_name="{} of {}".format(well, self._display_name),
                has_tip=self.is_tiprack(),
                name=well
            )
            for well in self._ordering
        ]

from typing import List, Dict, Optional

from opentrons.calibration_storage import helpers
from opentrons.protocols.geometry.labware_geometry import LabwareGeometry
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker

from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.types import Point, Location
from opentrons_shared_data.labware.dev_types import LabwareParameters, LabwareDefinition

from ..labware import AbstractLabware, LabwareLoadParams
from .well import WellImplementation


# URIs of labware whose definitions accidentally specify an engage height
# in units of half-millimeters instead of millimeters.
_MAGDECK_HALF_MM_LABWARE = {
    "opentrons/biorad_96_wellplate_200ul_pcr/1",
    "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1",
    "opentrons/usascientific_96_wellplate_2.4ml_deep/1",
}


class LabwareImplementation(AbstractLabware[WellImplementation]):
    """Labware implementation core based on legacy PAPIv2 behavior.

    Args:
        definition: The labware definition, as a dict.
        parent: The location of the labware's origin point.
            A labware's origin is its front and left most corner.
            Usually a slot or a module location.
        label: Optional display label.
    """

    def __init__(
        self,
        definition: LabwareDefinition,
        parent: Location,
        label: Optional[str] = None,
    ) -> None:
        self._label: Optional[str] = None
        if label:
            dn = self._label = label
            self._name = dn
        else:
            dn = definition["metadata"]["displayName"]
            self._name = definition["parameters"]["loadName"]

        self._display_name = f"{dn} on {str(parent.labware)}"
        # Directly from definition
        self._well_definition = definition["wells"]
        self._parameters = definition["parameters"]
        self._definition = definition

        self._geometry = LabwareGeometry(definition, parent)
        # flatten list of list of well names.
        self._ordering = [well for col in definition["ordering"] for well in col]
        self._wells: List[WellImplementation] = []
        self._well_name_grid = WellGrid(wells=self._wells)
        self._tip_tracker = TipTracker(columns=self._well_name_grid.get_columns())

        self._calibrated_offset = Point(0, 0, 0)
        # Will cause building of the wells
        self.set_calibration(self._calibrated_offset)

    def get_uri(self) -> str:
        return helpers.uri_from_definition(self._definition)

    def get_load_params(self) -> LabwareLoadParams:
        return LabwareLoadParams(
            namespace=self._definition["namespace"],
            load_name=self._definition["parameters"]["loadName"],
            version=self._definition["version"],
        )

    def get_display_name(self) -> str:
        return self._display_name

    def get_user_display_name(self) -> Optional[str]:
        return self._label

    def get_name(self) -> str:
        return self._name

    def set_name(self, new_name: str) -> None:
        self._name = new_name

    def get_definition(self) -> LabwareDefinition:
        return self._definition

    def get_parameters(self) -> LabwareParameters:
        return self._parameters

    def get_quirks(self) -> List[str]:
        return self._parameters.get("quirks", [])

    def set_calibration(self, delta: Point) -> None:
        self._calibrated_offset = Point(
            x=self._geometry.offset.x + delta.x,
            y=self._geometry.offset.y + delta.y,
            z=self._geometry.offset.z + delta.z,
        )
        # The wells must be rebuilt
        self._wells = self._build_wells()
        self._well_name_grid = WellGrid(wells=self._wells)
        self._tip_tracker = TipTracker(columns=self._well_name_grid.get_columns())

    def get_calibrated_offset(self) -> Point:
        return self._calibrated_offset

    def is_tiprack(self) -> bool:
        return self._parameters["isTiprack"]

    def get_tip_length(self) -> float:
        return self._parameters["tipLength"]

    def set_tip_length(self, length: float) -> None:
        self._parameters["tipLength"] = length

    def reset_tips(self) -> None:
        if self.is_tiprack():
            for well in self._wells:
                well.set_has_tip(True)

    def get_tip_tracker(self) -> TipTracker:
        return self._tip_tracker

    def get_well_grid(self) -> WellGrid:
        return self._well_name_grid

    def get_wells(self) -> List[WellImplementation]:
        return self._wells

    def get_wells_by_name(self) -> Dict[str, WellImplementation]:
        return {well.get_name(): well for well in self._wells}

    def get_geometry(self) -> LabwareGeometry:
        return self._geometry

    @property
    def highest_z(self) -> float:
        return self._geometry.z_dimension + self._calibrated_offset.z

    @property
    def separate_calibration(self) -> bool:
        return False

    @property
    def load_name(self) -> str:
        return self._parameters["loadName"]

    # TODO(mc, 2022-09-26): codify "from labware's base" in defintion schema
    # https://opentrons.atlassian.net/browse/RSS-110
    def get_default_magnet_engage_height(
        self, preserve_half_mm: bool = False
    ) -> Optional[float]:
        """Get the labware's default magnet engage height, if defined.

        Value returned is in real millimeters from the labware's base,
        unless `preserve_half_mm` is used, in which case
        some definitions will return half-millimeters.
        """
        is_compatible = self._parameters.get("isMagneticModuleCompatible", False)
        default_engage_height = self._parameters.get("magneticModuleEngageHeight")

        if not is_compatible or default_engage_height is None:
            return None

        if self.get_uri() in _MAGDECK_HALF_MM_LABWARE and not preserve_half_mm:
            # TODO(mc, 2022-09-26): this value likely _also_ needs a few mm subtracted
            # https://opentrons.atlassian.net/browse/RSS-111
            return default_engage_height / 2.0

        return default_engage_height

    def _build_wells(self) -> List[WellImplementation]:
        return [
            WellImplementation(
                well_geometry=WellGeometry(
                    well_props=self._well_definition[well],
                    parent_point=self._calibrated_offset,
                    parent_object=self,
                ),
                display_name="{} of {}".format(well, self._display_name),
                has_tip=self.is_tiprack(),
                name=well,
            )
            for well in self._ordering
        ]

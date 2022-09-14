from typing import Tuple

from opentrons.types import Location
from opentrons.protocol_engine.types import WellLocation

from .labware import LabwareCore


def resolve_move_to_well_args(location: Location) -> Tuple[str, str, WellLocation]:
    """Resolve labware id, well name and protocol engine WellLocation from Location object."""
    labware, well = location.labware.get_parent_labware_and_well()
    if labware is None or well is None:
        raise TypeError()
    assert isinstance(labware._implementation, LabwareCore)

    labware_impl: LabwareCore = labware._implementation
    labware_id = labware_impl.labware_id
    well_name = well.well_name
    # TODO(jbl 2022-09-13) when well geometry is resolved, return with non default offset
    well_location = WellLocation()
    return labware_id, well_name, well_location

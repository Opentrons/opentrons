import typing
from opentrons.protocol_api import labware
from opentrons.protocol_api.core.protocol_api.labware import LabwareImplementation
from opentrons.types import Point, Location

if typing.TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


def test_wells_rebuilt_with_offset(minimal_labware_def: "LabwareDefinition") -> None:
    test_labware = labware.Labware(
        implementation=LabwareImplementation(
            minimal_labware_def, Location(Point(0, 0, 0), "deck")
        )
    )
    old_wells = test_labware.wells()
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(10, 10, 5)
    test_labware.set_offset(x=2, y=2, z=2)
    new_wells = test_labware.wells()
    assert old_wells[0] != new_wells[0]
    assert test_labware._implementation.get_geometry().offset == Point(10, 10, 5)
    assert test_labware._implementation.get_calibrated_offset() == Point(12, 12, 7)

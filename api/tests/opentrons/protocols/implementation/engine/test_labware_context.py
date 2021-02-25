import pytest

from opentrons.protocols.implementations.engine.labware_context import \
    LabwareContext
from opentrons.types import Point


@pytest.fixture
def labware_context() -> LabwareContext:
    return LabwareContext()


def test_get_uri(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_uri()


def test_get_display_name(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_display_name()


def test_get_name(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_name()


def test_set_name(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        name = "some_name"
        labware_context.set_name(name)


def test_get_definition(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_definition()


def test_get_parameters(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_parameters()


def test_get_quirks(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_quirks()


def test_set_calibration(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        point = Point(1, 2, 3)
        labware_context.set_calibration(point)


def test_get_calibrated_offset(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_calibrated_offset()


def test_is_tiprack(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.is_tiprack()


def test_get_tip_length(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_tip_length()


def test_set_tip_length(labware_context: LabwareContext):
    with pytest.raises(NotImplementedError):
        length = 1.2
        labware_context.set_tip_length(length)


def test_reset_tips(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.reset_tips()


def test_get_tip_tracker(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_tip_tracker()


def test_get_well_grid(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_well_grid()


def test_get_wells(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_wells()


def test_get_wells_by_name(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_wells_by_name()


def test_get_geometry(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        labware_context.get_geometry()


def test_highest_z(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        h = labware_context.highest_z


def test_separate_calibration(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        s = labware_context.separate_calibration


def test_load_name(labware_context: LabwareContext) -> None:
    with pytest.raises(NotImplementedError):
        ln = labware_context.load_name

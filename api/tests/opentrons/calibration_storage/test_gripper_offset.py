import pytest
import typing

from opentrons.types import Point
from opentrons.calibration_storage import (
    types as cs_types,
    ot3_gripper_offset as gripper,
    ot3_schemas as schema,
)


@pytest.fixture
def starting_calibration_data(ot_config_tempdir: typing.Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    gripper.save_gripper_calibration(Point(1, 1, 1), cs_types.GripperId("gripper1"))


def test_delete_all_gripper_calibration(starting_calibration_data: typing.Any) -> None:
    """
    Test delete all gripper calibrations.
    """
    assert gripper._gripper_offset_calibrations() != {}
    gripper.clear_gripper_calibration_offsets()
    assert gripper._gripper_offset_calibrations() == {}


def test_delete_gripper_calibration(starting_calibration_data: typing.Any) -> None:
    """
    Test delete a single gripper calibration.
    """
    assert gripper._gripper_offset_calibrations() != {}
    gripper.delete_gripper_calibration_file(cs_types.GripperId("gripper1"))
    assert gripper._gripper_offset_calibrations() == {}


def test_save_gripper_calibration(ot_config_tempdir: typing.Any) -> None:
    """
    Test saving gripper calibrations.
    """
    assert gripper._gripper_offset_calibrations() == {}
    gripper.save_gripper_calibration(Point(1, 1, 1), cs_types.GripperId("gripper1"))
    assert gripper._gripper_offset_calibrations() != {}
    assert gripper._gripper_offset_calibrations()[
        cs_types.GripperId("gripper1")
    ].offset == Point(1, 1, 1)


def test_get_gripper_calibration(
    starting_calibration_data: typing.Any,
    enable_ot3_hardware_controller: typing.Any,
) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    gripper_data = gripper.get_gripper_calibration_offset(
        cs_types.GripperId("gripper1")
    )
    assert gripper_data is not None
    assert gripper_data == schema.v1.InstrumentOffsetSchema(
        offset=Point(1, 1, 1),
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )

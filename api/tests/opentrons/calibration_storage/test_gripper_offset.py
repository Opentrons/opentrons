import typing

import pytest

from opentrons.calibration_storage import (
    types as cs_types,
)
from opentrons.calibration_storage.ot3 import gripper_offset as gripper
from opentrons.calibration_storage.ot3 import models
from opentrons.types import Point


@pytest.fixture
def starting_calibration_data(
    ot_config_tempdir: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    gripper.save_gripper_calibration(Point(1, 1, 1), "gripper1")
    gripper.save_gripper_calibration(Point(1, 2, 1), "gripper2")
    gripper.save_gripper_jaw_width_data(15.5, "gripper1")
    gripper.save_gripper_jaw_width_data(15.5, "gripper2")


def test_delete_all_gripper_calibration(starting_calibration_data: typing.Any) -> None:
    """
    Test delete all gripper calibrations.
    """
    assert gripper.get_gripper_calibration_offset("gripper1") is not None
    assert gripper.get_gripper_calibration_offset("gripper2") is not None
    assert gripper.get_gripper_jaw_width_data("gripper1") is not None
    assert gripper.get_gripper_jaw_width_data("gripper2") is not None
    gripper.clear_gripper_calibration_offsets()
    gripper.clear_gripper_jaw_width_data()
    assert gripper.get_gripper_calibration_offset("gripper1") is None
    assert gripper.get_gripper_calibration_offset("gripper2") is None
    assert gripper.get_gripper_jaw_width_data("gripper1") is None
    assert gripper.get_gripper_jaw_width_data("gripper2") is None


def test_delete_gripper_calibration(starting_calibration_data: typing.Any) -> None:
    """
    Test delete a single gripper calibration.
    """
    assert gripper.get_gripper_calibration_offset("gripper1") is not None
    gripper.delete_gripper_calibration_file("gripper1")
    assert gripper.get_gripper_calibration_offset("gripper1") is None


def test_save_gripper_calibration(
    ot_config_tempdir: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Test saving gripper calibrations.
    """
    assert gripper.get_gripper_calibration_offset("gripper1") is None
    gripper.save_gripper_calibration(Point(1, 1, 1), "gripper1")
    gripper_offset = gripper.get_gripper_calibration_offset("gripper1")
    assert gripper_offset is not None
    assert gripper_offset.offset == Point(1, 1, 1)


def test_save_gripper_jaw_width(
    ot_config_tempdir: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Test saving gripper jaw calibrations.
    """
    assert gripper.get_gripper_jaw_width_data("gripper1") is None
    gripper.save_gripper_jaw_width_data(15.44, "gripper1")
    gripper_offset = gripper.get_gripper_jaw_width_data("gripper1")
    assert gripper_offset is not None
    assert gripper_offset.encoderPositionAtJawClosed == 15.44


def test_get_gripper_calibration(
    starting_calibration_data: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    gripper_data = gripper.get_gripper_calibration_offset("gripper1")
    assert gripper_data is not None
    assert gripper_data == models.v1.InstrumentOffsetModel(
        offset=Point(1, 1, 1),
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )


def test_get_gripper_jaw_width(
    starting_calibration_data: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Test ability to get a gripper jaw calibration schema.
    """
    gripper_data = gripper.get_gripper_jaw_width_data("gripper1")
    assert gripper_data is not None
    assert gripper_data == models.v1.GripperJawWidthModel(
        encoderPositionAtJawClosed=15.5,
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )

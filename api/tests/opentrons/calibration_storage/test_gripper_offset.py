import pytest
import typing
import opentrons
import importlib

from opentrons.types import Point
from opentrons.calibration_storage import (
    types as cs_types,
    gripper_offset as gripper,
)


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


def test_delete_all_gripper_calibration(starting_calibration_data: typing.Any) -> None:
    """
    Test delete all gripper calibrations.
    """
    assert gripper.get_gripper_calibration_offset("gripper1") is not None
    assert gripper.get_gripper_calibration_offset("gripper2") is not None
    gripper.clear_gripper_calibration_offsets()
    assert gripper.get_gripper_calibration_offset("gripper1") is None
    assert gripper.get_gripper_calibration_offset("gripper2") is None


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


def test_get_gripper_calibration(
    starting_calibration_data: typing.Any, enable_ot3_hardware_controller: typing.Any
) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    importlib.reload(opentrons.calibration_storage)
    from opentrons.calibration_storage import models

    gripper_data = gripper.get_gripper_calibration_offset("gripper1")
    assert gripper_data is not None
    assert gripper_data == models.v1.InstrumentOffsetModel(
        offset=Point(1, 1, 1),
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )

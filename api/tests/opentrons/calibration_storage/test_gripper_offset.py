import json
import os

import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator, Any, Tuple

from opentrons.types import Mount, Point
from opentrons.calibration_storage import (
    types as cs_types,
    ot3_gripper_offset as gripper,
	ot3_schemas as schema
)




@pytest.fixture
def starting_calibration_data(ot_config_tempdir: Any) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    gripper.save_gripper_calibration(Point(1, 1, 1), "gripper1")


def test_delete_all_gripper_calibration(
    starting_calibration_data: Any
) -> None:
    """
    Test delete all gripper calibrations.
    """
    assert gripper._gripper_offset_calibrations() != {}
    gripper.clear_gripper_calibration_offsets()
    assert gripper._gripper_offset_calibrations() == {}


def test_delete_gripper_calibration(
    starting_calibration_data: Any
) -> None:
    """
    Test delete a single gripper calibration.
    """
    assert gripper._gripper_offset_calibrations() != {}
    gripper.delete_gripper_calibration_file("gripper1")
    assert gripper._gripper_offset_calibrations() == {}


def test_save_gripper_calibration(
    ot_config_tempdir: Any
) -> None:
    """
    Test saving gripper calibrations.
    """
    assert gripper._gripper_offset_calibrations() == {}
    gripper.save_gripper_calibration(Point(1, 1, 1), "gripper1")
    assert gripper._gripper_offset_calibrations() != {}
    assert gripper._gripper_offset_calibrations()["gripper1"].offset == Point(1, 1, 1)


def test_get_gripper_calibration(
    starting_calibration_data: Any,
    enable_ot3_hardware_controller: Any,
) -> None:
    """
    Test ability to get a gripper calibration schema.
    """
    gripper_data = gripper.get_gripper_calibration_offset("gripper1")
    assert gripper_data == schema.v1.InstrumentOffsetSchema(
        offset=Point(1, 1, 1),
        lastModified=gripper_data.lastModified,
        source=cs_types.SourceType.user,
    )

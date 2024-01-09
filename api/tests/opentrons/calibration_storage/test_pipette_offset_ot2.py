import pytest
from typing import Any, TYPE_CHECKING

from opentrons.types import Mount, Point
from opentrons.calibration_storage import (
    types as cs_types,
)
from opentrons.calibration_storage.ot2 import (
    save_pipette_calibration,
    get_pipette_offset,
    clear_pipette_offset_calibrations,
    delete_pipette_offset_file,
)

if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture
def starting_calibration_data(
    robot_model: "RobotModel", ot_config_tempdir: Any
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    save_pipette_calibration(
        Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
    )
    save_pipette_calibration(
        Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
    )


def test_delete_all_pipette_calibration(starting_calibration_data: Any) -> None:
    """
    Test delete all pipette calibrations.
    """
    assert get_pipette_offset("pip1", Mount.LEFT) is not None
    assert get_pipette_offset("pip2", Mount.RIGHT) is not None
    clear_pipette_offset_calibrations()
    assert get_pipette_offset("pip1", Mount.LEFT) is None
    assert get_pipette_offset("pip2", Mount.RIGHT) is None


def test_delete_specific_pipette_offset(starting_calibration_data: Any) -> None:
    """
    Test delete a specific pipette calibration.
    """
    assert get_pipette_offset("pip1", Mount.LEFT) is not None
    delete_pipette_offset_file("pip1", Mount.LEFT)
    assert get_pipette_offset("pip1", Mount.LEFT) is None


def test_save_pipette_calibration(
    ot_config_tempdir: Any, robot_model: "RobotModel"
) -> None:
    """
    Test saving pipette calibrations.
    """
    assert get_pipette_offset("pip1", Mount.LEFT) is None
    save_pipette_calibration(
        Point(1, 1, 1), "pip1", Mount.LEFT, "mytiprack", "opentrons/tip_rack/1"
    )
    save_pipette_calibration(
        Point(1, 1, 1), "pip2", Mount.RIGHT, "mytiprack", "opentrons/tip_rack/1"
    )
    assert get_pipette_offset("pip1", Mount.LEFT) is not None
    assert get_pipette_offset("pip2", Mount.RIGHT) is not None
    pip1 = get_pipette_offset("pip1", Mount.LEFT)
    assert pip1 is not None and pip1.offset == Point(1, 1, 1)
    pip2 = get_pipette_offset("pip1", Mount.LEFT)
    assert pip2 is not None and pip2.offset == Point(1, 1, 1)


def test_get_pipette_calibration(
    starting_calibration_data: Any, robot_model: "RobotModel"
) -> None:
    """
    Test ability to get a pipette calibration model.
    """
    from opentrons.calibration_storage.ot2.models.v1 import (
        InstrumentOffsetModel as OT2InstrModel,
    )

    pipette_data = get_pipette_offset("pip1", Mount.LEFT)
    assert pipette_data is not None

    assert pipette_data == OT2InstrModel(
        offset=Point(1, 1, 1),
        tiprack="mytiprack",
        uri="opentrons/tip_rack/1",
        last_modified=pipette_data.last_modified,
        source=cs_types.SourceType.user,
    )

import pytest
import importlib
import opentrons
from typing import Any, TYPE_CHECKING


if TYPE_CHECKING:
    from opentrons_shared_data.deck.dev_types import RobotModel


@pytest.fixture(autouse=True)
def reload_module(robot_model: "RobotModel") -> None:
    importlib.reload(opentrons.calibration_storage)


@pytest.fixture
def starting_calibration_data(
    robot_model: "RobotModel", ot_config_tempdir: Any
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """

    if robot_model == "OT-3 Standard":
        from opentrons.calibration_storage import save_robot_belt_attitude

        save_robot_belt_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            "pip1",
        )
    else:
        from opentrons.calibration_storage import save_robot_deck_attitude

        save_robot_deck_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            "pip1",
            "mytiprack",
        )


def test_save_deck_attitude(ot_config_tempdir: Any, robot_model: "RobotModel") -> None:
    """
    Test saving deck attitude calibrations.
    """
    if robot_model == "OT-3 Standard":
        from opentrons.calibration_storage import (
            get_robot_belt_attitude,
            save_robot_belt_attitude,
        )

        assert get_robot_belt_attitude() is None
        save_robot_belt_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            "pip1",
        )
        assert get_robot_belt_attitude() != {}
    else:
        from opentrons.calibration_storage import (
            get_robot_deck_attitude,
            save_robot_deck_attitude,
        )

        assert get_robot_deck_attitude() is None
        save_robot_deck_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            "pip1",
            "mytiprack",
        )
        assert get_robot_deck_attitude() != {}


def test_get_deck_calibration(
    starting_calibration_data: Any, robot_model: "RobotModel"
) -> None:
    """
    Test ability to get a deck calibration model.
    """
    if robot_model == "OT-3 Standard":
        # needed for proper type checking unfortunately
        from opentrons.calibration_storage.ot3.models.v1 import (
            BeltCalibrationModel as OT3BeltCalModel,
        )
        from opentrons.calibration_storage import get_robot_belt_attitude

        robot_belt = get_robot_belt_attitude()
        assert robot_belt
        assert robot_belt == OT3BeltCalModel(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            lastModified=robot_belt.lastModified,
            source=robot_belt.source,
            pipetteCalibratedWith="pip1",
        )
    else:
        from opentrons.calibration_storage.ot2.models.v1 import (
            DeckCalibrationModel as OT2DeckCalModel,
        )
        from opentrons.calibration_storage import get_robot_deck_attitude

        robot_deck = get_robot_deck_attitude()
        assert robot_deck
        assert robot_deck == OT2DeckCalModel(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            last_modified=robot_deck.last_modified,
            source=robot_deck.source,
            pipette_calibrated_with="pip1",
            tiprack="mytiprack",
        )


def test_delete_deck_calibration(
    starting_calibration_data: Any, robot_model: "RobotModel"
) -> None:
    """
    Test delete deck calibration.
    """
    if robot_model == "OT-3 Standard":
        from opentrons.calibration_storage import (
            get_robot_belt_attitude,
            delete_robot_belt_attitude,
        )

        robot_belt = get_robot_belt_attitude()
        assert robot_belt
        assert robot_belt.attitude == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        delete_robot_belt_attitude()
        assert get_robot_belt_attitude() is None
    else:
        from opentrons.calibration_storage import (
            get_robot_deck_attitude,
            delete_robot_deck_attitude,
        )

        robot_deck = get_robot_deck_attitude()
        assert robot_deck
        assert robot_deck.attitude == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        delete_robot_deck_attitude()
        assert get_robot_deck_attitude() is None

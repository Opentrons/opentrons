from typing import Any
from opentrons.calibration_storage import (
    save_robot_deck_attitude,
    get_robot_deck_attitude,
    delete_robot_deck_attitude,
)


def test_deck_calibration_storage_ot2(ot_config_tempdir: Any) -> None:
    """
    Test saving deck attitude calibrations.
    """

    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot2.models.v1 import (
        DeckCalibrationModel as OT2DeckCalModel,
    )
    # Check nothing is stored
    assert get_robot_deck_attitude() is None

    # Save calibration data
    save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", "mytiprack")

    # Deck calibration data should exist and be equal to what was saved to file
    robot_deck = get_robot_deck_attitude()
    assert robot_deck == OT2DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        last_modified=robot_deck.last_modified,
        source=robot_deck.source,
        pipette_calibrated_with="pip1",
        tiprack="mytiprack",
    )

    # Delete deck calibration should be successful
    delete_robot_deck_attitude()
    assert get_robot_deck_attitude() is None

def test_deck_calibration_storage_ot3(ot_config_tempdir: Any, enable_ot3_hardware_controller: Any) -> None:
    """
    Test saving deck attitude calibrations.
    """
    # needed for proper type checking unfortunately
    from opentrons.calibration_storage.ot3.models.v1 import (
        DeckCalibrationModel as OT3DeckCalModel,
    )

    # Check nothing is stored
    assert get_robot_deck_attitude() is None

    # Save calibration data
    save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1")

    # Deck calibration data should exist and be equal to what was saved to file
    robot_deck = get_robot_deck_attitude()
    assert robot_deck == OT3DeckCalModel(
        attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        lastModified=robot_deck.lastModified,
        source=robot_deck.source,
        pipetteCalibratedWith="pip1",
    )

    # Delete deck calibration should be successful
    delete_robot_deck_attitude()
    assert get_robot_deck_attitude() is None

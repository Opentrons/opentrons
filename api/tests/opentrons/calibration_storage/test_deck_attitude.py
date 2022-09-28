import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator, Any, Tuple

from opentrons.calibration_storage import types as cs_types

@no_type_check
@pytest.fixture
def _deck(
    request: pytest.FixtureRequest,
) -> Generator[Tuple[ModuleType, str], None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module(
            "opentrons.calibration_storage.ot3.deck_attitude"
        ), robot_type
    else:
        yield importlib.import_module(
            "opentrons.calibration_storage.ot2.deck_attitude"
        ), robot_type


@no_type_check
@pytest.fixture
def schema(
    request: pytest.FixtureRequest,
) -> Generator[ModuleType, None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module(
            "opentrons.calibration_storage.ot3.schemas"
        )
    else:
        yield importlib.import_module(
            "opentrons.calibration_storage.ot2.schemas"
        )


@no_type_check
@pytest.fixture
def starting_calibration_data(
    _deck: ModuleType, ot_config_tempdir: Any
) -> None:
    """
    Starting calibration data fixture.

    Adds dummy data to a temporary directory to test delete commands against.
    """
    deck, robot_type = _deck

    if robot_type == "ot3":
        deck.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1")
    else:
        deck.save_robot_deck_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", "mytiprack"
        )


@no_type_check
@pytest.mark.parametrize(
    argnames=["_deck"],
    argvalues=[["ot2"], ["ot3"]],
    indirect=True,
)
def test_save_deck_attitude(
    ot_config_tempdir: Any, _deck: ModuleType
) -> None:
    """
    Test saving deck attitude calibrations.
    """
    deck, robot_type = _deck
    assert deck._deck_calibration() is None
    if robot_type == "ot3":
        deck.save_robot_deck_attitude([[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1")
    else:
        deck.save_robot_deck_attitude(
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "pip1", "mytiprack"
        )
    assert deck._deck_calibration() != {}



@no_type_check
@pytest.mark.parametrize(
    argnames=["_deck", "starting_calibration_data", "schema"],
    argvalues=[["ot2", "ot2", "ot2"], ["ot3", "ot3", "ot3"]],
    indirect=True,
)
def test_get_deck_calibration(
    _deck: Tuple[ModuleType, str], starting_calibration_data: Any, schema: ModuleType
) -> None:
    """
    Test ability to get a deck calibration schema.
    """
    deck, robot_type = _deck
    robot_deck = deck.get_robot_deck_attitude()
    if robot_type == "ot3":
        assert robot_deck == schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            lastModified=robot_deck.lastModified,
            source=cs_types.SourceType.user,
            pipetteCalibratedWith="pip1",
            status=schema.v1.CalibrationStatus(),
        )
    else:
        assert robot_deck == schema.v1.DeckCalibrationSchema(
            attitude=[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
            last_modified=robot_deck.last_modified,
            source=cs_types.SourceType.user,
            pipette_calibrated_with="pip1",
            status=schema.v1.CalibrationStatus(),
            tiprack="mytiprack",
        )


@no_type_check
@pytest.mark.parametrize(
    argnames=["_deck", "starting_calibration_data"],
    argvalues=[["ot2", "ot2"], ["ot3", "ot3"]],
    indirect=True,
)
def test_delete_deck_calibration(
    starting_calibration_data: Any, _deck: ModuleType
) -> None:
    """
    Test delete deck calibration.
    """
    deck, _ = _deck
    assert deck._deck_calibration() != {}
    assert deck._deck_calibration().attitude == [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    deck.delete_robot_deck_attitude()
    assert deck._deck_calibration() is None

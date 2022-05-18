import pytest
from decoy import Decoy

from robot_server.persistence import reset_db
from robot_server.service.legacy.reset_options_manager import ResetOptionsManager
from robot_server.service.legacy.models.settings import (
    FactoryResetOption,
    FactoryResetOptions,
)

from opentrons.config import reset as reset_util
# from opentrons.config.reset import CommonResetOption, ResetOptionId


@pytest.fixture
def subject(decoy: Decoy) -> ResetOptionsManager:
    return decoy.mock(cls=ResetOptionsManager)


def test_get_reset_options(subject: ResetOptionsManager):
    """Should get a list of reset options."""
    expected_options = FactoryResetOptions(
        options=[
            FactoryResetOption(
                id="bootScripts",
                name="Boot Scripts",
                description="Clear custom boot scripts",
            ),
            FactoryResetOption(
                id="deckCalibration",
                name="Deck Calibration",
                description="Clear deck calibration (will also clear pipette offset)",
            ),
            FactoryResetOption(
                id="pipetteOffsetCalibrations",
                name="Pipette Offset Calibrations",
                description="Clear pipette offset calibrations",
            ),
            FactoryResetOption(
                id="tipLengthCalibrations",
                name="Tip Length Calibrations",
                description="Clear tip length calibrations (will also clear pipette offset)",
            ),
            FactoryResetOption(
                id="dbHistory",
                name="Clear Data and Restart Robot",
                description="Clear run/protocols history",
            ),
        ]
    )

    result = subject.get_reset_options()

    assert result == expected_options


def test_reset_option_api_layer(decoy: Decoy, subject: ResetOptionsManager) -> None:
    """Should verify api reset was called"""
    method_input = {"bootScripts": True, "deckCalibration": True, "dbHistory": False}

    subject.reset_options(method_input)

    decoy.verify(reset_util.reset({"deckCalibration", "bootScripts"}), times=1)


def test_reset_option_db_layer(decoy: Decoy, subject: ResetOptionsManager) -> None:
    """Should verify api reset was called"""
    method_input = {"dbHistory": True}

    result = subject.reset_options(method_input)

    assert result == {"dbHistory"}

    decoy.verify(reset_db(), times=1)

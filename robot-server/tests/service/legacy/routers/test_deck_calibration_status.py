import pytest
from fastapi.testclient import TestClient
from mock import MagicMock

from opentrons.hardware_control.ot3_calibration import (
    OT3Transforms,
    load_attitude_matrix,
)
from opentrons.hardware_control.util import DeckTransformState
from opentrons.types import Point


@pytest.fixture
def hardware_with_cal(hardware: MagicMock) -> MagicMock:
    hardware.robot_calibration = OT3Transforms(
        deck_calibration=load_attitude_matrix(to_default=False),
        carriage_offset=Point(0, 0, 0),
        left_mount_offset=Point(1, 1, 1),
        right_mount_offset=Point(2, 2, 2),
        gripper_mount_offset=Point(3, 3, 3),
    )
    return hardware


def test_get_deck_calibration_status_valid(
    api_client: TestClient, hardware_with_cal: MagicMock
):
    """Test that a valid deck calibration returns correctly with an OK status."""

    hardware_with_cal.validate_calibration.return_value = DeckTransformState.OK

    resp = api_client.get("/calibration/status")

    hardware_with_cal.validate_calibration.assert_called_once()

    assert resp.status_code == 200


def test_get_deck_calibration_status_invalid(
    api_client: TestClient, hardware_with_cal: MagicMock
):
    """Test that an invalid deck calibration returns correctly with a SINGULARITY status."""
    hardware_with_cal.validate_calibration.return_value = DeckTransformState.SINGULARITY

    resp = api_client.get("/calibration/status")

    hardware_with_cal.validate_calibration.assert_called_once()

    assert resp.status_code == 200
    body = resp.json()
    assert body["deckCalibration"].get("status", None) == "SINGULARITY"

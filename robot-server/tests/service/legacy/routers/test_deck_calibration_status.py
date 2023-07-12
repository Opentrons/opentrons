from fastapi.testclient import TestClient
from mock import MagicMock

from opentrons.hardware_control.robot_calibration import load
from opentrons.hardware_control.util import DeckTransformState


def test_get_deck_calibration_status_valid(api_client: TestClient, hardware: MagicMock):
    """Test that a valid deck calibration returns correctly with an OK status."""
    hardware.robot_calibration = load()
    hardware.robot_calibration.deck_calibration.attitude = [
        [1.0019, -0.0012, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ]
    hardware.validate_calibration.return_value = DeckTransformState.OK

    resp = api_client.get("/calibration/status")

    hardware.validate_calibration.assert_called_once()

    assert resp.status_code == 200


def test_get_deck_calibration_status_invalid(
    api_client: TestClient, hardware: MagicMock
):
    """Test that an invalid deck calibration returns correctly with a SINGULARITY status."""
    hardware.robot_calibration = load()
    hardware.validate_calibration.return_value = DeckTransformState.SINGULARITY

    resp = api_client.get("/calibration/status")

    hardware.validate_calibration.assert_called_once()

    assert resp.status_code == 200
    body = resp.json()
    assert body["deckCalibration"].get("status", None) == "SINGULARITY"

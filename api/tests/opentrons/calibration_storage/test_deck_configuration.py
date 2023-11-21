from datetime import datetime, timezone

import pytest

from opentrons.calibration_storage import deck_configuration as subject
from opentrons.calibration_storage.types import CutoutFixturePlacement


def test_deck_configuration_serdes() -> None:
    """Test that deck configuration serialization/deserialization survives a round trip."""

    dummy_cutout_fixture_placements = [
        CutoutFixturePlacement(cutout_fixture_id="a", cutout_id="b"),
        CutoutFixturePlacement(cutout_fixture_id="c", cutout_id="d"),
    ]
    dummy_datetime = datetime(year=1961, month=5, day=6, tzinfo=timezone.utc)

    serialized = subject.serialize_deck_configuration(
        dummy_cutout_fixture_placements, dummy_datetime
    )
    deserialized = subject.deserialize_deck_configuration(serialized)
    assert deserialized == (dummy_cutout_fixture_placements, dummy_datetime)


@pytest.mark.parametrize(
    "input",
    [
        b'{"hello": "world"}',  # Valid JSON, but not valid for the model.
        "😾".encode("utf-8"),  # Not valid JSON.
    ],
)
def test_deserialize_deck_configuration_error_handling(input: bytes) -> None:
    """Test that deserialization handles errors gracefully."""
    assert subject.deserialize_deck_configuration(input) is None

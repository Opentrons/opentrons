from datetime import datetime, timezone
from opentrons.calibration_storage import deck_configuration as subject
from opentrons.calibration_storage.types import CutoutFixturePlacement


def test_deck_configuration_storage(ot_config_tempdir: object) -> None:
    # Initially, there should be no deck configuration.
    assert subject.get_robot_deck_configuration() is None

    dummy_cutout_fixture_placements = [
        CutoutFixturePlacement(cutout_fixture_id="a", cutout_id="b"),
        CutoutFixturePlacement(cutout_fixture_id="c", cutout_id="d"),
    ]
    dummy_datetime = datetime(year=1961, month=5, day=6, tzinfo=timezone.utc)

    # After you save it, retrieving it should return what you just stored.
    subject.save_robot_deck_configuration(
        dummy_cutout_fixture_placements, dummy_datetime
    )
    assert subject.get_robot_deck_configuration() == (
        dummy_cutout_fixture_placements,
        dummy_datetime,
    )

    # After you delete it, retrieving it should return nothing again.
    subject.delete_robot_deck_configuration()
    assert subject.get_robot_deck_configuration() is None

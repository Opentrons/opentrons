import pytest
import json
import typing
from pathlib import Path
from opentrons.calibration_storage import file_operators as io


@pytest.fixture
def calibration() -> typing.Dict[str, typing.Any]:
    return {
        "attitude": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
        "lastModified": "2022-10-27T15:21:43.195599+00:00",
        "source": "user",
        "pipette_calibrated_with": "pip1",
        "tiprack": "mytiprack",
        "status": {"markedBad": False, "source": None, "markedAt": None},
    }


@pytest.fixture
def malformed_calibration() -> typing.Dict[str, typing.Any]:
    return {
        "attitude": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
        "lastModified": "blah",
        "source": "user",
        "pipette_calibrated_with": "pip1",
        "tiprack": "mytiprack",
        "status": {"markedBad": False, "source": None, "markedAt": None},
    }


def test_save_delete_file(
    tmp_path: Path, calibration: typing.Dict[str, typing.Any]
) -> None:
    """
    Test saving, reading and deleting a correctly formed calibration blob.
    """
    my_calpath = tmp_path / "calibrations"
    io.save_to_file(my_calpath, "my_calibration", calibration)
    file_to_delete = my_calpath / "my_calibration.json"
    assert io.read_cal_file(file_to_delete)

    io.delete_file(file_to_delete)

    with pytest.raises(FileNotFoundError):
        io.read_cal_file(file_to_delete)


def test_malformed_calibration(
    tmp_path: Path, malformed_calibration: typing.Dict[str, typing.Any]
) -> None:
    """
    Test saving and reading a malformed calibration blob. Note, malformed here only means
    datetime abnormalities.
    """
    malformed_calibration_dir = tmp_path / "calibrations"
    malformed_calibration_path = malformed_calibration_dir / "my_bad_calibration.json"

    # TODO (lc 10-27-2022) We don't actually throw an error when we're saving bad calibration data.
    # Probably before this point, we should make sure that we're passin in a validated pydantic
    # model because otherwise we could potentially be saving malformed data which would fail on
    # a read file.
    io.save_to_file(
        malformed_calibration_dir, "my_bad_calibration", malformed_calibration
    )

    malformed_calibration_dir.mkdir(parents=True, exist_ok=True)
    malformed_calibration_path.write_text(
        json.dumps(malformed_calibration), encoding="utf-8"
    )
    with pytest.raises(AssertionError):
        io.read_cal_file(malformed_calibration_path)

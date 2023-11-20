import json
import typing
from pathlib import Path

import pydantic
import pytest

from opentrons.calibration_storage import file_operators as io


class DummyModel(pydantic.BaseModel):
    integer_field: int
    aliased_field: str = pydantic.Field(alias="! aliased field !")


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


def test_save_pydantic_model_to_file(tmp_path: Path) -> None:
    directory_path = tmp_path / "nonexistent 1" / "nonexistent 2" / "nonexistent 3"
    file_name = "test.json"
    assert not directory_path.exists()

    io.save_pydantic_model_to_file(
        directory_path,
        file_name,
        DummyModel.construct(integer_field=123, aliased_field="abc"),
    )

    assert json.loads((directory_path / file_name).read_text(encoding="utf-8")) == {
        "integer_field": 123,
        "! aliased field !": "abc",
    }


def test_read_pydantic_model_from_file_valid(tmp_path: Path) -> None:
    valid_path = tmp_path / "valid.json"
    valid_path.write_text(
        '{"integer_field": 123, "! aliased field !": "abc"}', encoding="utf-8"
    )
    assert io.read_pydantic_model_from_file(
        valid_path, DummyModel
    ) == DummyModel.construct(integer_field=123, aliased_field="abc")


def test_read_pydantic_model_from_file_nonexistent_path(tmp_path: Path) -> None:
    nonexistent_path = tmp_path / "nonexistent.json"
    assert io.read_pydantic_model_from_file(nonexistent_path, DummyModel) is None


def test_read_pydantic_model_from_file_invalid_json(tmp_path: Path) -> None:
    not_json_path = tmp_path / "not_json.json"
    not_json_path.write_text("😾", encoding="utf-8")

    assert io.read_pydantic_model_from_file(not_json_path, DummyModel) is None

    # Ideally we would assert that the subject logged a message saying "not valid JSON",
    # but the opentrons.simulate and opentrons.execute tests interfere with the process's logger
    # settings and prevent that message from showing up in pytest's caplog fixture.


def test_read_pydantic_model_from_file_invalid_model(tmp_path: Path) -> None:
    not_model_path = tmp_path / "not_model.json"
    not_model_path.write_text('{"integer_field": "not an integer"}', encoding="utf-8")

    assert io.read_pydantic_model_from_file(not_model_path, DummyModel) is None

    # Ideally we would assert that the subject logged a message saying "malformed",
    # but the opentrons.simulate and opentrons.execute tests interfere with the process's logger
    # settings and prevent that message from showing up in pytest's caplog fixture.

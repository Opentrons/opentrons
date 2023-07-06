import json
import os
from pathlib import Path
from typing import Callable

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons.util.entrypoint_util import (
    FoundLabware,
    labware_from_paths,
    datafiles_from_paths,
)


def test_labware_from_paths(
    tmp_path: Path,
    get_labware_fixture: Callable[[str], LabwareDefDict],
) -> None:
    path_1 = tmp_path / "path 1"
    path_1.mkdir()
    path_2 = tmp_path / "path 2"
    path_2.mkdir()

    lw1 = get_labware_fixture("fixture_96_plate")
    lw2 = get_labware_fixture("fixture_24_tuberack")
    lw3 = get_labware_fixture("fixture_irregular_example_1")

    with open(path_1 / "labware1.json", "w") as lwtemp:
        json.dump(lw1, lwtemp)
    with open(path_1 / "labware2.json", "w") as lwtemp:
        json.dump(lw2, lwtemp)
    with open(path_2 / "labware3.json", "w") as lwtemp:
        json.dump(lw3, lwtemp)
    with open(path_2 / "invalid.json", "w") as lwtemp:
        lwtemp.write("asdjkashdkajvka")
    with open(path_2 / "notevenjson", "w") as lwtemp:
        lwtemp.write("bgbbabcba")

    res = labware_from_paths(
        [
            os.path.realpath(path_1),
            path_2,
        ]
    )
    assert res == {
        "fixture/fixture_96_plate/1": FoundLabware(path_1 / "labware1.json", lw1),
        "fixture/fixture_24_tuberack/1": FoundLabware(path_1 / "labware2.json", lw2),
        "fixture/fixture_irregular_example_1/1": FoundLabware(
            path_2 / "labware3.json", lw3
        ),
    }


def test_datafiles_from_paths(tmp_path: Path) -> None:
    os.mkdir(os.path.join(tmp_path, "path-1"))
    os.mkdir(os.path.join(tmp_path, "path-2"))
    with open(os.path.join(tmp_path, "path-1", "test3"), "wb") as f:
        f.write("oh hey there checkitout".encode("utf-8"))
    with open(os.path.join(tmp_path, "path-2", "test2"), "wb") as f:
        f.write("oh man this isnt even utf8".encode("utf-16"))
    with open(os.path.join(tmp_path, "path-2", "test1"), "wb") as f:
        f.write("wait theres a second file???".encode())
    with open(os.path.join(tmp_path, "test-file"), "wb") as f:
        f.write("this isnt even in a directory".encode())

    res = datafiles_from_paths(
        [
            os.path.join(tmp_path, "path-1"),
            Path(os.path.join(tmp_path, "path-2")),
            os.path.join(tmp_path, "test-file"),
        ]
    )
    assert res == {
        "test3": "oh hey there checkitout".encode("utf-8"),
        "test2": "oh man this isnt even utf8".encode("utf-16"),
        "test1": "wait theres a second file???".encode(),
        "test-file": "this isnt even in a directory".encode(),
    }

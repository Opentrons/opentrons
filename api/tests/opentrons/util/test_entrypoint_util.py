import io
import json
import os
from pathlib import Path
from typing import Callable

import pytest

from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict
from opentrons.util.entrypoint_util import (
    FoundLabware,
    labware_from_paths,
    datafiles_from_paths,
    copy_file_like,
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


class TestCopyFileLike:
    """Tests for `copy_file_like()`."""

    @pytest.fixture(params=["abc", "µ"])
    def source_text(self, request: pytest.FixtureRequest) -> str:
        return request.param  # type: ignore[attr-defined,no-any-return]

    @pytest.fixture
    def source_bytes(self, source_text: str) -> bytes:
        return b"\x00\x01\x02\x03\x04"

    @pytest.fixture
    def source_path(self, tmp_path: Path) -> Path:
        return tmp_path / "source"

    @pytest.fixture
    def destination_path(self, tmp_path: Path) -> Path:
        return tmp_path / "destination"

    def test_from_text_file(
        self,
        source_text: str,
        source_path: Path,
        destination_path: Path,
    ) -> None:
        """Test that it correctly copies from a text-mode `open()`."""
        source_path.write_text(source_text)

        with open(
            source_path,
            mode="rt",
        ) as source_file:
            copy_file_like(source=source_file, destination=destination_path)

        assert destination_path.read_text() == source_text

    def test_from_binary_file(
        self,
        source_bytes: bytes,
        source_path: Path,
        destination_path: Path,
    ) -> None:
        """Test that it correctly copies from a binary-mode `open()`."""
        source_path.write_bytes(source_bytes)

        with open(source_path, mode="rb") as source_file:
            copy_file_like(source=source_file, destination=destination_path)

        assert destination_path.read_bytes() == source_bytes

    def test_from_stringio(self, source_text: str, destination_path: Path) -> None:
        """Test that it correctly copies from an `io.StringIO`."""
        stringio = io.StringIO(source_text)

        copy_file_like(source=stringio, destination=destination_path)

        assert destination_path.read_text() == source_text

    def test_from_bytesio(self, source_bytes: bytes, destination_path: Path) -> None:
        """Test that it correctly copies from an `io.BytesIO`."""
        bytesio = io.BytesIO(source_bytes)

        copy_file_like(source=bytesio, destination=destination_path)

        assert destination_path.read_bytes() == source_bytes

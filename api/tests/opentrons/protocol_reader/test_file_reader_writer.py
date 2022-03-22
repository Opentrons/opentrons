"""Tests for opentrons.protocol_reader.file_reader_writer.FileReaderWriter."""
import io
import pytest
from pathlib import Path
from decoy import matchers
from typing import Any, Type

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import ProtocolSchemaV6
from opentrons.protocols.models import JsonProtocol, LabwareDefinition
from opentrons.protocol_reader.input_file import InputFile
from opentrons.protocol_reader.file_reader_writer import (
    FileReaderWriter,
    FileReadError,
    BufferedFile,
)


SIMPLE_V5_JSON_PROTOCOL = load_shared_data("protocol/fixtures/5/simpleV5.json")
SIMPLE_LABWARE_DEF = load_shared_data("labware/fixtures/2/fixture_96_plate.json")
SIMPLE_V6_JSON_PROTOCOL = load_shared_data("protocol/fixtures/6/simpleV6.json")


async def test_read() -> None:
    """It should read file-likes."""
    file_1 = InputFile(filename="hello.txt", file=io.BytesIO(b"# hello"))
    file_2 = InputFile(filename="world.txt", file=io.BytesIO(b"# world"))

    subject = FileReaderWriter()
    result = await subject.read([file_1, file_2])

    assert result == [
        BufferedFile(name="hello.txt", contents=b"# hello", data=None),
        BufferedFile(name="world.txt", contents=b"# world", data=None),
    ]


@pytest.mark.parametrize(
    ids=["JSON v5 protocol", "JSON v6 protocol", "labware definition"],
    argnames=("input_file_contents", "expected_type"),
    argvalues=[
        (SIMPLE_V5_JSON_PROTOCOL, JsonProtocol),
        (SIMPLE_V6_JSON_PROTOCOL, ProtocolSchemaV6),
        (SIMPLE_LABWARE_DEF, LabwareDefinition),
    ],
)
async def test_read_opentrons_json(
    input_file_contents: bytes,
    expected_type: Type[Any],
) -> None:
    """It should read and parse Opentrons JSON protocol/labware file-likes."""
    input_file = InputFile(filename="hello.json", file=io.BytesIO(input_file_contents))

    subject = FileReaderWriter()
    result = await subject.read([input_file])

    assert result == [
        BufferedFile(
            name="hello.json",
            contents=input_file_contents,
            data=matchers.Anything(),
        ),
    ]

    assert isinstance(result[0].data, expected_type)


async def test_read_missing_filename() -> None:
    """It should error if a file has no filename."""
    in_file = InputFile(filename="", file=io.BytesIO(b""))

    subject = FileReaderWriter()

    with pytest.raises(FileReadError, match="missing a name"):
        await subject.read([in_file])


async def test_read_opentrons_json_bad_parse() -> None:
    """It should error if a .json file cannot be parsed as a JSON."""
    in_file = InputFile(filename="hello.json", file=io.BytesIO(b"{oh: no}"))

    subject = FileReaderWriter()

    with pytest.raises(FileReadError, match="not valid JSON"):
        await subject.read([in_file])


# TODO(mc, 2021-12-07): add support arbitrary JSON data files
async def test_read_opentrons_json_bad_validate() -> None:
    """It should error if a JSON file cannot be validated into a known model."""
    in_file = InputFile(filename="hello.json", file=io.BytesIO(b'{"oh": "no"}'))

    subject = FileReaderWriter()

    with pytest.raises(FileReadError, match="known Opentrons format"):
        await subject.read([in_file])


async def test_write(tmp_path: Path) -> None:
    """It should write buffered files to disk."""
    directory = tmp_path / "target"
    file_1 = BufferedFile(name="hello.txt", contents=b"# hello", data=None)
    file_2 = BufferedFile(name="world.txt", contents=b"# world", data=None)

    subject = FileReaderWriter()
    await subject.write(
        directory=directory,
        files=[file_1, file_2],
    )

    assert Path(tmp_path / "target" / "hello.txt").read_bytes() == b"# hello"
    assert Path(tmp_path / "target" / "world.txt").read_bytes() == b"# world"

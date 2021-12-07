"""Tests for opentrons.protocol_reader.file_reader_writer.FileReaderWriter."""
import io
import pytest
from pathlib import Path
from decoy import matchers

from opentrons_shared_data import load_shared_data
from opentrons.protocols.models import JsonProtocol, LabwareDefinition
from opentrons.protocol_reader.input_file import InputFile
from opentrons.protocol_reader.file_reader_writer import (
    FileReaderWriter,
    FileReadError,
    BufferedFile,
)


SIMPLE_V5_JSON_PROTOCOL = load_shared_data("protocol/fixtures/5/simpleV5.json")
SIMPLE_LABWARE_DEF = load_shared_data("labware/fixtures/2/fixture_96_plate.json")


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


async def test_read_opentrons_json() -> None:
    """It should read and parse Opentrons JSON protocol/labware file-likes."""
    file_1 = InputFile(filename="hello.json", file=io.BytesIO(SIMPLE_V5_JSON_PROTOCOL))
    file_2 = InputFile(filename="world.json", file=io.BytesIO(SIMPLE_LABWARE_DEF))

    subject = FileReaderWriter()
    result = await subject.read([file_1, file_2])

    assert result == [
        BufferedFile(
            name="hello.json",
            contents=SIMPLE_V5_JSON_PROTOCOL,
            data=matchers.Anything(),
        ),
        BufferedFile(
            name="world.json",
            contents=SIMPLE_LABWARE_DEF,
            data=matchers.Anything(),
        ),
    ]

    assert isinstance(result[0].data, JsonProtocol)
    assert isinstance(result[1].data, LabwareDefinition)


# TODO(mc, 2021-12-07): add support for LabwareDefinition and
# arbitrary JSON data files
async def test_read_opentrons_json_bad_parse() -> None:
    """It should error if a JSON file cannnot be parsed as a JSON protocol."""
    in_file = InputFile(filename="hello.json", file=io.BytesIO(b'{"oh": "no"}'))

    subject = FileReaderWriter()

    with pytest.raises(FileReadError):
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

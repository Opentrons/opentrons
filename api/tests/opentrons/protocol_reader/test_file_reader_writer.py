"""Tests for opentrons.protocol_reader.file_reader_writer.FileReaderWriter."""

from pathlib import Path

import pytest

from ._input_file import InputFile
from opentrons.protocol_reader.file_reader_writer import (
    BufferedFile,
    FileReadError,
    FileReaderWriter,
)


async def test_read_with_abstract_input_file() -> None:
    """It should read file-likes."""
    file_1 = InputFile.make(filename="hello.txt", contents=b"# hello")
    file_2 = InputFile.make(filename="world.txt", contents=b"# world")

    subject = FileReaderWriter()
    result = await subject.read([file_1, file_2])

    assert result == [
        BufferedFile(name="hello.txt", contents=b"# hello", path=None),
        BufferedFile(name="world.txt", contents=b"# world", path=None),
    ]


async def test_read_with_path(tmp_path: Path) -> None:
    """It should read paths."""
    path_1 = tmp_path / "hello.txt"
    path_2 = tmp_path / "world.txt"

    path_1.write_text("# hello")
    path_2.write_text("# world")

    subject = FileReaderWriter()
    result = await subject.read([path_1, path_2])

    assert result == [
        BufferedFile(name="hello.txt", contents=b"# hello", path=path_1),
        BufferedFile(name="world.txt", contents=b"# world", path=path_2),
    ]


async def test_read_missing_filename() -> None:
    """It should error if a file has no filename."""
    in_file = InputFile.make(filename="", contents=b"")

    subject = FileReaderWriter()

    with pytest.raises(FileReadError, match="missing a name"):
        await subject.read([in_file])


async def test_write(tmp_path: Path) -> None:
    """It should write buffered files to disk."""
    directory = tmp_path / "target"
    file_1 = BufferedFile(name="hello.txt", contents=b"# hello", path=None)
    file_2 = BufferedFile(name="world.txt", contents=b"# world", path=None)

    subject = FileReaderWriter()
    await subject.write(
        directory=directory,
        files=[file_1, file_2],
    )

    assert Path(tmp_path / "target" / "hello.txt").read_bytes() == b"# hello"
    assert Path(tmp_path / "target" / "world.txt").read_bytes() == b"# world"

"""Tests for opentrons.protocol_reader.file_reader_writer.FileReaderWriter."""
import io
from pathlib import Path

from opentrons.protocol_reader.input_file import InputFile, BufferedFile
from opentrons.protocol_reader.file_reader_writer import FileReaderWriter


async def test_read() -> None:
    """It should read file-likes."""
    file_1 = InputFile(filename="hello.txt", file=io.BytesIO(b"# hello"))
    file_2 = InputFile(filename="world.txt", file=io.BytesIO(b"# world"))

    subject = FileReaderWriter()
    result = await subject.read([file_1, file_2])

    assert result == [
        BufferedFile(name="hello.txt", contents=b"# hello"),
        BufferedFile(name="world.txt", contents=b"# world"),
    ]


async def test_write(tmp_path: Path) -> None:
    """It should write buffered files to disk."""
    directory = tmp_path / "target"
    file_1 = BufferedFile(name="hello.txt", contents=b"# hello")
    file_2 = BufferedFile(name="world.txt", contents=b"# world")

    subject = FileReaderWriter()
    await subject.write(
        directory=directory,
        files=[file_1, file_2],
    )

    assert Path(tmp_path / "target" / "hello.txt").read_bytes() == b"# hello"
    assert Path(tmp_path / "target" / "world.txt").read_bytes() == b"# world"

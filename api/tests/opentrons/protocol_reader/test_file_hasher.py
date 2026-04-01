"""Tests for opentrons.protocol_reader.file_hasher."""

from opentrons.protocol_reader import (
    BufferedFile,
    FileHasher,
)


async def test_hash_files_different_order() -> None:
    """It should return the same value when the same files are hashed in a different order."""
    file_1 = BufferedFile(
        name="some_protocol.py",
        contents=bytes("protocol content", encoding="utf-8"),
        path=None,
    )
    file_2 = BufferedFile(
        name="some_custom_labware.json",
        contents=bytes("labware content", encoding="utf-8"),
        path=None,
    )

    subject = FileHasher()
    result1 = await subject.hash([file_1, file_2])
    result2 = await subject.hash([file_2, file_1])

    assert result1 == result2


async def test_hash_files_same_contents_different_file_names() -> None:
    """It should return a different value when the same files are hashed and have different file names."""
    file_1 = BufferedFile(
        name="some_protocol.py",
        contents=bytes("some_content", encoding="utf-8"),
        path=None,
    )
    file_2 = BufferedFile(
        name="some_protocol.py.json",
        contents=bytes("some_content", encoding="utf-8"),
        path=None,
    )

    subject = FileHasher()
    result1 = await subject.hash([file_1])
    result2 = await subject.hash([file_2])

    assert result1 != result2


async def test_hash_files_swapped_names_and_content() -> None:
    """It should return a different value when name and contents are swapped."""
    file_1 = BufferedFile(
        name="some_protocol.json",
        contents=bytes("some_content", encoding="utf-8"),
        path=None,
    )
    file_2 = BufferedFile(
        name="some_protocol",
        contents=bytes(".jsonsome_content", encoding="utf-8"),
        path=None,
    )

    subject = FileHasher()
    result1 = await subject.hash([file_1])
    result2 = await subject.hash([file_2])

    assert result1 != result2

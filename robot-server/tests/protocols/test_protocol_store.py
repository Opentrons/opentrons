"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from decoy import matchers
from pathlib import Path
from fastapi import UploadFile
from typing import Iterator

from opentrons.protocol_runner import ProtocolFileType

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)


@pytest.fixture
def json_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with contents."""
    file_path = tmp_path / "protocol.json"
    file_path.write_text("{}\n", encoding="utf-8")

    with file_path.open() as json_file:
        yield UploadFile(filename="protocol.json", file=json_file)


@pytest.fixture
def python_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with contents."""
    file_path = tmp_path / "protocol.py"
    file_path.write_text("# my protocol\n", encoding="utf-8")

    with file_path.open() as python_file:
        yield UploadFile(filename="protocol.py", file=python_file)


@pytest.fixture
def subject(tmp_path: Path) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore(directory=tmp_path)


async def test_create_json_protocol(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()

    result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=[json_upload_file],
    )

    assert result == ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=created_at,
        files=[matchers.Anything()],
    )

    file_path = result.files[0]
    assert file_path.read_text("utf-8") == "{}\n"
    assert str(file_path).startswith(str(tmp_path))


async def test_create_python_protocol(
    tmp_path: Path,
    python_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()

    result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=[python_upload_file],
    )

    assert result == ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.PYTHON,
        created_at=created_at,
        files=[matchers.Anything()],
    )

    file_path = result.files[0]
    assert file_path.read_text("utf-8") == "# my protocol\n"
    assert str(file_path).startswith(str(tmp_path))


async def test_create_protocol_raises_for_missing_filename(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error if an input file is missing a filename."""
    created_at = datetime.now()
    invalid_file = UploadFile(filename="")

    with pytest.raises(ProtocolFileInvalidError):
        await subject.create(
            protocol_id="protocol-id",
            created_at=created_at,
            files=[invalid_file],
        )


async def test_get_protocol(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should get a single protocol from the store."""
    created_at = datetime.now()

    await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=[json_upload_file],
    )

    result = subject.get("protocol-id")

    assert result == ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=created_at,
        files=[matchers.Anything()],
    )

    file_path = result.files[0]
    assert file_path.read_text("utf-8") == "{}\n"


async def test_get_missing_protocol_raises(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when protocol not found."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_get_all_protocols(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should get all protocols existing in the store."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

    await subject.create(
        protocol_id="protocol-id-1",
        created_at=created_at_1,
        files=[json_upload_file],
    )

    await json_upload_file.seek(0)

    await subject.create(
        protocol_id="protocol-id-2",
        created_at=created_at_2,
        files=[json_upload_file],
    )

    result = subject.get_all()

    assert result == [
        ProtocolResource(
            protocol_id="protocol-id-1",
            protocol_type=ProtocolFileType.JSON,
            created_at=created_at_1,
            files=[matchers.Anything()],
        ),
        ProtocolResource(
            protocol_id="protocol-id-2",
            protocol_type=ProtocolFileType.JSON,
            created_at=created_at_2,
            files=[matchers.Anything()],
        ),
    ]


async def test_remove_protocol(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should remove specified protocol's files from store."""
    created_at = datetime.now()

    expected_result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=[json_upload_file],
    )

    result = subject.remove("protocol-id")

    assert result == expected_result
    assert result.files[0].exists() is False

    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_remove_missing_protocol_raises(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when trying to remove non-existent protocol."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.remove("protocol-id")

"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile
from typing import Iterator

from opentrons.file_runner import ProtocolFileType

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolStoreEntry,
    ProtocolNotFoundError,
)


@pytest.fixture
def json_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with contents."""
    file_path = tmp_path / "protocol.json"
    file_path.write_text("{}\n", encoding="utf-8")

    with file_path.open() as json_file:
        yield UploadFile(
            filename="protocol.json",
            file=json_file,
            content_type="application/json",
        )


@pytest.fixture
def subject(tmp_path: Path) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore(directory=tmp_path)


async def test_create_protocol(
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

    expected_file_path = tmp_path / "protocol-id" / "protocol.json"

    assert result == ProtocolStoreEntry(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=created_at,
        files=[expected_file_path],
    )

    assert expected_file_path.read_text("utf-8") == "{}\n"


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

    expected_file_path = tmp_path / "protocol-id" / "protocol.json"

    result = subject.get("protocol-id")

    assert result == ProtocolStoreEntry(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=created_at,
        files=[expected_file_path],
    )


async def test_get_missing_protocol_raises(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should get a single protocol from the store."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_get_all_protocols(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should get a single protocol from the store."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

    await subject.create(
        protocol_id="protocol-id-1",
        created_at=created_at_1,
        files=[json_upload_file],
    )

    await subject.create(
        protocol_id="protocol-id-2",
        created_at=created_at_2,
        files=[json_upload_file],
    )

    expected_file_path_1 = tmp_path / "protocol-id-1" / "protocol.json"
    expected_file_path_2 = tmp_path / "protocol-id-2" / "protocol.json"

    result = subject.get_all()

    assert result == [
        ProtocolStoreEntry(
            protocol_id="protocol-id-1",
            protocol_type=ProtocolFileType.JSON,
            created_at=created_at_1,
            files=[expected_file_path_1],
        ),
        ProtocolStoreEntry(
            protocol_id="protocol-id-2",
            protocol_type=ProtocolFileType.JSON,
            created_at=created_at_2,
            files=[expected_file_path_2],
        ),
    ]


async def test_remove_protocol(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()

    await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=[json_upload_file],
    )

    expected_dir_path = tmp_path / "protocol-id"
    expected_file_path = tmp_path / "protocol-id" / "protocol.json"

    subject.remove("protocol-id")

    assert expected_dir_path.exists() is False
    assert expected_file_path.exists() is False

    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_remove_missing_protocol_raises(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should get a single protocol from the store."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.remove("protocol-id")

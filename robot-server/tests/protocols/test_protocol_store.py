"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from pathlib import Path

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
)

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
)


@pytest.fixture
def subject(tmp_path: Path) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore(directory=tmp_path)


async def test_upsert_and_get_protocol(tmp_path: Path, subject: ProtocolStore) -> None:
    """It should store a single protocol."""
    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=tmp_path,
            main_file=(tmp_path / "abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
        ),
    )

    subject.upsert(protocol_resource)
    result = subject.get("protocol-id")

    assert result == protocol_resource


async def test_get_missing_protocol_raises(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when protocol not found."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_get_all_protocols(tmp_path: Path, subject: ProtocolStore) -> None:
    """It should get all protocols existing in the store."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

    resource_1 = ProtocolResource(
        protocol_id="abc",
        created_at=created_at_1,
        source=ProtocolSource(
            directory=tmp_path,
            main_file=(tmp_path / "abc.py"),
            config=PythonProtocolConfig(api_version=APIVersion(1234, 5678)),
            files=[],
            metadata={},
        ),
    )
    resource_2 = ProtocolResource(
        protocol_id="123",
        created_at=created_at_2,
        source=ProtocolSource(
            directory=tmp_path,
            main_file=(tmp_path / "abc.json"),
            config=JsonProtocolConfig(schema_version=1234),
            files=[],
            metadata={},
        ),
    )

    subject.upsert(resource_1)
    subject.upsert(resource_2)
    result = subject.get_all()

    assert result == [resource_1, resource_2]


async def test_remove_protocol(tmp_path: Path, subject: ProtocolStore) -> None:
    """It should remove specified protocol's files from store."""
    directory = tmp_path
    main_file = tmp_path / "protocol.json"

    main_file.touch()

    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=directory,
            main_file=main_file,
            config=JsonProtocolConfig(schema_version=123),
            files=[ProtocolSourceFile(name=main_file.name, role=ProtocolFileRole.MAIN)],
            metadata={},
        ),
    )

    subject.upsert(protocol_resource)
    subject.remove("protocol-id")

    assert directory.exists() is False
    assert main_file.exists() is False

    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_remove_missing_protocol_raises(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when trying to remove missing protocol."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.remove("protocol-id")

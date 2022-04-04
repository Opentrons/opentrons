"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from pathlib import Path
from typing import Generator

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    JsonProtocolConfig,
    PythonProtocolConfig,
)

from robot_server.db import create_in_memory_db
from robot_server.protocols.protocol_store import (
    add_tables_to_db,
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
)

from sqlalchemy.engine import Engine as SQLEngine


@pytest.fixture
def in_memory_sql_engine() -> Generator[SQLEngine, None, None]:
    """Return a set-up in-memory database to back the store."""
    with create_in_memory_db() as sql_engine:
        add_tables_to_db(sql_engine)
        yield sql_engine


@pytest.fixture
def subject(in_memory_sql_engine: SQLEngine) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore(sql_engine=in_memory_sql_engine)


async def test_insert_and_get_protocol(tmp_path: Path, subject: ProtocolStore) -> None:
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
            labware_definitions=[],
        ),
    )

    subject.insert(protocol_resource)
    result = subject.get("protocol-id")

    assert result == protocol_resource


async def test_insert_with_duplicate_key_raises(
    tmp_path: Path, subject: ProtocolStore
) -> None:
    """It should raise an error when the given protocol ID is not unique."""
    protocol_resource_1 = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=tmp_path,
            main_file=(tmp_path / "abc.json"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
    )
    protocol_resource_2 = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2022, month=2, day=2),
        source=ProtocolSource(
            directory=tmp_path,
            main_file=(tmp_path / "def.json"),
            config=JsonProtocolConfig(schema_version=456),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
    )
    subject.insert(protocol_resource_1)

    # Don't care what it raises. Exception type is not part of the public interface.
    # We just care that it doesn't corrupt the database.
    with pytest.raises(Exception):
        subject.insert(protocol_resource_2)

    assert subject.get_all() == [protocol_resource_1]  # No traces of the failed insert.


async def test_get_missing_protocol_raises(subject: ProtocolStore) -> None:
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
            labware_definitions=[],
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
            labware_definitions=[],
        ),
    )

    subject.insert(resource_1)
    subject.insert(resource_2)
    result = subject.get_all()

    assert result == [resource_1, resource_2]


async def test_remove_protocol(tmp_path: Path, subject: ProtocolStore) -> None:
    """It should remove specified protocol's files from store."""
    directory = tmp_path
    main_file = tmp_path / "protocol.json"
    other_file = tmp_path / "labware.json"

    main_file.touch()
    other_file.touch()

    protocol_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=directory,
            main_file=main_file,
            config=JsonProtocolConfig(schema_version=123),
            files=[
                ProtocolSourceFile(path=main_file, role=ProtocolFileRole.MAIN),
                ProtocolSourceFile(path=other_file, role=ProtocolFileRole.LABWARE),
            ],
            metadata={},
            labware_definitions=[],
        ),
    )

    subject.insert(protocol_resource)
    subject.remove("protocol-id")

    assert directory.exists() is False
    assert main_file.exists() is False
    assert other_file.exists() is False

    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_remove_missing_protocol_raises(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when trying to remove missing protocol."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.remove("protocol-id")

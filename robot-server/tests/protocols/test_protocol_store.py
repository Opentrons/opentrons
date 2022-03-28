"""Tests for the ProtocolStore interface."""
from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy

from fastapi import UploadFile

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolReader,
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
def protocol_reader(decoy: Decoy) -> ProtocolReader:
    """Return a mock in the shape of a ProtocolReader."""
    return decoy.mock(cls=ProtocolReader)


@pytest.fixture
async def subject(
    protocol_reader: ProtocolReader,
    # For pytest-aiohttp. https://github.com/Opentrons/opentrons/issues/8176
    loop: object
) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return await ProtocolStore.create_or_rehydrate(protocol_reader=protocol_reader)


async def test_insert_and_get_protocol(
    decoy: Decoy,
    subject: ProtocolStore,
    tmp_path: Path,
    protocol_reader: ProtocolReader,
) -> None:
    """It should store a single protocol."""
    upload_files = [UploadFile("foo.bar")]
    source = ProtocolSource(
        directory=tmp_path,
        main_file=(tmp_path / "abc.json"),
        config=JsonProtocolConfig(schema_version=123),
        files=[],
        metadata={},
        labware_definitions=[],
    )
    decoy.when(await protocol_reader.read(name="protocol-id", files=upload_files)).then_return(source)

    expected_resource = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        source=source,
    )

    insert_result = await subject.insert(
        id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        uploaded_protocol_files=upload_files,
    )
    get_result = await subject.get("protocol-id")

    assert insert_result == get_result == expected_resource


async def test_get_missing_protocol_raises(subject: ProtocolStore) -> None:
    """It should raise an error when protocol not found."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        await subject.get("protocol-id")


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

    await subject.insert(resource_1)
    await subject.insert(resource_2)
    result = await subject.get_all()

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
            labware_definitions=[],
        ),
    )

    await subject.insert(protocol_resource)
    await subject.remove("protocol-id")

    assert directory.exists() is False
    assert main_file.exists() is False

    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        await subject.get("protocol-id")


async def test_remove_missing_protocol_raises(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when trying to remove missing protocol."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        await subject.remove("protocol-id")

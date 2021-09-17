"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from decoy import matchers
from pathlib import Path
from fastapi import UploadFile
from typing import Iterator, List

from opentrons.protocol_runner.pre_analysis import (
    JsonPreAnalysis,
    PythonPreAnalysis,
)

from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
    ProtocolNotFoundError,
    ProtocolFileInvalidError,
)


@pytest.fixture
def json_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with JSON contents."""
    file_path = tmp_path / "my json file.json"
    file_path.write_text("{}\n", encoding="utf-8")

    with file_path.open() as json_file:
        yield UploadFile(filename="my json file.json", file=json_file)


@pytest.fixture
def python_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with Python contents."""
    file_path = tmp_path / "my python file.py"
    file_path.write_text("# my protocol\n", encoding="utf-8")

    with file_path.open() as python_file:
        yield UploadFile(filename="my python file.py", file=python_file)


# todo(mm, 2021-09-16): Don't use JSON and Python files here.
# This unit shouldn't be reading these files, so it shouldn't care even if we pass it
# arbitrary binary junk.
@pytest.fixture
def upload_files(
    python_upload_file: UploadFile, json_upload_file: UploadFile
) -> List[UploadFile]:
    """Return a list of arbitrary UploadFiles."""
    return [python_upload_file, json_upload_file]


@pytest.fixture
def subject(tmp_path: Path) -> ProtocolStore:
    """Get a ProtocolStore test subject."""
    return ProtocolStore(directory=tmp_path)


async def test_create_and_get_json_protocol(
    tmp_path: Path,
    upload_files: List[UploadFile],
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()
    pre_analysis = JsonPreAnalysis(
        schema_version=123, metadata={"this_is_fake_metadata": True}
    )

    creation_result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=upload_files,
        pre_analysis=pre_analysis,
    )

    assert creation_result == ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=pre_analysis,
        created_at=created_at,
        files=matchers.Anything(),
    )

    for file_path in creation_result.files:
        assert str(file_path).startswith(str(tmp_path))

    assert subject.get("protocol-id") == creation_result


async def test_create_and_get_python_protocol(
    tmp_path: Path,
    upload_files: List[UploadFile],
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()
    pre_analysis = PythonPreAnalysis(
        api_level="9001.0", metadata={"this_is_fake_metadata": True}
    )

    creation_result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=upload_files,
        pre_analysis=pre_analysis,
    )

    assert creation_result == ProtocolResource(
        protocol_id="protocol-id",
        pre_analysis=pre_analysis,
        created_at=created_at,
        files=matchers.Anything(),
    )

    for file_path in creation_result.files:
        assert str(file_path).startswith(str(tmp_path))

    assert subject.get("protocol-id") == creation_result


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
            pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
        )


async def test_get_missing_protocol_raises(
    tmp_path: Path,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when protocol not found."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


async def test_get_all_protocols(
    tmp_path: Path,
    upload_files: List[UploadFile],
    subject: ProtocolStore,
) -> None:
    """It should get all protocols existing in the store."""
    created_at_1 = datetime.now()
    created_at_2 = datetime.now()

    await subject.create(
        protocol_id="protocol-id-1",
        created_at=created_at_1,
        files=upload_files,
        pre_analysis=JsonPreAnalysis(
            schema_version=123,
            metadata={"protocol1Metadata": "hello"},
        ),
    )

    # The first subject.create() may have read the upload files.
    # Reset them so the second subject.create() can read them, too.
    for f in upload_files:
        await f.seek(0)

    await subject.create(
        protocol_id="protocol-id-2",
        created_at=created_at_2,
        files=upload_files,
        pre_analysis=JsonPreAnalysis(
            schema_version=123,
            metadata={"protocol2Metadata": "hello"},
        ),
    )

    result = subject.get_all()

    assert result == [
        ProtocolResource(
            protocol_id="protocol-id-1",
            created_at=created_at_1,
            files=matchers.Anything(),
            pre_analysis=JsonPreAnalysis(
                schema_version=123,
                metadata={"protocol1Metadata": "hello"},
            ),
        ),
        ProtocolResource(
            protocol_id="protocol-id-2",
            created_at=created_at_2,
            files=matchers.Anything(),
            pre_analysis=JsonPreAnalysis(
                schema_version=123,
                metadata={"protocol2Metadata": "hello"},
            ),
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
        pre_analysis=JsonPreAnalysis(schema_version=123, metadata={}),
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

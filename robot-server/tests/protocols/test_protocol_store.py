"""Tests for the ProtocolStore interface."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers
from pathlib import Path
from fastapi import UploadFile
from typing import Iterator, List

from opentrons.protocol_runner import ProtocolFileType
from opentrons.protocol_runner.pre_analysis import (
    PreAnalyzer,
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
    file_path = tmp_path / "protocol.json"
    file_path.write_text("{}\n", encoding="utf-8")

    with file_path.open() as json_file:
        yield UploadFile(filename="protocol.json", file=json_file)


@pytest.fixture
def python_upload_file(tmp_path: Path) -> Iterator[UploadFile]:
    """Get an UploadFile with Python contents."""
    file_path = tmp_path / "protocol.py"
    file_path.write_text("# my protocol\n", encoding="utf-8")

    with file_path.open() as python_file:
        yield UploadFile(filename="protocol.py", file=python_file)


# Todo: Add spaces and maybe Unicode characters into one of these filenames
# Remove meaning of files; this layer doesn't care if they're JSON or Python
@pytest.fixture
def upload_files(
    python_upload_file: UploadFile, json_upload_file: UploadFile
) -> List[UploadFile]:
    """Return a list of arbitrary UploadFiles."""
    return [python_upload_file, json_upload_file]


@pytest.fixture
def pre_analyzer(decoy: Decoy) -> PreAnalyzer:
    """Return a mock PreAnalyzer."""
    return decoy.mock(cls=PreAnalyzer)


@pytest.fixture
def subject(tmp_path: Path, pre_analyzer: PreAnalyzer) -> ProtocolStore:
    """Get a ProtocolStore test subject, with mocked dependencies."""
    return ProtocolStore(
        tmp_path,
        pre_analyzer,
    )


async def test_create_and_get_json_protocol(
    decoy: Decoy,
    tmp_path: Path,
    upload_files: List[UploadFile],
    pre_analyzer: PreAnalyzer,
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()
    pre_analysis = JsonPreAnalysis(metadata={"this_is_fake_metadata": True})

    decoy.when(pre_analyzer.analyze(matchers.Anything())).then_return(pre_analysis)

    creation_result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=upload_files,
    )

    assert creation_result == ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        pre_analysis=pre_analysis,
        created_at=created_at,
        files=matchers.Anything(),
    )

    for file_path in creation_result.files:
        assert str(file_path).startswith(str(tmp_path))

    assert subject.get("protocol-id") == creation_result


async def test_create_and_get_python_protocol(
    decoy: Decoy,
    tmp_path: Path,
    upload_files: List[UploadFile],
    pre_analyzer: PreAnalyzer,
    subject: ProtocolStore,
) -> None:
    """It should save a single protocol to disk."""
    created_at = datetime.now()
    pre_analysis = PythonPreAnalysis(
        api_level="9001.0", metadata={"this_is_fake_metadata": True}
    )

    decoy.when(pre_analyzer.analyze(matchers.Anything())).then_return(pre_analysis)

    creation_result = await subject.create(
        protocol_id="protocol-id",
        created_at=created_at,
        files=upload_files,
    )

    assert creation_result == ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.PYTHON,
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
        )


async def test_get_missing_protocol_raises(
    tmp_path: Path,
    json_upload_file: UploadFile,
    subject: ProtocolStore,
) -> None:
    """It should raise an error when protocol not found."""
    with pytest.raises(ProtocolNotFoundError, match="protocol-id"):
        subject.get("protocol-id")


# async def test_get_all_protocols(
#     tmp_path: Path,
#     json_upload_file: UploadFile,
#     subject: ProtocolStore,
# ) -> None:
#     """It should get all protocols existing in the store."""
#     created_at_1 = datetime.now()
#     created_at_2 = datetime.now()

#     await subject.create(
#         protocol_id="protocol-id-1",
#         created_at=created_at_1,
#         files=[json_upload_file],
#     )

#     await json_upload_file.seek(0)

#     await subject.create(
#         protocol_id="protocol-id-2",
#         created_at=created_at_2,
#         files=[json_upload_file],
#     )

#     result = subject.get_all()

#     assert result == [
#         ProtocolResource(
#             protocol_id="protocol-id-1",
#             protocol_type=ProtocolFileType.JSON,
#             pre_analysis=NotImplemented,  # type: ignore
#             created_at=created_at_1,
#             files=[matchers.Anything()],
#         ),
#         ProtocolResource(
#             protocol_id="protocol-id-2",
#             protocol_type=ProtocolFileType.JSON,
#             pre_analysis=NotImplemented,  # type: ignore
#             created_at=created_at_2,
#             files=[matchers.Anything()],
#         ),
#     ]


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

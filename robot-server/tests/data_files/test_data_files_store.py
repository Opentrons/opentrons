"""Tests for the DataFilesStore interface."""
from pathlib import Path
import sqlalchemy

import pytest
from datetime import datetime, timezone

from decoy import Decoy

from opentrons_shared_data.data_files import (
    InputDataFileInfo,
    OutputDataFileInfo,
    CmdDataFileInfo,
)
from opentrons.protocol_reader import ProtocolSource, JsonProtocolConfig
from sqlalchemy.engine import Engine as SQLEngine

from robot_server.data_files.data_files_store import (
    DataFilesStore,
)
from opentrons_shared_data.data_files import DataFileInfo, MimeType
from robot_server.deletion_planner import FileUsageInfo
from robot_server.data_files.models import (
    FileIdNotFoundError,
    FileInUseError,
)
from robot_server.persistence.tables import run_table
from robot_server.protocols.analysis_memcache import MemoryCache
from robot_server.protocols.analysis_models import (
    CompletedAnalysis,
    AnalysisStatus,
    AnalysisResult,
)
from robot_server.protocols.completed_analysis_store import (
    CompletedAnalysisStore,
    CompletedAnalysisResource,
)
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolResource, ProtocolStore
from robot_server.protocols.rtp_resources import CSVParameterResource


@pytest.fixture
def data_files_directory(tmp_path: Path) -> Path:
    """Return a directory for storing data files."""
    subdirectory = tmp_path / "data_files"
    subdirectory.mkdir()
    return subdirectory


@pytest.fixture
def images_directory(tmp_path: Path) -> Path:
    """Return a directory for storing camera capture files."""
    subdirectory = tmp_path / "images"
    subdirectory.mkdir()
    return subdirectory


@pytest.fixture
def subject(
    sql_engine: SQLEngine, data_files_directory: Path, images_directory: Path
) -> DataFilesStore:
    """Get a DataFilesStore test subject."""
    return DataFilesStore(
        sql_engine=sql_engine,
        data_files_directory=data_files_directory,
        images_directory=images_directory,
    )


@pytest.fixture
def completed_analysis_store(
    decoy: Decoy,
    sql_engine: SQLEngine,
) -> CompletedAnalysisStore:
    """Get a `CompletedAnalysisStore` linked to the same database as the subject under test."""
    return CompletedAnalysisStore(sql_engine, decoy.mock(cls=MemoryCache), "2")


@pytest.fixture
def protocol_store(sql_engine: SQLEngine) -> ProtocolStore:
    """Return a `ProtocolStore` linked to the same database as the subject under test."""
    return ProtocolStore.create_empty(sql_engine=sql_engine)


def _get_sample_protocol_resource(protocol_id: str) -> ProtocolResource:
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2024, month=1, day=1, tzinfo=timezone.utc),
        source=ProtocolSource(
            directory=None,
            main_file=Path("/dev/null"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            robot_type="OT-2 Standard",
            content_hash="abc1",
        ),
        protocol_key=None,
        protocol_kind=ProtocolKind.STANDARD,
    )


def _get_sample_analysis_resource(
    protocol_id: str, analysis_id: str
) -> CompletedAnalysisResource:
    return CompletedAnalysisResource(
        analysis_id,
        protocol_id,
        "2",
        CompletedAnalysis(
            id="analysis-id",
            status=AnalysisStatus.COMPLETED,
            result=AnalysisResult.OK,
            pipettes=[],
            labware=[],
            modules=[],
            commands=[],
            errors=[],
            liquids=[],
            liquidClasses=[],
        ),
    )


def _create_run_in_db(sql_engine: SQLEngine, run_id: str) -> None:
    """Helper to create a run directly in the database."""
    with sql_engine.begin() as transaction:
        transaction.execute(
            sqlalchemy.insert(run_table).values(
                id=run_id,
                created_at=datetime(year=2024, month=1, day=1, tzinfo=timezone.utc),
                protocol_id=None,  # No protocol association needed for these tests
            )
        )


async def test_insert_data_file_info_and_fetch_by_hash(
    subject: DataFilesStore,
) -> None:
    """It should add the data file info to database."""
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        generated=False,
        stored=True,
        path="data_files/file-id/file-name",
    )
    assert subject.get_file_info_by_hash("abc123") is None
    await subject.insert(data_file_info)
    assert subject.get_file_info_by_hash("abc123") == data_file_info


async def test_insert_file_info_with_existing_id(
    subject: DataFilesStore,
) -> None:
    """It should raise an error when trying to add the same file ID to database."""
    data_file_info1 = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,
        stored=True,
    )
    data_file_info2 = DataFileInfo(
        id="file-id",
        name="file-name2",
        file_hash="abc1234",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name2",
        generated=False,
        stored=True,
    )
    await subject.insert(data_file_info1)
    with pytest.raises(Exception):
        await subject.insert(data_file_info2)


async def test_insert_data_file_info_and_get_by_id(
    subject: DataFilesStore,
) -> None:
    """It should get the inserted data file info from the database."""
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc",
        created_at=datetime(year=2024, month=7, day=15, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,
        stored=True,
    )
    await subject.insert(data_file_info)
    assert subject.get("file-id") == data_file_info


def test_get_by_id_raises(
    subject: DataFilesStore,
) -> None:
    """It should raise if the requested data file id does not exist."""
    with pytest.raises(FileIdNotFoundError):
        assert subject.get("file-id")


async def test_get_usage_info(
    subject: DataFilesStore,
    protocol_store: ProtocolStore,
    completed_analysis_store: CompletedAnalysisStore,
) -> None:
    """It should return the usage info of all the data files in store."""
    protocol_resource = _get_sample_protocol_resource("protocol-id")
    analysis_resource1 = _get_sample_analysis_resource("protocol-id", "analysis-id")
    csv_param_resource = [
        CSVParameterResource(
            analysis_id="analysis-id",
            parameter_variable_name="baz",
            file_id="file-id-1",
        )
    ]
    data_file_1 = DataFileInfo(
        id="file-id-1",
        name="file-name",
        file_hash="abc",
        created_at=datetime(year=2024, month=7, day=15, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id-1/file-name",
        generated=False,
        stored=True,
    )
    data_file_2 = DataFileInfo(
        id="file-id-2",
        name="file-name",
        file_hash="xyz",
        created_at=datetime(year=2024, month=7, day=15, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id-2/file-name",
        generated=False,
        stored=True,
    )
    await subject.insert(data_file_1)
    await subject.insert(data_file_2)
    protocol_store.insert(protocol_resource)
    await completed_analysis_store.make_room_and_add(
        completed_analysis_resource=analysis_resource1,
        primitive_rtp_resources=[],
        csv_rtp_resources=csv_param_resource,
    )
    assert subject.get_usage_info() == [
        FileUsageInfo("file-id-1", used_by_run_or_analysis=True),
        FileUsageInfo("file-id-2", used_by_run_or_analysis=False),
    ]


async def test_remove_raises_in_file_in_use(
    subject: DataFilesStore,
    data_files_directory: Path,
    protocol_store: ProtocolStore,
    completed_analysis_store: CompletedAnalysisStore,
) -> None:
    """It should raise `FileInUseError` when trying to remove a file that's in use."""
    file_dir = data_files_directory.joinpath("file-id")
    file_dir.mkdir()
    data_file = file_dir / "abc.csv"
    data_file.touch()

    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,
        stored=True,
    )

    protocol_resource = _get_sample_protocol_resource("protocol-id")
    analysis_resource = _get_sample_analysis_resource("protocol-id", "analysis-id")
    csv_param_resource = [
        CSVParameterResource(
            analysis_id="analysis-id",
            parameter_variable_name="foo",
            file_id="file-id",
        )
    ]

    await subject.insert(data_file_info)
    protocol_store.insert(protocol_resource)
    await completed_analysis_store.make_room_and_add(
        completed_analysis_resource=analysis_resource,
        primitive_rtp_resources=[],
        csv_rtp_resources=csv_param_resource,
    )

    expected_error_message = "Cannot remove file file-id as it is being used in existing analyses: {'analysis-id'}."
    with pytest.raises(FileInUseError, match=expected_error_message):
        subject.remove_stored(file_id="file-id")


def test_remove_raise_for_nonexistent_id(subject: DataFilesStore) -> None:
    """It should raise FileIdNotFound error."""
    with pytest.raises(FileIdNotFoundError, match="Data file file-id was not found."):
        subject.remove_stored(file_id="file-id")


async def test_insert_input_file(
    subject: DataFilesStore,
) -> None:
    """It should insert input file info into the database."""
    _create_run_in_db(subject._sql_engine, "run-id")
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,
        stored=True,
    )
    await subject.insert(data_file_info)

    input_file_info = InputDataFileInfo(
        file_id="file-id",
        run_id="run-id",
        command_info=None,
    )
    await subject.insert_input_file(input_file_info)

    retrieved = subject.get_io_file_info("file-id", "run-id")
    assert isinstance(retrieved, InputDataFileInfo)
    assert retrieved.file_id == "file-id"
    assert retrieved.run_id == "run-id"
    assert retrieved.command_info is None


async def test_insert_output_file(
    subject: DataFilesStore,
) -> None:
    """It should insert output file info into the database."""
    _create_run_in_db(subject._sql_engine, "run-id")
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.IMAGE_JPEG,
        path="data_files/file-id/file-name.jpeg",
        generated=True,
        stored=True,
    )
    await subject.insert(data_file_info)

    output_file_info = OutputDataFileInfo(
        file_id="file-id",
        run_id="run-id",
        command_info=CmdDataFileInfo(
            command_id="command-id",
            prev_command_id="prev-command-id",
        ),
    )
    await subject.insert_output_file(output_file_info)

    retrieved = subject.get_io_file_info("file-id", "run-id")
    assert isinstance(retrieved, OutputDataFileInfo)
    assert retrieved.file_id == "file-id"
    assert retrieved.run_id == "run-id"
    assert retrieved.command_info.command_id == "command-id"
    assert retrieved.command_info.prev_command_id == "prev-command-id"


async def test_get_io_file_info_input_file(
    subject: DataFilesStore,
) -> None:
    """It should retrieve an io file info by file_id and run_id."""
    _create_run_in_db(subject._sql_engine, "run-id")
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,
        stored=True,
    )
    await subject.insert(data_file_info)

    input_file_info = InputDataFileInfo(
        file_id="file-id",
        run_id="run-id",
        command_info=None,
    )
    await subject.insert_input_file(input_file_info)

    retrieved = subject.get_io_file_info("file-id", "run-id")
    assert isinstance(retrieved, InputDataFileInfo)
    assert retrieved.file_id == "file-id"
    assert retrieved.run_id == "run-id"


async def test_remove_input_only_file_deletes_completely(
    subject: DataFilesStore,
    data_files_directory: Path,
) -> None:
    """It should completely delete input-only files from the database."""
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=False,  # Input file, not generated
        stored=True,
    )
    await subject.insert(data_file_info)

    subject.remove_stored(file_id="file-id")

    with pytest.raises(FileIdNotFoundError):
        subject.get("file-id")


async def test_remove_output_file_marks_not_stored(
    subject: DataFilesStore,
    data_files_directory: Path,
) -> None:
    """It should mark output files as not stored but preserve them in the database."""
    _create_run_in_db(subject._sql_engine, "run-id")

    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name.jpeg",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.IMAGE_JPEG,
        path="data_files/file-id/file-name.jpeg",
        generated=True,  # Generated output file
        stored=True,
    )
    await subject.insert(data_file_info)

    output_file_info = OutputDataFileInfo(
        file_id="file-id",
        run_id="run-id",
        command_info=CmdDataFileInfo(
            command_id="command-id",
            prev_command_id="prev-command-id",
        ),
    )
    await subject.insert_output_file(output_file_info)

    subject.remove_stored(file_id="file-id")

    retrieved = subject.get("file-id")
    assert retrieved.id == "file-id"
    assert retrieved.stored is False
    assert retrieved.name == "file-name.jpeg"
    assert retrieved.file_hash == "abc123"

    output_info = subject.get_io_file_info("file-id", "run-id")
    assert isinstance(output_info, OutputDataFileInfo)
    assert output_info.file_id == "file-id"


async def test_remove_file_with_input_and_output_associations(
    subject: DataFilesStore,
    data_files_directory: Path,
) -> None:
    """It should remove input associations but preserve output associations."""
    _create_run_in_db(subject._sql_engine, "run-id-1")
    _create_run_in_db(subject._sql_engine, "run-id-2")

    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
        mime_type=MimeType.TEXT_CSV,
        path="data_files/file-id/file-name",
        generated=True,
        stored=True,
    )
    await subject.insert(data_file_info)

    input_file_info = InputDataFileInfo(
        file_id="file-id",
        run_id="run-id-1",
        command_info=None,
    )
    await subject.insert_input_file(input_file_info)

    output_file_info = OutputDataFileInfo(
        file_id="file-id",
        run_id="run-id-2",
        command_info=CmdDataFileInfo(
            command_id="command-id",
            prev_command_id="prev-command-id",
        ),
    )
    await subject.insert_output_file(output_file_info)

    subject.remove_stored(file_id="file-id")

    retrieved = subject.get("file-id")
    assert retrieved.stored is False

    with pytest.raises(FileIdNotFoundError):
        subject.get_io_file_info("file-id", "run-id-1")

    output_info = subject.get_io_file_info("file-id", "run-id-2")
    assert isinstance(output_info, OutputDataFileInfo)

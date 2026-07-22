"""Tests for data_files router."""

import io
from datetime import datetime
from pathlib import Path
from typing import List

import pytest
from decoy import Decoy
from fastapi import UploadFile

from opentrons.protocol_reader import BufferedFile, FileHasher, FileReaderWriter
from opentrons_shared_data.data_files import (
    CmdDataFileInfo,
    DataFileInfo,
    DataFileInfoWithCommands,
    DataFileSource,
    MimeType,
)
from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, SimpleEmptyBody

from robot_server.data_files.data_files_store import (
    DataFilesByRunInfo,
    DataFilesStore,
    DataFileWithCommandsInfoSlice,
)
from robot_server.data_files.file_auto_deleter import DataFileAutoDeleter
from robot_server.data_files.models import (
    DataFile,
    FileIdNotFoundError,
    FileInUseError,
)
from robot_server.data_files.router import (
    delete_file_by_id,
    delete_run_images,
    download_run_images,
    get_all_data_files,
    get_data_file,
    get_data_file_info_by_id,
    get_data_files_by_run_id,
    get_run_image_metadata,
    upload_data_file,
)
from robot_server.errors.error_responses import ApiError
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import RunStore
from robot_server.service.notifications.publishers import DataFilePublisher


@pytest.fixture
def data_files_store(decoy: Decoy) -> DataFilesStore:
    """Get a mocked out DataFilesStore interface."""
    return decoy.mock(cls=DataFilesStore)


@pytest.fixture
def file_hasher(decoy: Decoy) -> FileHasher:
    """Get a mocked out FileHasher."""
    return decoy.mock(cls=FileHasher)


@pytest.fixture
def file_reader_writer(decoy: Decoy) -> FileReaderWriter:
    """Get a mocked out FileReaderWriter."""
    return decoy.mock(cls=FileReaderWriter)


@pytest.fixture
def file_auto_deleter(decoy: Decoy) -> DataFileAutoDeleter:
    """Get a mocked out DataFileAutoDeleter."""
    return decoy.mock(cls=DataFileAutoDeleter)


@pytest.fixture
def run_data_manager(decoy: Decoy) -> RunDataManager:
    """Get a mocked out RunDataManager."""
    return decoy.mock(cls=RunDataManager)


@pytest.fixture
def run_store(decoy: Decoy) -> RunStore:
    """Get a mocked out RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture
def protocol_store(decoy: Decoy) -> ProtocolStore:
    """Get a mocked out ProtocolStore."""
    return decoy.mock(cls=ProtocolStore)


@pytest.fixture
def data_file_publisher(decoy: Decoy) -> DataFilePublisher:
    """Get a mocked out DataFilePublisher."""
    return decoy.mock(cls=DataFilePublisher)


async def test_upload_new_data_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_auto_deleter: DataFileAutoDeleter,
    file_hasher: FileHasher,
) -> None:
    """It should store an uploaded data file to persistent storage & update the database."""
    data_files_directory = Path("/dev/null")
    content = bytes("some_content", encoding="utf-8")
    uploaded_file = io.BytesIO(content)

    data_file = UploadFile(filename="abc.csv", file=uploaded_file)
    buffered_file = BufferedFile(name="abc.csv", contents=content, path=None)

    decoy.when(
        await file_reader_writer.read(files=[data_file])  # type: ignore[list-item]
    ).then_return([buffered_file])
    decoy.when(await file_hasher.hash(files=[buffered_file])).then_return("abc123")
    decoy.when(data_files_store.get_file_info_by_hash("abc123")).then_return(None)

    result = await upload_data_file(
        file=data_file,
        file_path=None,
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
        data_file_auto_deleter=file_auto_deleter,
        file_hasher=file_hasher,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )

    assert result.content.data == DataFile(
        id="data-file-id",
        name="abc.csv",
        createdAt=datetime(year=2024, month=6, day=18),
        source=DataFileSource.UPLOADED,
    )
    assert result.status_code == 201
    decoy.verify(
        await file_auto_deleter.make_room_for_new_file(),
        await file_reader_writer.write(
            directory=data_files_directory / "data-file-id", files=[buffered_file]
        ),
        await data_files_store.insert(
            DataFileInfo(
                id="data-file-id",
                name="abc.csv",
                file_hash="abc123",
                created_at=datetime(year=2024, month=6, day=18),
                mime_type=MimeType.TEXT_CSV,
                generated=False,
                stored=True,
                path=f"{data_files_directory}/data-file-id/abc.csv",
            )
        ),
    )


async def test_upload_existing_data_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    file_auto_deleter: DataFileAutoDeleter,
) -> None:
    """It should return the existing file info."""
    data_files_directory = Path("/dev/null")
    content = bytes("some_content", encoding="utf-8")
    uploaded_file = io.BytesIO(content)

    data_file = UploadFile(filename="abc.csv", file=uploaded_file)
    buffered_file = BufferedFile(name="abc.csv", contents=content, path=None)

    decoy.when(
        await file_reader_writer.read(files=[data_file])  # type: ignore[list-item]
    ).then_return([buffered_file])
    decoy.when(await file_hasher.hash(files=[buffered_file])).then_return("abc123")
    decoy.when(data_files_store.get_file_info_by_hash("abc123")).then_return(
        DataFileInfo(
            id="existing-file-id",
            name="abc.csv",
            file_hash="abc123",
            created_at=datetime(year=2023, month=6, day=18),
            mime_type=MimeType.TEXT_CSV,
            path=f"{data_files_directory}/existing-file-id/abc.csv",
            stored=True,
            generated=False,
        )
    )

    result = await upload_data_file(
        file=data_file,
        file_path=None,
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
        file_hasher=file_hasher,
        data_file_auto_deleter=file_auto_deleter,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )
    assert result.status_code == 200
    assert result.content.data == DataFile(
        id="existing-file-id",
        name="abc.csv",
        createdAt=datetime(year=2023, month=6, day=18),
        source=DataFileSource.UPLOADED,
    )


async def test_upload_new_data_file_path(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    file_auto_deleter: DataFileAutoDeleter,
) -> None:
    """It should store the data file from path to persistent storage & update the database."""
    data_files_directory = Path("/dev/null")
    content = bytes("some_content", encoding="utf-8")
    buffered_file = BufferedFile(name="abc.csv", contents=content, path=None)

    decoy.when(
        await file_reader_writer.read(files=[Path("/data/my_data_file.csv")])
    ).then_return([buffered_file])
    decoy.when(await file_hasher.hash(files=[buffered_file])).then_return("abc123")
    decoy.when(data_files_store.get_file_info_by_hash("abc123")).then_return(None)

    result = await upload_data_file(
        file=None,
        file_path="/data/my_data_file.csv",
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
        data_file_auto_deleter=file_auto_deleter,
        file_hasher=file_hasher,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )
    assert result.status_code == 201
    assert result.content.data == DataFile(
        id="data-file-id",
        name="abc.csv",
        createdAt=datetime(year=2024, month=6, day=18),
        source=DataFileSource.UPLOADED,
    )
    decoy.verify(
        await file_reader_writer.write(
            directory=data_files_directory / "data-file-id", files=[buffered_file]
        ),
        await data_files_store.insert(
            DataFileInfo(
                id="data-file-id",
                name="abc.csv",
                file_hash="abc123",
                created_at=datetime(year=2024, month=6, day=18),
                mime_type=MimeType.TEXT_CSV,
                path=f"{data_files_directory}/data-file-id/abc.csv",
                stored=True,
                generated=False,
            )
        ),
    )


async def test_upload_non_existent_file_path(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    file_auto_deleter: DataFileAutoDeleter,
) -> None:
    """It should store the data file from path to persistent storage & update the database."""
    data_files_directory = Path("/dev/null")
    decoy.when(
        await file_reader_writer.read(files=[Path("/data/my_data_file.csv")])
    ).then_raise(FileNotFoundError("Uh oh!"))

    with pytest.raises(ApiError) as exc_info:
        await upload_data_file(
            file=None,
            file_path="/data/my_data_file.csv",
            data_files_directory=data_files_directory,
            data_files_store=data_files_store,
            file_reader_writer=file_reader_writer,
            file_hasher=file_hasher,
            data_file_auto_deleter=file_auto_deleter,
            file_id="data-file-id",
            created_at=datetime(year=2024, month=6, day=18),
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "FileNotFound"


async def test_upload_non_csv_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
    file_auto_deleter: DataFileAutoDeleter,
) -> None:
    """It should store the data file from path to persistent storage & update the database."""
    data_files_directory = Path("/dev/null")
    content = bytes("some_content", encoding="utf-8")
    buffered_file = BufferedFile(name="abc.png", contents=content, path=None)

    decoy.when(
        await file_reader_writer.read(files=[Path("/data/my_data_file.csv")])
    ).then_return([buffered_file])
    with pytest.raises(ApiError) as exc_info:
        await upload_data_file(
            file=None,
            file_path="/data/my_data_file.csv",
            data_files_directory=data_files_directory,
            data_files_store=data_files_store,
            file_reader_writer=file_reader_writer,
            file_hasher=file_hasher,
            data_file_auto_deleter=file_auto_deleter,
            file_id="data-file-id",
            created_at=datetime(year=2024, month=6, day=18),
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.content["errors"][0]["id"] == "UnexpectedFileFormat"


async def test_get_data_file_info(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should get the data file info from the provided data file id."""
    decoy.when(data_files_store.get("data-file-id")).then_return(
        DataFileInfo(
            id="qwerty",
            name="abc.xyz",
            file_hash="123",
            created_at=datetime(year=2024, month=7, day=15),
            mime_type=MimeType.TEXT_CSV,
            generated=False,
            stored=True,
            path="data_files/qwerty/abc.xyz",
        )
    )

    result = await get_data_file_info_by_id(
        "data-file-id",
        data_files_store=data_files_store,
    )
    assert result.status_code == 200
    assert result.content.data == DataFile(
        id="qwerty",
        name="abc.xyz",
        createdAt=datetime(year=2024, month=7, day=15),
        source=DataFileSource.UPLOADED,
    )


async def test_get_data_file_info_nonexistant(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should return a 404 with a FileIdNotFound error."""
    decoy.when(data_files_store.get("data-file-id")).then_raise(
        FileIdNotFoundError("oops")
    )

    with pytest.raises(ApiError) as exc_info:
        await get_data_file_info_by_id(
            "data-file-id",
            data_files_store=data_files_store,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "FileIdNotFound"


async def test_get_data_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
) -> None:
    """It should return the existing CSV file."""
    data_files_directory = Path("/dev/null")

    decoy.when(data_files_store.get("data-file-id")).then_return(
        DataFileInfo(
            id="qwerty",
            name="abc.csv",
            file_hash="123",
            created_at=datetime(year=2024, month=7, day=15),
            mime_type=MimeType.TEXT_CSV,
            generated=False,
            stored=True,
            path=f"{data_files_directory}/qwerty/abc.csv",
        )
    )

    decoy.when(
        await file_reader_writer.read(
            files=[Path(f"{data_files_directory}/qwerty/abc.csv")]
        )
    ).then_return(
        [
            BufferedFile(
                name="abc.csv",
                contents=bytes("some_content", encoding="utf-8"),
                path=None,
            )
        ]
    )

    result = await get_data_file(
        "data-file-id",
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
    )

    assert result.status_code == 200
    assert result.body == b"some_content"
    assert result.media_type == "text/plain"


async def test_get_data_file_image(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    tmp_path: Path,
) -> None:
    """It should return an existing image file."""
    image_path = tmp_path / "test-run-id" / "image.jpeg"
    image_path.parent.mkdir(parents=True)
    image_content = b"fake_image_content"
    image_path.write_bytes(image_content)

    decoy.when(data_files_store.get("image-file-id")).then_return(
        DataFileInfo(
            id="image-file-id",
            name="image.jpeg",
            file_hash="abc123",
            created_at=datetime(year=2024, month=7, day=15),
            mime_type=MimeType.IMAGE_JPEG,
            generated=True,
            stored=True,
            path=str(image_path),
        )
    )

    result = await get_data_file(
        "image-file-id",
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
    )

    assert result.status_code == 200
    assert result.media_type == "image/jpeg"


async def test_get_all_data_file_info(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """Get a list of all data file info from the database."""
    decoy.when(data_files_store.sql_get_all_from_engine()).then_return(
        [
            DataFileInfo(
                id="qwerty",
                name="abc.xyz",
                file_hash="123",
                created_at=datetime(year=2024, month=7, day=15),
                mime_type=MimeType.TEXT_CSV,
                generated=False,
                stored=True,
                path="data_files/qwerty/abc.xyz",
            ),
            DataFileInfo(
                id="hfhcjdeowjfie",
                name="mcd.kfc",
                file_hash="124",
                created_at=datetime(year=2024, month=7, day=22),
                mime_type=MimeType.TEXT_CSV,
                generated=False,
                stored=True,
                path="data_files/hfhcjdeowjfie/mcd.kfc",
            ),
        ]
    )

    result = await get_all_data_files(data_files_store=data_files_store)

    assert result.status_code == 200
    assert result.content.data == [
        DataFile(
            id="qwerty",
            name="abc.xyz",
            createdAt=datetime(year=2024, month=7, day=15),
            source=DataFileSource.UPLOADED,
        ),
        DataFile(
            id="hfhcjdeowjfie",
            name="mcd.kfc",
            createdAt=datetime(year=2024, month=7, day=22),
            source=DataFileSource.UPLOADED,
        ),
    ]
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=2)


async def test_delete_by_file_id(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should delete the data file."""
    result = await delete_file_by_id(
        dataFileId="file-id", data_files_store=data_files_store
    )
    decoy.verify(data_files_store.remove_stored(file_id="file-id"))

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_non_existent_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should raise an error if the file ID doesn't exist."""
    decoy.when(data_files_store.remove_stored("file-id")).then_raise(  # type: ignore[func-returns-value]
        FileIdNotFoundError(data_file_id="file-id")
    )

    with pytest.raises(ApiError) as exc_info:
        await delete_file_by_id(dataFileId="file-id", data_files_store=data_files_store)

    assert exc_info.value.status_code == 404


async def test_delete_file_in_use(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should raise an error if the file to be deleted is in use."""
    decoy.when(data_files_store.remove_stored("file-id")).then_raise(  # type: ignore[func-returns-value]
        FileInUseError(
            data_file_id="file-id", ids_used_in_runs=set(), ids_used_in_analyses=set()
        )
    )
    with pytest.raises(ApiError) as exc_info:
        await delete_file_by_id(dataFileId="file-id", data_files_store=data_files_store)

    assert exc_info.value.status_code == 409


async def test_get_run_image_metadata(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should return metadata for multiple images."""
    file_info_1 = DataFileInfoWithCommands.model_construct(
        id="file-id-1",
        name="image1.jpeg",
        file_hash="hash1",
        created_at=datetime(year=2024, month=6, day=20),
        mime_type=MimeType.IMAGE_JPEG,
        path="data_files/file-id-1/image1.jpeg",
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-1",
            prev_command_id="prev-1",
        ),
    )

    file_info_2 = DataFileInfoWithCommands.model_construct(
        id="file-id-2",
        name="image2.jpeg",
        file_hash="hash2",
        created_at=datetime(year=2024, month=6, day=21),
        mime_type=MimeType.IMAGE_JPEG,
        path="data_files/file-id-2/image2.jpeg",
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-2",
            prev_command_id="prev-2",
        ),
    )

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            limit=99,
            offset=0,
        )
    ).then_return(
        DataFileWithCommandsInfoSlice(
            file_info=[file_info_1, file_info_2], total_length=2
        )
    )

    result = await get_run_image_metadata(
        runId="run-id",
        data_files_store=data_files_store,
        pageLength=99,
        cursor=0,
    )

    assert result.status_code == 200
    assert len(result.content.data) == 2
    assert result.content.data[0].id == "file-id-1"
    assert result.content.data[1].id == "file-id-2"
    assert result.content.meta == MultiBodyMeta(totalLength=2, cursor=0)


async def test_get_run_image_metadata_with_pagination(
    decoy: Decoy,
    data_files_store: DataFilesStore,
) -> None:
    """It should respect pageLength and cursor parameters."""
    file_info = DataFileInfoWithCommands.model_construct(
        id="file-id-3",
        name="image3.jpeg",
        file_hash="hash3",
        created_at=datetime(year=2024, month=6, day=22),
        mime_type=MimeType.IMAGE_JPEG,
        path="data_files/file-id-3/image3.jpeg",
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-3",
            prev_command_id="prev-3",
        ),
    )

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            limit=10,
            offset=2,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[file_info], total_length=5))

    result = await get_run_image_metadata(
        runId="run-id",
        data_files_store=data_files_store,
        pageLength=10,
        cursor=2,
    )

    assert result.status_code == 200
    assert len(result.content.data) == 1
    assert result.content.data[0].id == "file-id-3"
    assert result.content.meta == MultiBodyMeta(totalLength=5, cursor=2)


async def test_delete_run_images(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_data_manager: RunDataManager,
    data_file_publisher: DataFilePublisher,
) -> None:
    """It should delete all images for a run."""
    decoy.when(run_data_manager.get("run-id")).then_return(decoy.mock(name="run_data"))
    decoy.when(run_data_manager.current_run_id).then_return(None)

    result = await delete_run_images(
        runId="run-id",
        data_files_store=data_files_store,
        run_data_manager=run_data_manager,
        data_file_publisher=data_file_publisher,
    )

    decoy.verify(data_files_store.remove_all_by_run_id("run-id"))
    decoy.verify(data_file_publisher.publish_run_images("run-id"))

    assert result.content == SimpleEmptyBody()
    assert result.status_code == 200


async def test_delete_run_images_run_not_found(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_data_manager: RunDataManager,
    data_file_publisher: DataFilePublisher,
) -> None:
    """It should raise an error if the run doesn't exist."""
    decoy.when(run_data_manager.get("run-id")).then_raise(
        RunNotFoundError(run_id="run-id")
    )

    with pytest.raises(ApiError) as exc_info:
        await delete_run_images(
            runId="run-id",
            data_files_store=data_files_store,
            run_data_manager=run_data_manager,
            data_file_publisher=data_file_publisher,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_download_run_images_success(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_store: RunStore,
    protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should return a zip file with all images for a run."""
    image1_path = tmp_path / "image1.jpeg"
    image2_path = tmp_path / "image2.jpeg"
    image1_path.write_bytes(b"fake image data 1")
    image2_path.write_bytes(b"fake image data 2")

    file_info_1 = DataFileInfoWithCommands.model_construct(
        id="file-id-1",
        name="image1.jpeg",
        file_hash="hash1",
        created_at=datetime(year=2024, month=6, day=20),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image1_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-1",
            prev_command_id="prev-1",
        ),
    )

    file_info_2 = DataFileInfoWithCommands.model_construct(
        id="file-id-2",
        name="image2.jpeg",
        file_hash="hash2",
        created_at=datetime(year=2024, month=6, day=21),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image2_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-2",
            prev_command_id="prev-2",
        ),
    )

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(
        DataFileWithCommandsInfoSlice(
            file_info=[file_info_1, file_info_2], total_length=2
        )
    )

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.protocol_id).then_return("protocol-id")
    decoy.when(mock_run.created_at).then_return(
        datetime(year=2024, month=6, day=20, hour=10, minute=30, second=15)
    )
    decoy.when(run_store.get("run-id")).then_return(mock_run)

    mock_protocol = decoy.mock(name="protocol")
    mock_source = decoy.mock(name="source")
    mock_files = [decoy.mock(name="file")]
    mock_path = decoy.mock(name="path")
    decoy.when(mock_path.name).then_return("my_protocol.py")
    decoy.when(mock_files[0].path).then_return(mock_path)
    decoy.when(mock_source.files).then_return(mock_files)
    decoy.when(mock_source.metadata).then_return({"protocolName": "Test Protocol"})
    decoy.when(mock_protocol.source).then_return(mock_source)
    decoy.when(protocol_store.get("protocol-id")).then_return(mock_protocol)

    result = await download_run_images(
        runId="run-id",
        data_files_store=data_files_store,
        run_store=run_store,
        protocol_store=protocol_store,
        persistence_directory=tmp_path,
    )

    assert result.media_type == "application/zip"
    assert "attachment" in result.headers["Content-Disposition"]
    assert ".zip" in result.headers["Content-Disposition"]
    assert Path(result.path).exists()
    assert Path(result.path).stat().st_size > 0

    if result.background is not None:
        await result.background()
    assert not Path(result.path).exists()


async def test_download_run_images_no_images_found(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_store: RunStore,
    protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should raise an error when no images are found for the run."""
    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[], total_length=0))

    with pytest.raises(ApiError) as exc_info:
        await download_run_images(
            runId="run-id",
            data_files_store=data_files_store,
            run_store=run_store,
            protocol_store=protocol_store,
            persistence_directory=tmp_path,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "NoImagesFound"


@pytest.mark.parametrize(
    argnames=["input_files", "output_files", "expected_length"],
    argvalues=[
        pytest.param(
            [
                DataFileInfo(
                    id="input-file-1",
                    name="input1.csv",
                    file_hash="hash-input-1",
                    created_at=datetime(year=2024, month=6, day=20),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/input-file-1/input1.csv",
                    generated=False,
                    stored=True,
                ),
                DataFileInfo(
                    id="input-file-2",
                    name="input2.csv",
                    file_hash="hash-input-2",
                    created_at=datetime(year=2024, month=6, day=21),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/input-file-2/input2.csv",
                    generated=False,
                    stored=True,
                ),
            ],
            [
                DataFileInfo(
                    id="output-file-1",
                    name="output1.csv",
                    file_hash="hash-output-1",
                    created_at=datetime(year=2024, month=6, day=22),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/output-file-1/output1.csv",
                    generated=True,
                    stored=True,
                ),
                DataFileInfo(
                    id="output-file-2",
                    name="output2.csv",
                    file_hash="hash-output-2",
                    created_at=datetime(year=2024, month=6, day=23),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/output-file-2/output2.csv",
                    generated=True,
                    stored=True,
                ),
            ],
            4,
            id="multiple_input_and_output_files",
        ),
        pytest.param(
            [],
            [],
            0,
            id="empty_result",
        ),
        pytest.param(
            [
                DataFileInfo(
                    id="input-file-1",
                    name="input1.csv",
                    file_hash="hash-input-1",
                    created_at=datetime(year=2024, month=6, day=20),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/input-file-1/input1.csv",
                    generated=False,
                    stored=True,
                ),
            ],
            [],
            1,
            id="only_input_files",
        ),
        pytest.param(
            [],
            [
                DataFileInfo(
                    id="output-file-1",
                    name="output1.csv",
                    file_hash="hash-output-1",
                    created_at=datetime(year=2024, month=6, day=22),
                    mime_type=MimeType.TEXT_CSV,
                    path="data_files/output-file-1/output1.csv",
                    generated=True,
                    stored=True,
                ),
            ],
            1,
            id="only_output_files",
        ),
    ],
)
async def test_get_data_files_by_run_id(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_data_manager: RunDataManager,
    input_files: List[DataFileInfo],
    output_files: List[DataFileInfo],
    expected_length: int,
) -> None:
    """It should return metadata for all data files associated with a run."""
    decoy.when(run_data_manager.get("run-id")).then_return(decoy.mock(name="run_data"))

    decoy.when(data_files_store.get_data_files_by_run_id("run-id")).then_return(
        DataFilesByRunInfo(
            input_files=input_files,
            output_files=output_files,
        )
    )

    result = await get_data_files_by_run_id(
        runId="run-id",
        data_files_store=data_files_store,
        run_data_manager=run_data_manager,
    )

    assert len(result.content.data) == expected_length
    if expected_length > 0:
        all_files = input_files + output_files

        for response_file, expected_file in zip(result.content.data, all_files):
            assert response_file.id == expected_file.id
            assert response_file.filename == expected_file.name
            assert response_file.stored == expected_file.stored
            assert response_file.generated == expected_file.generated
            assert response_file.mimeType == expected_file.mime_type


async def test_get_data_files_by_run_id_run_not_found(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    run_data_manager: RunDataManager,
) -> None:
    """It should raise an error if the run doesn't exist."""
    decoy.when(run_data_manager.get("run-id")).then_raise(
        RunNotFoundError(run_id="run-id")
    )

    with pytest.raises(ApiError) as exc_info:
        await get_data_files_by_run_id(
            runId="run-id",
            data_files_store=data_files_store,
            run_data_manager=run_data_manager,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"

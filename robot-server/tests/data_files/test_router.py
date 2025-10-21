"""Tests for data_files router."""
import io
import pytest
from datetime import datetime
from pathlib import Path

from decoy import Decoy
from fastapi import UploadFile
from opentrons.protocol_reader import FileHasher, FileReaderWriter, BufferedFile

from robot_server.service.json_api import MultiBodyMeta, SimpleEmptyBody

from robot_server.data_files.data_files_store import (
    DataFilesStore,
)
from robot_server.data_files.models import (
    DataFile,
    FileIdNotFoundError,
    FileInUseError,
)
from opentrons_shared_data.data_files import DataFileSource, DataFileInfo, MimeType
from robot_server.data_files.router import (
    upload_data_file,
    get_data_file_info_by_id,
    get_data_file,
    get_all_data_files,
    delete_file_by_id,
    get_run_image_metadata,
)
from robot_server.data_files.data_files_store import DataFileWithCommandsInfoSlice
from opentrons_shared_data.data_files import DataFileInfoWithCommands, CmdDataFileInfo
from robot_server.data_files.file_auto_deleter import DataFileAutoDeleter
from robot_server.errors.error_responses import ApiError


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
    assert result.path == image_path


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
    decoy.when(data_files_store.remove_stored("file-id")).then_raise(
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
    decoy.when(data_files_store.remove_stored("file-id")).then_raise(
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
    file_info_1 = DataFileInfoWithCommands(
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

    file_info_2 = DataFileInfoWithCommands(
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
    file_info = DataFileInfoWithCommands(
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

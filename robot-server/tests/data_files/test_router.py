"""Tests for data_files router."""
import io
import pytest
from datetime import datetime
from pathlib import Path

from decoy import Decoy
from fastapi import UploadFile
from opentrons.protocol_reader import FileHasher, FileReaderWriter, BufferedFile

from robot_server.data_files.data_files_store import DataFilesStore, DataFileInfo
from robot_server.data_files.models import DataFile
from robot_server.data_files.router import upload_data_file
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


async def test_upload_new_data_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
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
        file_hasher=file_hasher,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )

    assert result.content.data == DataFile(
        id="data-file-id",
        name="abc.csv",
        createdAt=datetime(year=2024, month=6, day=18),
    )
    assert result.status_code == 201
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
            )
        ),
    )


async def test_upload_existing_data_file(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
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
        )
    )

    result = await upload_data_file(
        file=data_file,
        file_path=None,
        data_files_directory=data_files_directory,
        data_files_store=data_files_store,
        file_reader_writer=file_reader_writer,
        file_hasher=file_hasher,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )
    assert result.status_code == 200
    assert result.content.data == DataFile(
        id="existing-file-id",
        name="abc.csv",
        createdAt=datetime(year=2023, month=6, day=18),
    )


async def test_upload_new_data_file_path(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
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
        file_hasher=file_hasher,
        file_id="data-file-id",
        created_at=datetime(year=2024, month=6, day=18),
    )
    assert result.status_code == 201
    assert result.content.data == DataFile(
        id="data-file-id",
        name="abc.csv",
        createdAt=datetime(year=2024, month=6, day=18),
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
            )
        ),
    )


async def test_upload_non_existent_file_path(
    decoy: Decoy,
    data_files_store: DataFilesStore,
    file_reader_writer: FileReaderWriter,
    file_hasher: FileHasher,
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
            file_id="data-file-id",
            created_at=datetime(year=2024, month=6, day=18),
        )
    assert exc_info.value.status_code == 404

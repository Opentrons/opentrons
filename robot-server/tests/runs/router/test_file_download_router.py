"""Tests for runs download router."""

import io
import zipfile
from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy

from opentrons_shared_data.data_files import (
    CmdDataFileInfo,
    DataFileInfoWithCommands,
    MimeType,
)

from robot_server.data_files.data_files_store import (
    DataFilesStore,
    DataFileWithCommandsInfoSlice,
)
from robot_server.errors.error_responses import ApiError
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.router.file_download_router import download_run_files
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import RunStore


async def test_download_run_files_with_images(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should zip images under images/."""
    data_files_store = decoy.mock(cls=DataFilesStore)

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
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return(None)
    decoy.when(mock_run.created_at).then_return(
        datetime(year=2024, month=6, day=20, hour=10, minute=30, second=15)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)

    result = await download_run_files(
        runId="run-id",
        run_store=mock_run_store,
        data_files_store=data_files_store,
        protocol_store=mock_protocol_store,
    )

    assert result.media_type == "application/zip"
    assert "attachment" in result.headers["Content-Disposition"]
    assert ".zip" in result.headers["Content-Disposition"]

    chunks = []
    async for chunk in result.body_iterator:
        chunks.append(chunk)

    zip_bytes = b"".join(chunks)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = set(zf.namelist())
        assert "images/image1.jpeg" in names
        assert "images/image2.jpeg" in names
        assert zf.read("images/image1.jpeg") == b"fake image data 1"


async def test_download_run_files_run_not_found(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 404 when the run does not exist."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    decoy.when(mock_run_store.get("missing-run")).then_raise(
        RunNotFoundError(run_id="missing-run")
    )

    with pytest.raises(ApiError) as exc_info:
        await download_run_files(
            runId="missing-run",
            run_store=mock_run_store,
            data_files_store=data_files_store,
            protocol_store=mock_protocol_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_download_run_files_no_content(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 404 when the run exists but has nothing downloadable."""
    data_files_store = decoy.mock(cls=DataFilesStore)

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return(None)
    decoy.when(mock_run.created_at).then_return(
        datetime(year=2024, month=6, day=20, hour=10, minute=30, second=15)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[], total_length=0))

    with pytest.raises(ApiError) as exc_info:
        await download_run_files(
            runId="run-id",
            run_store=mock_run_store,
            data_files_store=data_files_store,
            protocol_store=mock_protocol_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "NoDownloadContent"

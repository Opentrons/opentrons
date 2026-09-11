"""Tests for data_files zip_utils."""

import zipfile
from datetime import datetime
from pathlib import Path

import pytest
from decoy import Decoy

from opentrons_shared_data.data_files import (
    CmdDataFileInfo,
    DataFileInfo,
    DataFileInfoWithCommands,
    MimeType,
)
from server_utils.persistence.persistence_directory import (
    PERSISTENCE_TEMP_SUBDIRECTORY,
)

from robot_server.data_files.data_files_store import (
    DataFilesByRunInfo,
    DataFilesStore,
    DataFileWithCommandsInfoSlice,
)
from robot_server.data_files.zip_utils import (
    build_run_zip_filename,
    collect_existing_run_images,
    collect_existing_run_output_csvs,
    create_download_staging_dir,
    create_zip_for_download,
    sanitize_filename_component,
    write_zip_for_download,
)
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore


def test_collect_existing_run_images_with_prefix(decoy: Decoy, tmp_path: Path) -> None:
    """It should include only existing files under the archive prefix."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    existing = tmp_path / "a.jpeg"
    missing = tmp_path / "missing.jpeg"
    existing.write_bytes(b"img")

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(
        DataFileWithCommandsInfoSlice(
            file_info=[
                DataFileInfoWithCommands.model_construct(
                    id="file-1",
                    name="a.jpeg",
                    file_hash="h1",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.IMAGE_JPEG,
                    path=str(existing),
                    generated=True,
                    stored=True,
                    command_info=CmdDataFileInfo(command_id="c1", prev_command_id="p1"),
                ),
                DataFileInfoWithCommands.model_construct(
                    id="file-2",
                    name="missing.jpeg",
                    file_hash="h2",
                    created_at=datetime(2024, 6, 21),
                    mime_type=MimeType.IMAGE_JPEG,
                    path=str(missing),
                    generated=True,
                    stored=True,
                    command_info=CmdDataFileInfo(command_id="c2", prev_command_id="p2"),
                ),
            ],
            total_length=2,
        )
    )

    entries = collect_existing_run_images(
        "run-id", data_files_store, archive_prefix="images"
    )

    assert entries == [(existing, "images/a.jpeg")]


def test_collect_existing_run_images_flat(decoy: Decoy, tmp_path: Path) -> None:
    """It should store files at the zip root when no prefix is given."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    existing = tmp_path / "a.jpeg"
    existing.write_bytes(b"img")

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(
        DataFileWithCommandsInfoSlice(
            file_info=[
                DataFileInfoWithCommands.model_construct(
                    id="file-1",
                    name="a.jpeg",
                    file_hash="h1",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.IMAGE_JPEG,
                    path=str(existing),
                    generated=True,
                    stored=True,
                    command_info=CmdDataFileInfo(command_id="c1", prev_command_id="p1"),
                ),
            ],
            total_length=1,
        )
    )

    entries = collect_existing_run_images("run-id", data_files_store)

    assert entries == [(existing, "a.jpeg")]


def test_collect_existing_run_output_csvs(decoy: Decoy, tmp_path: Path) -> None:
    """It should include CSV outputs under the prefix, prefixed by file id."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    csv_path = tmp_path / "plate_read450nm.csv"
    jpeg_path = tmp_path / "photo.jpeg"
    missing_path = tmp_path / "missing.csv"
    csv_path.write_text("a,b,c\n")
    jpeg_path.write_bytes(b"img")

    decoy.when(data_files_store.get_data_files_by_run_id("run-id")).then_return(
        DataFilesByRunInfo(
            input_files=[],
            output_files=[
                DataFileInfo(
                    id="csv-file-id",
                    name="plate_read450nm.csv",
                    file_hash="h1",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.TEXT_CSV,
                    path=str(csv_path),
                    generated=True,
                    stored=True,
                ),
                DataFileInfo(
                    id="image-file-id",
                    name="photo.jpeg",
                    file_hash="h2",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.IMAGE_JPEG,
                    path=str(jpeg_path),
                    generated=True,
                    stored=True,
                ),
                DataFileInfo(
                    id="missing-file-id",
                    name="missing.csv",
                    file_hash="h3",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.TEXT_CSV,
                    path=str(missing_path),
                    generated=True,
                    stored=False,
                ),
            ],
        )
    )

    entries = collect_existing_run_output_csvs(
        "run-id",
        data_files_store,
        archive_prefix="my_protocol_2024-06-20T10_30_15.354Z_output",
    )

    assert entries == [
        (
            csv_path,
            "my_protocol_2024-06-20T10_30_15.354Z_output/csv-file-id_plate_read450nm.csv",
        )
    ]


async def test_create_zip_for_download_preserves_archive_paths(tmp_path: Path) -> None:
    """It should put files under the provided archive paths on disk staging."""
    image = tmp_path / "photo.jpeg"
    protocol = tmp_path / "protocol.py"
    persistence_root = tmp_path / "persistence"
    image.write_bytes(b"image-bytes")
    protocol.write_text("print('hi')")

    zip_path, cleanup = await create_zip_for_download(
        [(image, "images/photo.jpeg"), (protocol, "protocol.py")],
        persistence_root,
    )

    try:
        assert zip_path.is_relative_to(persistence_root / PERSISTENCE_TEMP_SUBDIRECTORY)
        with zipfile.ZipFile(zip_path) as zf:
            names = set(zf.namelist())
            assert "images/photo.jpeg" in names
            assert "protocol.py" in names
            assert zf.read("images/photo.jpeg") == b"image-bytes"
            assert zf.read("protocol.py") == b"print('hi')"
    finally:
        cleanup()

    assert not zip_path.exists()


async def test_write_zip_for_download_uses_existing_scratch_dir(tmp_path: Path) -> None:
    """It should write the zip into a caller-owned scratch directory."""
    image = tmp_path / "photo.jpeg"
    image.write_bytes(b"image-bytes")
    persistence_root = tmp_path / "persistence"
    staging_dir = create_download_staging_dir(persistence_root)
    staging_path = Path(staging_dir.name)
    scratch_file = staging_path / "notes.json"
    scratch_file.write_text('{"ok": true}')

    assert staging_path.parent == persistence_root / PERSISTENCE_TEMP_SUBDIRECTORY

    try:
        zip_path = await write_zip_for_download(
            [(image, "images/photo.jpeg"), (scratch_file, "notes.json")],
            staging_path,
        )
        assert zip_path.parent == staging_path
        with zipfile.ZipFile(zip_path) as zf:
            assert zf.read("notes.json") == b'{"ok": true}'
            assert zf.read("images/photo.jpeg") == b"image-bytes"
    finally:
        staging_dir.cleanup()

    assert not staging_path.exists()


async def test_create_zip_for_download_raises_for_missing_file(
    tmp_path: Path,
) -> None:
    """It should let filesystem errors from zip creation propagate."""
    missing = tmp_path / "missing.jpeg"
    persistence_root = tmp_path / "persistence"

    with pytest.raises(FileNotFoundError):
        await create_zip_for_download([(missing, "missing.jpeg")], persistence_root)


def test_build_run_zip_filename_with_protocol(decoy: Decoy) -> None:
    """It should build a protocol-aware zip filename."""
    protocol_store = decoy.mock(cls=ProtocolStore)
    run = decoy.mock(name="run")
    decoy.when(run.protocol_id).then_return("protocol-id")
    decoy.when(run.created_at).then_return(datetime(2024, 6, 20, 10, 30, 15))

    mock_protocol = decoy.mock(name="protocol")
    mock_source = decoy.mock(name="source")
    decoy.when(mock_source.metadata).then_return({"protocolName": "Test Protocol"})
    decoy.when(mock_protocol.source).then_return(mock_source)
    decoy.when(protocol_store.get("protocol-id")).then_return(mock_protocol)

    filename = build_run_zip_filename(
        run=run,
        protocol_store=protocol_store,
        fallback_filename="fallback.zip",
    )

    assert filename.endswith("_20240620_103015.zip")
    assert "Test_Protocol" in filename


def test_build_run_zip_filename_missing_protocol_uses_fallback(
    decoy: Decoy,
) -> None:
    """It should use the fallback when the protocol cannot be loaded."""
    protocol_store = decoy.mock(cls=ProtocolStore)
    run = decoy.mock(name="run")
    decoy.when(run.protocol_id).then_return("protocol-id")
    decoy.when(protocol_store.get("protocol-id")).then_raise(
        ProtocolNotFoundError("protocol-id")
    )

    filename = build_run_zip_filename(
        run=run,
        protocol_store=protocol_store,
        fallback_filename="run-id.zip",
    )

    assert filename == "run-id.zip"


def test_sanitize_filename_component() -> None:
    """It should replace unsafe characters."""
    assert sanitize_filename_component("Test Protocol!") == "Test_Protocol_"

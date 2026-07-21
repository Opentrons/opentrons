"""Shared helpers for building and streaming zip downloads."""

import asyncio
import tempfile
import zipfile
from pathlib import Path
from typing import Callable, Final, List, Optional, Tuple, Union

from fastapi import status

from opentrons import config
from opentrons_shared_data.data_files import MimeType

from .data_files_store import DataFilesStore
from .models import ZipCreationFailed
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore
from robot_server.runs.run_store import BadRunResource, RunResource

_DOWNLOAD_STAGING_PREFIX: Final = "temp-download-staging-"


def collect_existing_run_images(
    run_id: str,
    data_files_store: DataFilesStore,
    *,
    archive_prefix: Optional[str] = None,
) -> List[Tuple[Path, str]]:
    """Collect existing JPEG image files for a run.

    Args:
        run_id: The run to collect images for.
        data_files_store: Store for data files database access.
        archive_prefix: Optional directory prefix inside the zip
            (e.g. ``"images"`` -> ``images/foo.jpeg``). When ``None``,
            files are stored using their basename.

    Returns:
        A list of ``(filesystem_path, archive_path)`` tuples for files
        that exist on disk.
    """
    info_slice = data_files_store.get_files_info_by_run_mime_type(
        run_id=run_id,
        mime_type=MimeType.IMAGE_JPEG,
        offset=0,
        limit=None,
    )

    entries: List[Tuple[Path, str]] = []
    for file_info in info_slice.file_info:
        image_path = Path(file_info.path)
        if image_path.exists() and image_path.is_file():
            archive_name = (
                f"{archive_prefix}/{file_info.name}"
                if archive_prefix is not None
                else file_info.name
            )
            entries.append((image_path, archive_name))
    return entries


def collect_existing_run_output_csvs(
    run_id: str,
    data_files_store: DataFilesStore,
    *,
    archive_prefix: str,
) -> List[Tuple[Path, str]]:
    """Collect existing CSV output files for a run under ``archive_prefix``.

    File names are prefixed with the data file id because ``data_files.name`` is not unique.

    Args:
        run_id: The run to collect output CSVs for.
        data_files_store: Store for data files database access.
        archive_prefix: Directory prefix inside the zip
            (e.x. ``"my_protocol_2024-06-20T10_30_15.354Z_output"``).

    Returns:
        A list of ``(filesystem_path, archive_path)`` tuples for files
        that exist on disk.
    """
    files_by_run = data_files_store.get_data_files_by_run_id(run_id)

    entries: List[Tuple[Path, str]] = []
    for file_info in files_by_run.output_files:
        if file_info.mime_type != MimeType.TEXT_CSV:
            continue
        file_path = Path(file_info.path)
        if file_path.exists() and file_path.is_file():
            archive_name = f"{archive_prefix}/{file_info.id}_{file_info.name}"
            entries.append((file_path, archive_name))
    return entries


def _create_zip_for_download(
    entries: List[Tuple[Path, str]],
    staging_root: Path,
) -> Tuple[Path, Callable[[], None]]:
    """Write a zip under ``staging_root`` and return ``(zip_path, cleanup)``."""
    staging_root.mkdir(parents=True, exist_ok=True)
    temp_dir = tempfile.TemporaryDirectory(
        prefix=_DOWNLOAD_STAGING_PREFIX, dir=str(staging_root)
    )
    zip_path = Path(temp_dir.name) / "download.zip"
    try:
        with zipfile.ZipFile(
            zip_path, mode="w", compression=zipfile.ZIP_DEFLATED
        ) as zip_file:
            for source_path, archive_name in entries:
                zip_file.write(source_path, arcname=archive_name)
    except Exception:
        temp_dir.cleanup()
        raise

    def cleanup() -> None:
        try:
            zip_path.unlink(missing_ok=True)
        except OSError:
            pass
        temp_dir.cleanup()

    return zip_path, cleanup


async def create_zip_for_download(
    entries: List[Tuple[Path, str]],
    staging_root: Path,
) -> Tuple[Path, Callable[[], None]]:
    """Build a zip archive off the event loop under ``staging_root``.

    Args:
        entries: ``(filesystem_path, archive_path)`` pairs to include.
        staging_root: Directory that should hold the staging temp dir.
    """
    try:
        return await asyncio.to_thread(_create_zip_for_download, entries, staging_root)
    except Exception as e:
        raise ZipCreationFailed(
            detail=f"Unexpected error during zip creation: {str(e)}"
        ).as_error(status.HTTP_500_INTERNAL_SERVER_ERROR) from e


def build_run_zip_filename(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
    *,
    fallback_filename: str,
) -> str:
    """Build a download zip filename from run/protocol metadata.

    Prefers ``{robot}_{protocolName}_{timestamp}.zip`` when a protocol
    name is available; otherwise returns ``fallback_filename``.
    """
    protocol_id = run.protocol_id

    if protocol_id is not None:
        try:
            protocol = protocol_store.get(protocol_id)
        except ProtocolNotFoundError:
            protocol = None

        protocol_name = None
        if protocol is not None:
            protocol_name = protocol.source.metadata.get("protocolName")
            if protocol_name is None:
                protocol_name = protocol.source.files[0].path.name

        if protocol_name is not None:
            robot_name = config.name()
            timestamp = run.created_at.strftime("%Y%m%d_%H%M%S")
            return (
                f"{robot_name}_{sanitize_filename_component(str(protocol_name))}"
                f"_{timestamp}.zip"
            )

    return fallback_filename


def sanitize_filename_component(input_str: str) -> str:
    """Ensure that the input string contains only filesystem-safe characters."""
    return "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in input_str)

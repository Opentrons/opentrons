"""Router for /runs/{runId}/download file bundle endpoints."""

from pathlib import Path
from textwrap import dedent
from typing import Annotated, List, Literal, Optional, Tuple, Union

from fastapi import Depends, status
from fastapi.responses import StreamingResponse

from server_utils.fastapi_utils.light_router import LightRouter

from .base_router import RunNotFound
from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.dependencies import get_data_files_store
from robot_server.data_files.models import ZipCreationFailed
from robot_server.data_files.zip_utils import (
    build_run_zip_filename,
    collect_existing_run_images,
    stream_zip,
)
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore
from robot_server.runs.dependencies import get_run_store
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import RunStore

file_download_router = LightRouter()


class NoDownloadContent(ErrorDetails):
    """An error returned when a run has no downloadable content."""

    id: Literal["NoDownloadContent"] = "NoDownloadContent"
    title: str = "No downloadable content for run"


@file_download_router.get(
    path="/runs/{runId}/download",
    summary="Download run files as a zip",
    description=dedent(
        """
        Download a zip archive of files associated with a run.

        The archive includes, when available:

        - Camera images under an `images/` directory
        - The protocol source file
        """
    ),
    responses={
        status.HTTP_200_OK: {
            "content": {"application/zip": {}},
            "description": "A zip file containing downloadable files for the run",
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorBody[Union[RunNotFound, NoDownloadContent]]
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorBody[ZipCreationFailed]},
    },
)
async def download_run_files(
    runId: str,
    run_store: Annotated[RunStore, Depends(get_run_store)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> StreamingResponse:
    """Download files associated with a run as a zip archive.

    Arguments:
        runId: The run ID to download files for.
        run_store: Store for run data management.
        data_files_store: Store for data files database access.
        protocol_store: Store for protocol storage access.
    """
    try:
        run = run_store.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    # (filesystem path, archive path within the zip)
    zip_entries: List[Tuple[Path, str]] = []

    zip_entries.extend(
        collect_existing_run_images(runId, data_files_store, archive_prefix="images")
    )
    protocol_entry = _collect_protocol_file(run.protocol_id, protocol_store)
    if protocol_entry is not None:
        zip_entries.append(protocol_entry)

    if not zip_entries:
        raise NoDownloadContent(
            detail=f"No downloadable content found for run '{runId}'"
        ).as_error(status.HTTP_404_NOT_FOUND)

    zip_filename = build_run_zip_filename(
        run=run,
        protocol_store=protocol_store,
        fallback_filename=f"{runId}.zip",
    )

    return StreamingResponse(
        stream_zip(zip_entries),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={zip_filename}"},
    )


def _collect_protocol_file(
    protocol_id: Optional[str], protocol_store: ProtocolStore
) -> Optional[Tuple[Path, str]]:
    """Return the protocol main file for the zip, or None if unavailable."""
    if protocol_id is None:
        return None

    try:
        protocol = protocol_store.get(protocol_id)
    except ProtocolNotFoundError:
        return None

    main_file = protocol.source.main_file
    if not main_file.exists() or not main_file.is_file():
        return None

    return (main_file, main_file.name)

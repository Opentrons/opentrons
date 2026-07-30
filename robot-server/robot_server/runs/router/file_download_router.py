"""Router for /runs/{runId}/download file bundle endpoints."""

from pathlib import Path
from textwrap import dedent
from typing import Annotated, List, Literal, Tuple, Union

from fastapi import Depends, status
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from server_utils.fastapi_utils.light_router import LightRouter

from .base_router import RunNotFound
from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.dependencies import get_data_files_store
from robot_server.data_files.zip_utils import (
    build_run_zip_filename,
    collect_existing_run_images,
    collect_existing_run_output_csvs,
    create_download_staging_dir,
    write_zip_for_download,
)
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.persistence.fastapi_dependencies import (
    get_persistence_directory_root,
)
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.dependencies import get_run_data_manager
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_download_utils import (
    build_download_artifact_name,
    collect_protocol_file,
    collect_rtp_csv,
    collect_labware_offsets,
    collect_run_log,
)

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

        - Camera images
        - The protocol source file
        - The run log
        - Labware offset data
        - CSV output files
        - The CSV runtime parameter input file
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
    },
)
async def download_run_files(
    runId: str,
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    persistence_directory_root: Annotated[
        Path, Depends(get_persistence_directory_root)
    ],
) -> FileResponse:
    """Download files associated with a run as a zip archive.

    Arguments:
        runId: The run ID to download files for.
        run_store: Store for run data management.
        run_data_manager: Run data retrieval interface.
        data_files_store: Store for data files database access.
        protocol_store: Store for protocol storage access.
        persistence_directory_root: Persistence directory used for download staging.
    """
    try:
        run = run_data_manager.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    staging_dir = create_download_staging_dir(persistence_directory_root)
    staging_path = Path(staging_dir.name)

    try:
        # (filesystem path, archive path within the zip)
        zip_entries: List[Tuple[Path, str]] = []

        zip_entries.extend(
            collect_existing_run_images(
                runId,
                data_files_store,
                archive_prefix=build_download_artifact_name(
                    run=run, protocol_store=protocol_store, suffix="_images"
                ),
            )
        )
        protocol_entry = collect_protocol_file(run=run, protocol_store=protocol_store)
        if protocol_entry is not None:
            zip_entries.append(protocol_entry)

        rtp_csv_entry = collect_rtp_csv(
            run_id=runId,
            run_data_manager=run_data_manager,
            data_files_store=data_files_store,
        )
        if rtp_csv_entry is not None:
            zip_entries.append(rtp_csv_entry)

        run_log_entry = collect_run_log(
            run_id=runId,
            run_data_manager=run_data_manager,
            protocol_store=protocol_store,
            staging_dir=staging_path,
        )
        if run_log_entry is not None:
            zip_entries.append(run_log_entry)

        offsets_entry = collect_labware_offsets(
            run_id=runId,
            run_data_manager=run_data_manager,
            protocol_store=protocol_store,
            staging_dir=staging_path,
        )
        if offsets_entry is not None:
            zip_entries.append(offsets_entry)

        zip_entries.extend(
            collect_existing_run_output_csvs(
                runId,
                data_files_store,
                archive_prefix=build_download_artifact_name(
                    run=run, protocol_store=protocol_store, suffix="_output"
                ),
            )
        )

        if not zip_entries:
            raise NoDownloadContent(
                detail=f"No downloadable content found for run '{runId}'"
            ).as_error(status.HTTP_404_NOT_FOUND)

        zip_filename = build_run_zip_filename(
            run=run,
            protocol_store=protocol_store,
            fallback_filename=f"{runId}.zip",
        )
        zip_path = await write_zip_for_download(zip_entries, staging_path)
    except Exception:
        staging_dir.cleanup()
        raise

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=zip_filename,
        background=BackgroundTask(staging_dir.cleanup),
    )


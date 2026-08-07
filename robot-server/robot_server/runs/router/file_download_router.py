"""Router for /runs/{runId}/download file bundle endpoints."""

from pathlib import Path
from textwrap import dedent
from typing import Annotated, List, Optional, Tuple, Union

from fastapi import Depends, Query, Response, status
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
from robot_server.errors.error_responses import ErrorBody
from robot_server.persistence.fastapi_dependencies import (
    get_persistence_directory_root,
)
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_store import ProtocolStore
from robot_server.runs.dependencies import get_run_data_manager, get_run_store
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_download_utils import (
    build_download_artifact_name,
    collect_labware_offsets,
    collect_protocol_file,
    collect_rtp_csv,
    collect_run_log,
)
from robot_server.runs.run_models import RunNotFoundError
from robot_server.runs.run_store import BadRunResource, RunResource, RunStore

file_download_router = LightRouter()


@file_download_router.get(
    path="/runs/{runId}/download",
    summary="Download run files as a zip",
    description=dedent(
        """
        Download a zip archive of selected files associated with a run.

        Each file type is opt-in via query parameters (all default to `false`):

        - `protocol`: the protocol source file
        - `images`: camera images
        - `runLog`: the run log
        - `labwareOffsets`: labware offset data
        - `csvInput`: the CSV runtime parameter input file
        - `csvOutput`: CSV output files (including absorbance reader exports)

        Returns `204 No Content` when no file types are requested, or when none
        of the requested files are available for the run.
        """
    ),
    response_model=None,
    responses={
        status.HTTP_200_OK: {
            "content": {"application/zip": {}},
            "description": "A zip file containing the requested downloadable files",
        },
        status.HTTP_204_NO_CONTENT: {
            "description": (
                "No file types requested, or none of the requested files are available"
            ),
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorBody[RunNotFound],
        },
    },
)
async def download_run_files(
    runId: str,
    run_store: Annotated[RunStore, Depends(get_run_store)],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    persistence_directory_root: Annotated[
        Path, Depends(get_persistence_directory_root)
    ],
    protocol: Annotated[
        bool,
        Query(description="Include the protocol source file, when available."),
    ] = False,
    images: Annotated[
        bool,
        Query(description="Include camera images captured during the run."),
    ] = False,
    runLog: Annotated[
        bool,
        Query(description="Include the run log JSON."),
    ] = False,
    labwareOffsets: Annotated[
        bool,
        Query(description="Include labware offset data."),
    ] = False,
    csvInput: Annotated[
        bool,
        Query(description="Include the CSV runtime parameter input file."),
    ] = False,
    csvOutput: Annotated[
        bool,
        Query(
            description=(
                "Include CSV output files."
            ),
        ),
    ] = False,
) -> Union[FileResponse, Response]:
    """Download selected files associated with a run as a zip archive.

    Arguments:
        runId: The run ID to download files for.
        run_store: Store for run data management.
        run_data_manager: Run data retrieval interface.
        data_files_store: Store for data files database access.
        protocol_store: Store for protocol storage access.
        persistence_directory_root: Persistence directory used for download staging.
        protocol: Include the protocol source file when available.
        images: Include camera images when available.
        runLog: Include the run log when available.
        labwareOffsets: Include labware offset data when available.
        csvInput: Include the CSV runtime parameter input file when available.
        csvOutput: Include CSV output files when available.
    """
    try:
        run = run_store.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    if not any((protocol, images, runLog, labwareOffsets, csvInput, csvOutput)):
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    staging_dir = create_download_staging_dir(persistence_directory_root)
    staging_path = Path(staging_dir.name)

    try:
        zip_entries = _collect_run_download_entries(
            run_id=runId,
            run=run,
            run_data_manager=run_data_manager,
            data_files_store=data_files_store,
            protocol_store=protocol_store,
            staging_dir=staging_path,
            protocol=protocol,
            images=images,
            run_log=runLog,
            labware_offsets=labwareOffsets,
            csv_input=csvInput,
            csv_output=csvOutput,
        )

        if not zip_entries:
            staging_dir.cleanup()
            return Response(status_code=status.HTTP_204_NO_CONTENT)

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


ZipEntry = Tuple[Path, str]


def _append_if_present(zip_entries: List[ZipEntry], entry: Optional[ZipEntry]) -> None:
    if entry is not None:
        zip_entries.append(entry)


def _collect_run_download_entries(
    *,
    run_id: str,
    run: Union[RunResource, BadRunResource],
    run_data_manager: RunDataManager,
    data_files_store: DataFilesStore,
    protocol_store: ProtocolStore,
    staging_dir: Path,
    protocol: bool,
    images: bool,
    run_log: bool,
    labware_offsets: bool,
    csv_input: bool,
    csv_output: bool,
) -> List[ZipEntry]:
    """Collect selected downloadable files for a run."""
    zip_entries: List[ZipEntry] = []

    if images:
        zip_entries.extend(
            collect_existing_run_images(
                run_id,
                data_files_store,
                archive_prefix=build_download_artifact_name(
                    run=run, protocol_store=protocol_store, suffix="_images"
                ),
            )
        )
    if protocol:
        _append_if_present(
            zip_entries,
            collect_protocol_file(run=run, protocol_store=protocol_store),
        )
    if csv_input:
        _append_if_present(
            zip_entries,
            collect_rtp_csv(
                run_id=run_id,
                run_data_manager=run_data_manager,
                data_files_store=data_files_store,
            ),
        )
    if run_log:
        _append_if_present(
            zip_entries,
            collect_run_log(
                run_id=run_id,
                run=run,
                run_data_manager=run_data_manager,
                protocol_store=protocol_store,
                staging_dir=staging_dir,
            ),
        )
    if labware_offsets:
        _append_if_present(
            zip_entries,
            collect_labware_offsets(
                run_id=run_id,
                run=run,
                run_data_manager=run_data_manager,
                protocol_store=protocol_store,
                staging_dir=staging_dir,
            ),
        )
    if csv_output:
        zip_entries.extend(
            collect_existing_run_output_csvs(
                run_id,
                data_files_store,
                archive_prefix=build_download_artifact_name(
                    run=run, protocol_store=protocol_store, suffix="_output"
                ),
            )
        )

    return zip_entries

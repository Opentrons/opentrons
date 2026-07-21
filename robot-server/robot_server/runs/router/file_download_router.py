"""Router for /runs/{runId}/download file bundle endpoints."""

import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Annotated, List, Literal, Optional, Tuple, Union

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
    sanitize_filename_component,
    write_zip_for_download,
)
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
from robot_server.persistence.fastapi_dependencies import (
    get_active_persistence_directory,
)
from robot_server.protocols.dependencies import get_protocol_store
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore
from robot_server.runs.dependencies import get_run_data_manager, get_run_store
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import RunCommandSummary, RunNotFoundError
from robot_server.runs.run_store import BadRunResource, RunResource, RunStore

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
    run_store: Annotated[RunStore, Depends(get_run_store)],
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
    persistence_directory: Annotated[
        Path, Depends(get_active_persistence_directory)
    ],
) -> FileResponse:
    """Download files associated with a run as a zip archive.

    Arguments:
        runId: The run ID to download files for.
        run_store: Store for run data management.
        run_data_manager: Run data retrieval interface.
        data_files_store: Store for data files database access.
        protocol_store: Store for protocol storage access.
        persistence_directory: Persistence directory used for download staging.
    """
    try:
        run = run_store.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    staging_dir = create_download_staging_dir(persistence_directory)
    staging_path = Path(staging_dir.name)

    try:
        # (filesystem path, archive path within the zip)
        zip_entries: List[Tuple[Path, str]] = []

        zip_entries.extend(
            collect_existing_run_images(
                runId, data_files_store, archive_prefix="images"
            )
        )
        protocol_entry = _collect_protocol_file(run.protocol_id, protocol_store)
        if protocol_entry is not None:
            zip_entries.append(protocol_entry)

        rtp_csv_entry = _collect_rtp_csv(
            run_id=runId,
            run_data_manager=run_data_manager,
            data_files_store=data_files_store,
        )
        if rtp_csv_entry is not None:
            zip_entries.append(rtp_csv_entry)

        run_log_entry = _collect_run_log(
            run_id=runId,
            run=run,
            run_data_manager=run_data_manager,
            protocol_store=protocol_store,
            staging_dir=staging_path,
        )
        if run_log_entry is not None:
            zip_entries.append(run_log_entry)

        offsets_entry = _collect_labware_offsets(
            run_id=runId,
            run=run,
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
                archive_prefix=_build_output_csvs_directory_name(
                    run=run, protocol_store=protocol_store
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


def _collect_rtp_csv(
    run_id: str,
    run_data_manager: RunDataManager,
    data_files_store: DataFilesStore,
) -> Optional[Tuple[Path, str]]:
    """Return the CSV runtime parameter input file, or None if unavailable."""
    try:
        run_record = run_data_manager.get(run_id)
        for param in run_record.runTimeParameters:
            if param.type == "csv_file" and param.file is not None:
                file_info = data_files_store.get(param.file.id)
                file_path = Path(file_info.path)
                if file_path.exists() and file_path.is_file():
                    return (file_path, file_info.name)
        return None
    except Exception:
        return None


def _collect_run_log(
    run_id: str,
    run: Union[RunResource, BadRunResource],
    run_data_manager: RunDataManager,
    protocol_store: ProtocolStore,
    staging_dir: Path,
) -> Optional[Tuple[Path, str]]:
    """Build a run log JSON file in ``staging_dir``, or None if unavailable."""
    try:
        run_record = run_data_manager.get(run_id)
        length_probe = run_data_manager.get_commands_slice(
            run_id=run_id,
            cursor=0,
            length=0,
            include_fixit_commands=True,
        )
        command_slice = run_data_manager.get_commands_slice(
            run_id=run_id,
            cursor=0,
            length=length_probe.total_length,
            include_fixit_commands=True,
        )
        command_summaries = [
            RunCommandSummary.model_construct(
                id=c.id,
                key=c.key,
                commandType=c.commandType,
                intent=c.intent,
                status=c.status,
                createdAt=c.createdAt,
                startedAt=c.startedAt,
                completedAt=c.completedAt,
                params=c.params,
                error=c.error,
                notes=c.notes,
                failedCommandId=c.failedCommandId,
                commandAnnotationIds=c.commandAnnotationIds
                if c.commandAnnotationIds
                else None,
            ).model_dump(mode="json", by_alias=True)
            for c in command_slice.commands
        ]

        run_details = {
            "data": run_record.model_dump(mode="json", by_alias=True),
            "commands": {
                "data": command_summaries,
                "meta": {
                    "cursor": command_slice.cursor,
                    "totalLength": command_slice.total_length,
                },
            },
        }

        archive_name = _build_run_log_filename(run=run, protocol_store=protocol_store)
        return _write_staging_json(run_details, archive_name, staging_dir)
    except Exception:
        return None


def _collect_labware_offsets(
    run_id: str,
    run: Union[RunResource, BadRunResource],
    run_data_manager: RunDataManager,
    protocol_store: ProtocolStore,
    staging_dir: Path,
) -> Optional[Tuple[Path, str]]:
    """Build labware offsets JSON in ``staging_dir``, or None if unavailable."""
    try:
        run_record = run_data_manager.get(run_id)
        offsets_payload = [
            offset.model_dump(mode="json", by_alias=True)
            for offset in run_record.labwareOffsets
        ]
        archive_name = _build_labware_offsets_filename(
            run=run, protocol_store=protocol_store
        )
        return _write_staging_json(offsets_payload, archive_name, staging_dir)
    except Exception:
        return None


def _write_staging_json(
    payload: object, archive_name: str, staging_dir: Path
) -> Tuple[Path, str]:
    """Write JSON payload into the request scratch directory for zip inclusion."""
    file_path = staging_dir / archive_name
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open(mode="w", encoding="utf-8") as json_file:
        json.dump(payload, json_file)
    return (file_path, archive_name)


def _build_run_log_filename(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolName}_{ISO-timestamp}.json`."""
    created_at = _format_download_timestamp(run.created_at)
    name_stem = _protocol_display_name_stem(run=run, protocol_store=protocol_store)
    return f"{name_stem}_{created_at}.json"


def _build_labware_offsets_filename(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolFileName}_{ISO-timestamp}_offsetdata.json`."""
    created_at = _format_download_timestamp(run.created_at)
    name_stem = _protocol_file_name_stem(run=run, protocol_store=protocol_store)
    return f"{name_stem}_{created_at}_offsetdata.json"


def _build_output_csvs_directory_name(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolFileStem}_{ISO-timestamp}_output` directory name."""
    created_at = _format_download_timestamp(run.created_at)
    name_stem = _protocol_file_name_stem(run=run, protocol_store=protocol_store)
    return f"{name_stem}_{created_at}_output"


def _protocol_display_name_stem(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Prefer protocolName metadata, then protocol file name, then ids."""
    if run.protocol_id is not None:
        try:
            protocol = protocol_store.get(run.protocol_id)
        except ProtocolNotFoundError:
            protocol = None

        if protocol is not None:
            protocol_name = protocol.source.metadata.get("protocolName")
            if protocol_name is None:
                protocol_name = protocol.source.main_file.name
            return sanitize_filename_component(str(protocol_name))
        else:
            return sanitize_filename_component(run.protocol_id)

    else:
        return sanitize_filename_component(run.run_id)


def _protocol_file_name_stem(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Prefer the protocol main file stem, then ids."""
    if run.protocol_id is not None:
        try:
            protocol = protocol_store.get(run.protocol_id)
        except ProtocolNotFoundError:
            protocol = None

        if protocol is not None:
            return sanitize_filename_component(protocol.source.main_file.stem)

        else:
            return sanitize_filename_component(run.protocol_id)

    else:
        return sanitize_filename_component(run.run_id)


def _format_download_timestamp(created_at: datetime) -> str:
    """Format a run createdAt timestamp like JS toISOString."""
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    else:
        created_at = created_at.astimezone(timezone.utc)

    iso = created_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return iso.replace(":", "_")


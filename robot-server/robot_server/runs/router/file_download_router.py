"""Router for /runs/{runId}/download file bundle endpoints."""

import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Annotated, AsyncIterator, List, Literal, Optional, Tuple, Union

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
    sanitize_filename_component,
    stream_zip,
)
from robot_server.errors.error_responses import ErrorBody, ErrorDetails
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

        - Camera images under an `images/` directory
        - The protocol source file
        - The run log
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
    run_data_manager: Annotated[RunDataManager, Depends(get_run_data_manager)],
    data_files_store: Annotated[DataFilesStore, Depends(get_data_files_store)],
    protocol_store: Annotated[ProtocolStore, Depends(get_protocol_store)],
) -> StreamingResponse:
    """Download files associated with a run as a zip archive.

    Arguments:
        runId: The run ID to download files for.
        run_store: Store for run data management.
        run_data_manager: Run data retrieval interface.
        data_files_store: Store for data files database access.
        protocol_store: Store for protocol storage access.
    """
    try:
        run = run_store.get(runId)
    except RunNotFoundError as e:
        raise RunNotFound(detail=str(e)).as_error(status.HTTP_404_NOT_FOUND) from e

    # (filesystem path, archive path within the zip)
    zip_entries: List[Tuple[Path, str]] = []
    temp_paths: List[Path] = []

    zip_entries.extend(
        collect_existing_run_images(runId, data_files_store, archive_prefix="images")
    )
    protocol_entry = _collect_protocol_file(run.protocol_id, protocol_store)
    if protocol_entry is not None:
        zip_entries.append(protocol_entry)

    run_log_entry = _collect_run_log(
        run_id=runId,
        run=run,
        run_data_manager=run_data_manager,
        protocol_store=protocol_store,
    )
    if run_log_entry is not None:
        zip_entries.append(run_log_entry)
        temp_paths.append(run_log_entry[0])

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
        _stream_zip_cleaning_temps(zip_entries, temp_paths),
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


def _collect_run_log(
    run_id: str,
    run: Union[RunResource, BadRunResource],
    run_data_manager: RunDataManager,
    protocol_store: ProtocolStore,
) -> Optional[Tuple[Path, str]]:
    """Build a run log JSON file, or None if unavailable."""
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
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".json",
            delete=False,
            encoding="utf-8",
        ) as temp_file:
            json.dump(run_details, temp_file)
            temp_path = Path(temp_file.name)

        return (temp_path, archive_name)
    except Exception:
        return None


def _build_run_log_filename(
    run: Union[RunResource, BadRunResource],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolName}_{ISO-timestamp}.json`."""
    created_at = _format_download_timestamp(run.created_at)
    name_stem = _protocol_display_name_stem(run=run, protocol_store=protocol_store)
    return f"{name_stem}_{created_at}.json"

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


def _format_run_log_timestamp(created_at: datetime) -> str:
    """Format a run createdAt timestamp like JS toISOString, with ':' -> '_'."""
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    else:
        created_at = created_at.astimezone(timezone.utc)

    iso = created_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return iso.replace(":", "_")


async def _stream_zip_cleaning_temps(
    entries: List[Tuple[Path, str]],
    temp_paths: List[Path],
) -> AsyncIterator[bytes]:
    """Stream a zip archive, then delete any temporary files used as entries."""
    try:
        async for chunk in stream_zip(entries):
            yield chunk
    finally:
        for path in temp_paths:
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass

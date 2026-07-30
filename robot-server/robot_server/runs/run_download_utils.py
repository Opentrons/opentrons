import json
from datetime import datetime, timezone
from pathlib import Path

from typing import Optional, Tuple, Union

from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore
from robot_server.data_files.zip_utils import sanitize_filename_component
from robot_server.runs.run_models import BadRun, Run, RunCommandSummary
from robot_server.runs.run_data_manager import RunDataManager


def collect_protocol_file(
    run: Union[Run, BadRun],
    protocol_store: ProtocolStore,
) -> Optional[Tuple[Path, str]]:
    """Return the protocol main file for the zip, or None if unavailable."""
    if run.protocolId is None:
        return None

    try:
        protocol = protocol_store.get(run.protocolId)
    except ProtocolNotFoundError:
        return None

    main_file = protocol.source.main_file
    if not main_file.exists() or not main_file.is_file():
        return None

    name_stem = _protocol_download_name_stem(run=run, protocol_store=protocol_store)
    return main_file, f"{name_stem}{main_file.suffix}"


def collect_rtp_csv(
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
                    return file_path, file_info.name
        return None
    except Exception:
        return None


def collect_run_log(
    run_id: str,
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

        archive_name = _build_run_log_filename(
            run=run_record, protocol_store=protocol_store
        )
        return _write_staging_json(run_details, archive_name, staging_dir)
    except Exception:
        return None


def collect_labware_offsets(
    run_id: str,
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
            run=run_record, protocol_store=protocol_store
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
    return file_path, archive_name


def build_download_artifact_name(
    run: Union[Run, BadRun],
    protocol_store: ProtocolStore,
    *,
    suffix: str,
) -> str:
    """Build `{protocolName}_{ISO-timestamp}{suffix}` for zip entries/directories."""
    created_at = _format_download_timestamp(run.createdAt)
    name_stem = _protocol_download_name_stem(run=run, protocol_store=protocol_store)
    return f"{name_stem}_{created_at}{suffix}"


def _build_run_log_filename(
    run: Union[Run, BadRun],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolName}_{ISO-timestamp}.json`."""
    return build_download_artifact_name(
        run=run, protocol_store=protocol_store, suffix=".json"
    )


def _build_labware_offsets_filename(
    run: Union[Run, BadRun],
    protocol_store: ProtocolStore,
) -> str:
    """Build `{protocolName}_{ISO-timestamp}_offsetdata.json`."""
    return build_download_artifact_name(
        run=run, protocol_store=protocol_store, suffix="_offsetdata.json"
    )


def _protocol_download_name_stem(
    run: Union[Run, BadRun],
    protocol_store: ProtocolStore,
) -> str:
    """Prefer protocolName metadata, then protocol file name, then ids."""
    if run.protocolId is not None:
        try:
            protocol = protocol_store.get(run.protocolId)
        except ProtocolNotFoundError:
            protocol = None

        if protocol is not None:
            protocol_name = protocol.source.metadata.get("protocolName")
            if protocol_name is None:
                protocol_name = protocol.source.main_file.stem
            return sanitize_filename_component(str(protocol_name))

        return sanitize_filename_component(run.protocolId)

    return sanitize_filename_component(run.id)


def _format_download_timestamp(created_at: datetime) -> str:
    """Format a run createdAt timestamp like JS toISOString."""
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    else:
        created_at = created_at.astimezone(timezone.utc)

    iso = created_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return iso.replace(":", "_")

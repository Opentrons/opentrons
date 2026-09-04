"""Route handlers for audit log export endpoints."""

import json
import tempfile
import zipfile
from pathlib import Path
from typing import Annotated, Final

import fastapi
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    MultiBodyMeta,
    SimpleBody,
    SimpleMultiBody,
)
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import SignMessageData
from server_utils.persistence.persistence_directory import (
    ensure_persistence_temp_directory,
)
from server_utils.robot.fastapi import get_robot_client
from server_utils.robot.robot_server import (
    ActiveCurrentRunNotFoundError,
)
from server_utils.robot.robot_server import (
    Client as RobotServerClient,
)

from .models import DeleteLogPeriodResult
from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import (
    InvalidDeletionKeyError,
    LogDataManager,
)
from audit_server.log_storage.models import (
    LogPeriodDetails,
    LogPeriodSummary,
    TotalUsageSummary,
)
from audit_server.log_storage.store import NoPeriodById, PeriodIsActiveError
from audit_server.persistence.fastapi_dependencies import get_persistence_directory_root

router = fastapi.APIRouter()

_DOWNLOAD_STAGING_PREFIX: Final = "temp-download-staging-"

# Response header carrying the one-time deletion key for a downloaded log period.
# Must match ``LOG_PERIOD_DELETION_KEY_HEADER`` in api-client/src/audit/constants.ts.
_DELETION_KEY_HEADER: Final = "opentrons-log-period-deletion-key"


@router.get(
    "/audit/external/diskUsage",
    summary="Get the disk usage of stored audit logs",
    description="Return a summary of disk usage and a breakdown by period",
)
async def get_usage_summary(
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> SimpleBody[TotalUsageSummary]:
    """Get the disk usage of the audit server."""
    summary = log_data_manager.get_total_fs_usage()
    return SimpleBody.model_construct(data=summary)


@router.get(
    "/audit/external/logPeriods",
    summary="Get all audit log periods",
    description="Returns all stored audit log periods, ordered oldest first.",
)
async def get_log_periods(
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> SimpleMultiBody[LogPeriodSummary]:
    """Get all audit log periods."""
    periods = log_data_manager.get_log_periods()
    return SimpleMultiBody.model_construct(
        data=periods,
        meta=MultiBodyMeta(cursor=0, totalLength=len(periods)),
    )


@router.get(
    "/audit/external/logPeriods/{periodId}/download",
    summary="Download a zipped verifiable audit log period",
    description="Exports a zip file with the period's user action logs, robot logs,"
    " robot log signing public key, and robot identity file.",
    responses={
        fastapi.status.HTTP_404_NOT_FOUND: {
            "description": "No log period could be found for the period ID."
        },
        fastapi.status.HTTP_409_CONFLICT: {
            "description": "When requesting current log period, no current run"
            " could be found when one is running."
        },
    },
)
async def download_log_period(
    periodId: str,
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
    key_client: Annotated[KeyClient, fastapi.Depends(get_key_client)],
    robot_server_client: Annotated[
        RobotServerClient, fastapi.Depends(get_robot_client)
    ],
    persistence_directory_root: Annotated[
        Path, fastapi.Depends(get_persistence_directory_root)
    ],
) -> FileResponse:
    """Download a zipped verifiable audit log period."""
    try:
        period_entries = log_data_manager.get_period_entries(period_id=periodId)
        period_details = log_data_manager.get_log_period_details(period_id=periodId)
    except NoPeriodById as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"No log period found with ID {periodId}",
        ) from exc

    headers: dict[str, str] = {}

    # The period exists, so mint a deletion key linked to it and hand it back in
    # a response header. The app stores this key and presents it to later delete
    # the period.
    try:
        headers[_DELETION_KEY_HEADER] = log_data_manager.create_deletion_key(
            period_id=periodId
        )
    except PeriodIsActiveError:
        pass

    signing_key = await key_client.get_key_and_hash()
    robot_info = await robot_server_client.get_name_and_serial()
    if period_details.endedAt is None:
        try:
            current_run_log_response = await robot_server_client.get_current_run_log()
        except ActiveCurrentRunNotFoundError as exc:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_409_CONFLICT,
                detail="Could not find run log information for active run.",
            ) from exc

        serialized_log = current_run_log_response.serialized_log
    else:
        serialized_log = None

    signed_robot_identity = await key_client.sign_message(
        SignMessageData(
            message=json.dumps(
                {
                    "robot_name": robot_info.name,
                    "robot_serial": robot_info.serial,
                    "public_hash": signing_key.publicHash,
                }
            ),
            previousHash=None,
        )
    )

    temp_root = ensure_persistence_temp_directory(persistence_directory_root)
    temp_dir = tempfile.TemporaryDirectory(
        prefix=_DOWNLOAD_STAGING_PREFIX, dir=str(temp_root)
    )

    zip_file_path = Path(temp_dir.name) / "log_period.zip"
    with zipfile.ZipFile(zip_file_path, mode="w") as zh:
        zh.writestr("log_period.json", period_entries.user_log.model_dump_json())
        zh.writestr("signing_key.pem", signing_key.publicKey)
        zh.writestr("robot_identity.json", signed_robot_identity.model_dump_json())
        for robot_log in period_entries.robot_log_entries:
            robot_log_path = Path(robot_log.file_path)
            zh.write(robot_log_path, arcname=robot_log_path.name)
        if serialized_log is not None:
            zh.writestr(serialized_log.filename, serialized_log.serialized_json)

    def cleanup_files() -> None:
        zip_file_path.unlink()
        temp_dir.cleanup()

    return FileResponse(
        zip_file_path,
        media_type="application/zip",
        headers=headers,
        background=BackgroundTask(cleanup_files),
    )


@router.get(
    "/audit/external/logPeriods/{periodId}",
    summary="Get a summary of a log period",
    description=(
        "Returns a summary of a log period, including the start and end timestamps,"
        " the number of included records, the total size of the period, and filenames"
        " of any attached files."
    ),
    responses={
        fastapi.status.HTTP_404_NOT_FOUND: {
            "description": "No log period could be found for the period ID."
        }
    },
)
async def get_log_period_summary(
    periodId: str,
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> SimpleBody[LogPeriodDetails]:
    """Get a summary of a log period."""
    try:
        period_details = log_data_manager.get_log_period_details(period_id=periodId)
    except NoPeriodById as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"No log period found with ID {periodId}",
        ) from exc

    return SimpleBody.model_construct(data=period_details)


@router.delete(
    "/audit/external/logPeriods/{periodId}",
    summary="Delete a log period.",
    description=(
        "Removes a log period from storage, given a download key that proves that this "
        "client has downloaded the logs. Clients must store the log somewhere secure."
    ),
    responses={
        fastapi.status.HTTP_404_NOT_FOUND: {
            "description": "No log period could be found for the period ID.",
        },
        fastapi.status.HTTP_409_CONFLICT: {
            "description": "The deletion key provided is not valid for this log period."
        },
    },
    dependencies=[
        fastapi.Depends(require_scopes(Scope.AUDIT_LOG_DELETE)),
        fastapi.Depends(get_audit_logger("delete audit log period")),
    ],
)
async def delete_log_period(
    periodId: str,
    deletionKey: Annotated[
        str, fastapi.Query(description="The deletion key for this log period")
    ],
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> SimpleBody[DeleteLogPeriodResult]:
    """Delete a log period."""
    try:
        deleted_period_id = await log_data_manager.delete_log_period(
            period_id=periodId, deletion_key=deletionKey
        )
    except InvalidDeletionKeyError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail=f"Invalid deletion key for log period {periodId}",
        )
    except NoPeriodById:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"No such log period {periodId}",
        )
    except PeriodIsActiveError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail="Active log periods cannot be deleted",
        )

    return SimpleBody.model_construct(
        data=DeleteLogPeriodResult(deletedPeriodId=deleted_period_id)
    )

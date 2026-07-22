"""Route handlers for audit log export endpoints."""

import json
import tempfile
import zipfile
from pathlib import Path
from typing import Annotated

import fastapi
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, SimpleMultiBody
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import SignMessageData
from server_utils.robot.fastapi import get_robot_client
from server_utils.robot.robot_server import Client as RobotServerClient

from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.log_storage.models import LogPeriodSummary
from audit_server.log_storage.store import NoPeriodById
from audit_server.persistence.fastapi_dependencies import get_persistence_directory_root

router = fastapi.APIRouter()


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
        }
    },
)
async def download_log_period(
    periodId: str,
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
    key_client: Annotated[KeyClient, fastapi.Depends(get_key_client)],
    robot_server_client: Annotated[
        RobotServerClient, fastapi.Depends(get_robot_client)
    ],
    persistence_dir: Annotated[Path, fastapi.Depends(get_persistence_directory_root)],
) -> FileResponse:
    """Get all audit log periods."""
    try:
        periods = log_data_manager.get_period_entries(period_id=periodId)
    except NoPeriodById as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"No log period found with ID {periodId}",
        ) from exc

    signing_key = await key_client.get_key_and_hash()
    robot_info = await robot_server_client.get_name_and_serial()

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

    temp_dir = tempfile.TemporaryDirectory(
        prefix="temp-download-staging", dir=persistence_dir
    )

    zip_file_path = Path(temp_dir.name) / "log_period.zip"
    with zipfile.ZipFile(zip_file_path, mode="w") as zh:
        zh.writestr("log_period.json", periods.user_log.model_dump_json())
        zh.writestr("signing_key.pem", signing_key.publicKey)
        zh.writestr("robot_identity.json", signed_robot_identity.model_dump_json())
        for robot_log in periods.robot_log_entries:
            robot_log_path = Path(robot_log.file_path)
            zh.write(robot_log_path, arcname=robot_log_path.name)

    def cleanup_files() -> None:
        zip_file_path.unlink()
        temp_dir.cleanup()

    return FileResponse(
        zip_file_path,
        media_type="application/zip",
        background=BackgroundTask(cleanup_files),
    )

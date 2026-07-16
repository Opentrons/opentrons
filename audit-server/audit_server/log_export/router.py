"""Route handlers for audit log export endpoints."""

import os
import zipfile
from pathlib import Path
from typing import Annotated

import fastapi
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from server_utils.fastapi_utils.models.json_api import MultiBodyMeta, SimpleMultiBody
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient

from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import LogDataManager
from audit_server.log_storage.models import LogPeriodSummary
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
)
async def download_log_period(
    periodId: str,
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
    key_client: Annotated[KeyClient, fastapi.Depends(get_key_client)],
    persistence_dir: Annotated[Path, fastapi.Depends(get_persistence_directory_root)],
) -> FileResponse:
    """Get all audit log periods."""
    periods = log_data_manager.get_period_entries(period_id=periodId)
    signing_key = await key_client.get_key_and_hash()

    user_log_path = persistence_dir / "log_period.json"
    with open(user_log_path, "w", encoding="utf-8") as fh:
        fh.write(periods.user_log.model_dump_json())

    pem_key_path = persistence_dir / "signing_key.pem"
    with open(pem_key_path, "w", encoding="utf-8") as fh:
        fh.write(signing_key.publicKey)

    zip_file_name = persistence_dir / "log_period.zip"
    with zipfile.ZipFile(zip_file_name, mode="w") as zh:
        zh.write(user_log_path, arcname=user_log_path.name)
        zh.write(pem_key_path, arcname=pem_key_path.name)
        for robot_log in periods.robot_log_entries:
            robot_log_path = Path(robot_log.file_path)
            zh.write(robot_log_path, arcname=robot_log_path.name)

    def cleanup_files() -> None:
        os.remove(user_log_path)
        os.remove(pem_key_path)
        os.remove(zip_file_name)

    return FileResponse(
        zip_file_name,
        media_type="application/zip",
        background=BackgroundTask(cleanup_files),
    )

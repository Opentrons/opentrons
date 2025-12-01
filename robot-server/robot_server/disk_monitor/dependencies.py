"""Dependency functions for use with `fastapi.Depends()`."""
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.settings import RobotServerSettings, get_settings


async def get_disk_monitor(
    images_directory: Annotated[Path, Depends(get_images_directory)],
    settings: Annotated[RobotServerSettings, Depends(get_settings)],
) -> DiskMonitor:
    """Return the server's singleton `DiskMonitor`."""
    disk_monitor = DiskMonitor(
        images_directory=images_directory,
        settings=settings,
    )

    return disk_monitor

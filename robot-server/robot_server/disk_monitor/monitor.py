"""Monitor disk space and directory usage."""
import os
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.settings import get_settings, RobotServerSettings


class DiskMonitor:
    """Monitors disk space, including directory size usage."""

    def __init__(
        self,
        images_directory: Annotated[Path, Depends(get_images_directory)],
        settings: Annotated[RobotServerSettings, Depends(get_settings)],
    ) -> None:
        self._images_directory = images_directory
        self._settings = settings

    def get_available_disk_space_mb(self) -> float:
        """Get the available disk space in megabytes."""
        stat = os.statvfs(self._images_directory)
        available_bytes = stat.f_bavail * stat.f_frsize

        return available_bytes / (1024 * 1024)

    def is_disk_space_low(self) -> bool:
        """Check if available disk space is below the configured threshold."""
        available_mb = self.get_available_disk_space_mb()

        return available_mb <= self._settings.system_low_space_threshold_mb

    def get_images_directory_size_mb(self) -> float:
        """Get the total size of all content in the images directory."""
        total_bytes = 0
        for dirpath, dirnames, filenames in os.walk(self._images_directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    total_bytes += os.path.getsize(filepath)
                except (OSError, FileNotFoundError):
                    continue

        return total_bytes / (1024 * 1024)

    def is_images_directory_over_limit(self) -> bool:
        """Check if images directory size exceeds the configured limit."""
        size_mb = self.get_images_directory_size_mb()

        return size_mb > self._settings.images_directory_max_size_mb

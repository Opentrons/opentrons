"""Monitor disk space and directory usage."""

import os
import sys
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from .models import DiskDetails
from robot_server.persistence.fastapi_dependencies import get_images_directory
from robot_server.settings import RobotServerSettings, get_settings

_FALLBACK_DEFAULT_DISK_SPACE_MB = 10_000.0


class DiskMonitor:
    """Monitors disk space, including directory size usage."""

    def __init__(
        self,
        images_directory: Annotated[Path, Depends(get_images_directory)],
        settings: Annotated[RobotServerSettings, Depends(get_settings)],
    ) -> None:
        self._images_directory = images_directory
        self._settings = settings

    def get_details(self) -> DiskDetails:
        """Get a summary of disk usage."""
        used_space = self.get_total_disk_space_mb()
        available_space = self.get_available_disk_space_mb()
        images_size = self.get_images_directory_size_mb()
        limit = self._settings.system_low_space_threshold_mb
        return DiskDetails(
            systemAvailableMb=available_space,
            systemTotalMb=used_space,
            imagesDirectorySizeMb=images_size,
            runStartLimitFreeSpaceMb=limit,
            isDiskSpaceBelowRunStartLimit=self._disk_space_below_limit(available_space),
        )

    def get_available_disk_space_mb(self) -> float:
        """Get the available disk space in megabytes."""
        if sys.platform == "win32" or not hasattr(os, "statvfs"):
            return _FALLBACK_DEFAULT_DISK_SPACE_MB

        stat = os.statvfs(self._images_directory)
        available_bytes = stat.f_bavail * stat.f_frsize

        return available_bytes / (1024 * 1024)

    def is_disk_space_below_run_start_limit(self) -> bool:
        """True if a run should fail because we're out of space."""
        available_space = self.get_available_disk_space_mb()
        return self._disk_space_below_limit(available_space)

    def _disk_space_below_limit(self, available_space_mb: float) -> bool:
        return available_space_mb < self._settings.run_start_limit_free_space_mb

    def get_total_disk_space_mb(self) -> float:
        """Get the total disk space of the /data partition in megabytes."""
        if sys.platform == "win32" or not hasattr(os, "statvfs"):
            return _FALLBACK_DEFAULT_DISK_SPACE_MB

        stat = os.statvfs(self._images_directory)
        total_bytes = stat.f_blocks * stat.f_frsize

        return total_bytes / (1024 * 1024)

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

from logging import getLogger
from pathlib import Path

from .interface import SecureVolumeManager

LOG = getLogger(__name__)


class DevSecureVolume(SecureVolumeManager):
    """A fake secure volume suitable for tests or a dev server."""

    def __init__(self, image_mount_point: Path) -> None:
        self._path: Path | None = None
        self._image_mount_point = image_mount_point

    @property
    def path(self) -> Path:
        """Get the secure volume path."""
        if not self._path:
            raise RuntimeError("Volume not mounted")
        return self._path

    async def create(self) -> None:
        """Create the secure volume (noop in dev)."""
        pass

    async def destroy(self) -> None:
        """Destroy the secure volume (noop in dev)."""
        pass

    async def mount(self) -> None:
        """Mount (in this case, build) the secure volume."""
        self._path = self._image_mount_point
        self._path.mkdir(parents=True, exist_ok=True)
        if not self._path.is_dir():
            raise RuntimeError(f"Mountpoint path {str(self._path)} is occupied by file")
        if len(list(self._path.iterdir())) != 0:
            LOG.warning(f"Mountpoint {str(self._path)} is not empty")

    async def unmount(self) -> None:
        """Unmount (more or less) the secure volume."""
        self._maybe_tempdir = None
        self._path = None

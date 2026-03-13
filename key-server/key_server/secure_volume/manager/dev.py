import tempfile
from logging import getLogger
from pathlib import Path

from .interface import SecureVolumeManager
from key_server.config import get_config

LOG = getLogger(__name__)


class DevSecureVolume(SecureVolumeManager):
    """A fake secure volume suitable for tests or a dev server."""

    def __init__(self) -> None:
        self._path: Path | None = None
        self._maybe_tempdir: tempfile.TemporaryDirectory[str] | None = None

    @property
    def path(self) -> Path:
        """Get the secure volume path."""
        if not self._path:
            raise RuntimeError("Volume not mounted")
        return self._path

    async def must_create(self) -> bool:
        """For the dev implementation, create is unnecessary."""
        return False

    async def create(self) -> None:
        """Create the secure volume (noop in dev)."""
        pass

    async def destroy(self) -> None:
        """Destroy the secure volume (noop in dev)."""
        pass

    async def mount(self) -> None:
        """Mount (in this case, build) the secure volume."""
        if get_config().image_mount_point == "automatically_make_temporary":
            self._maybe_tempdir = tempfile.TemporaryDirectory()
            self._path = Path(self._maybe_tempdir.name)
        else:
            self._path = Path(get_config().image_mount_point)
            self._path.mkdir(parents=True, exist_ok=True)
            if not self._path.is_dir():
                raise RuntimeError(
                    f"Mountpoint path {str(self._path)} is occupied by file"
                )
            if len(list(self._path.iterdir())) != 0:
                LOG.warning(f"Mountpoint {str(self._path)} is not empty")

    async def unmount(self) -> None:
        """Unmount (more or less) the secure volume."""
        self._maybe_tempdir = None
        self._path = None

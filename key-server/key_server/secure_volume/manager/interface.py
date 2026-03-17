from pathlib import Path
from typing import Protocol


class SecureVolumeManager(Protocol):
    """A class that can manage the secure volume and make it available."""

    async def create(self) -> None:
        """Create the secure volume if it has not yet been initialized.

        Should be called automatically be mount() if necessary.
        """
        pass

    async def destroy(self) -> None:
        """Destroy the secure volume, making its data forever inaccessible.

        This should be used when keying changes.
        """
        pass

    async def mount(self) -> None:
        """Mount an existing secure volume. Automatically creates if necessary.

        Must be called before path will work.
        """
        pass

    async def unmount(self) -> None:
        """Unmount a secure volume without destroying it."""
        pass

    @property
    def path(self) -> Path:
        """Get the secure volume path. Should raise if the volume is not mounted."""
        pass

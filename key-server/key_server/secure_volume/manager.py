"""A software state manager for the CAAM secure volume."""

import asyncio
import json
import os
from logging import getLogger
from pathlib import Path
from typing import Annotated, Final, cast

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

LOG = getLogger(__name__)


class SecureVolumeManager:
    """Creates, modifies, and destroys the CAAM secure volume."""

    SECURE_STORAGE_DIRECTORY: Final[Path] = Path("/var/lib/opentrons-key-server")
    SECURE_STORAGE_KEY_NAME: Final[str] = "ot-secure-storage-key"
    SECURE_STORAGE_IMAGE_NAME: Final = "ot-secure-storage-backing"
    SECURE_STORAGE_MOUNT_DIR_NAME: Final = "ot-secure-storage"
    SECURE_STORAGE_KEYCTL_PREFIX: Final = "ot-secure-storage"
    SECURE_STORAGE_DEVMAPPER_NAME: Final = "ot-secure-storage"
    SECURE_STORAGE_SIZE_MB: Final = 64

    def __init__(self) -> None:
        """Build a SecureVolumeManager.

        Building one of these objects does very little on its own, because all the things it does need
        to be async.
        """
        self._keyid = 0

    def _keyblob(self) -> Path:
        return (
            SecureVolumeManager.SECURE_STORAGE_DIRECTORY
            / f"{SecureVolumeManager.SECURE_STORAGE_KEY_NAME}.bb"
        )

    def _image(self) -> Path:
        return (
            SecureVolumeManager.SECURE_STORAGE_DIRECTORY
            / SecureVolumeManager.SECURE_STORAGE_IMAGE_NAME
        )

    def _keyname(self) -> str:
        return f"{self.SECURE_STORAGE_KEYCTL_PREFIX}:{id(self)}"

    async def create(self) -> None:
        """Creates the secure volume by initializing a new CAAM black key and building a backing store."""
        if self._keyblob().exists():
            os.unlink(self._keyblob())
        create_bk = await asyncio.create_subprocess_exec(
            "/usr/bin/caam_keygen",
            "create",
            self.SECURE_STORAGE_KEY_NAME,
            "ccm",
            "-s",
            "24",
        )
        if await create_bk.wait() != 0:
            LOG.error(
                f"Failed to create CAAM black key ({create_bk.returncode}): stdout={create_bk.stdout}, stderr={create_bk.stderr}"
            )
        # the command above creates a keyblob and also the actual key. we could use
        # this actual key, but we'd have to have a special codepath, so we delete it
        # so we can use the codepath that we use during boot when we have a keyblob
        # but no loaded key yet.
        os.unlink(self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_KEY_NAME)
        # the secure storage is stored on disk as an encrypted blob; create a zeroed
        # file for it
        if self._image().exists():
            os.unlink(self._image())
        create_backing_store = await asyncio.create_subprocess_exec(
            "/usr/bin/dd",
            "if=/dev/zero",
            f"of={self._image()}",
            "bs=1M",
            f"count={self.SECURE_STORAGE_SIZE_MB}",
        )
        if await create_backing_store.wait() != 0:
            LOG.error(
                f"Failed to create backing store ({create_backing_store.returncode}): stdout={create_backing_store.returncode}, stderr={create_backing_store.stderr}"
            )
        await self._load_key()
        await self._loopback_setup()
        mkfs = await asyncio.create_subprocess_exec(
            "/usr/sbin/mkfs.ext4", f"/dev/mapper/{self.SECURE_STORAGE_DEVMAPPER_NAME}"
        )
        if await mkfs.wait() != 0:
            LOG.error(
                f"Failed to mkfs on the encrypted volume ({mkfs.returncode}): stdout={mkfs.stdout}, stderr={mkfs.stderr}"
            )

    async def _load_key(self) -> None:
        """Load the CAAM key from its state at boot - an encrypted, tagged blob - to the kernel key retention service.

        There are two stages: first, the key has to be loaded from the blob to an encrypted keyfile; this part can only be done on
        the same machine that generated the blob directly. Then you put the encrypted key data into the kernel key retention service
        using keyctl. We add it to the process keyring (the trailing @p) so that only the key-server can access it, and we add it as
        a logon type key so that the keymat is inaccessible from userspace anyway.

        The key is loaded to a magic name that depends on the identity of the keyserver. We may find this to be a bad idea at some
        point, but the goal is that the secure storage is an implementation detail of the keyserver and this class should have the
        lifetime of the keyserver, so we try and have the mount be the lifetime of the keyserver.
        """
        import_key = await asyncio.create_subprocess_exec(
            "/usr/bin/caam_keygen",
            "import",
            self._keyblob(),
            self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_KEY_NAME,
        )
        if await import_key.wait() != 0:
            LOG.error(
                f"Failed to import key: ({import_key.returncode}): stdout={import_key.stdout}, stderr={import_key.stderr}"
            )
        key_data = open(
            self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_KEY_NAME, "rb"
        ).read()

        keyring_add = await asyncio.create_subprocess_exec(
            "/usr/bin/keyctl",
            "padd",
            "logon",
            self._keyname(),
            "@p",
        )
        (stdout, stderr) = await keyring_add.communicate(input=key_data)
        if await keyring_add.wait() != 0:
            LOG.error(
                f"Failed to add key to KKRS ({keyring_add.returncode}): stdout={keyring_add.stdout}, stderr={keyring_add.stderr}"
            )
            self._keyid = 0
        else:
            LOG.info(f"added key to KKRS at {stdout!r}")
            self._keyid = int(stdout.strip())

        # we always want to delete the key after moving it to KKRS so we can run this again if we want
        (self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_KEY_NAME).unlink()

    async def _loopback_setup(self) -> None:
        """Set up the encrypted loopback device that makes the mount available to the key server."""
        losetup = await asyncio.create_subprocess_exec(
            "/usr/sbin/losetup", "-f", str(self._image())
        )
        if await losetup.wait() != 0:
            LOG.error(
                f"losetup failed ({losetup.returncode}): stdout={losetup.stdout}, stderr={losetup.stderr}"
            )
        losetup_device = await self._find_loopback_device()
        # this lovely magic string is a dmsetup table entry. in order the fields are
        # - offset to start the map (0)
        # - the size of the mapped file (what we passed to dd), in 512 byte sectors
        # - the map type (crypt)
        # - the encipherment details (capi:tk(cbc(aes))-plain)
        # - the key details, including the size, type, and description colon-separated (36:logon:description)
        # - the crypted mount IV, which is derived from the sector offset; that's 0 so this is 0
        # - the device, which we get from losetup
        # - where the encrypted data lives as an offset
        # - optional parameter count (1)
        # - the optional parameter of the encryption sector size (512)
        dmsetup_table = f"0 {self.SECURE_STORAGE_SIZE_MB * 1024 * 1024 / 512} crypt capi:tk(cbc(aes))-plain :36:logon:{self._keyname()} 0 {losetup_device} 0 1 sector_size:512"
        dmsetup = await asyncio.create_subprocess_exec(
            "/usr/bin/dmsetup",
            "create",
            self.SECURE_STORAGE_DEVMAPPER_NAME,
            "--table",
            dmsetup_table,
        )
        if await dmsetup.wait() != 0:
            LOG.error(
                f"dmsetup failed ({dmsetup.returncode}): stdout={dmsetup.stdout}, stderr={dmsetup.stderr}"
            )

    async def _mount(self) -> None:
        """Mount a created loopback device."""
        mount_path = self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_MOUNT_DIR_NAME
        if mount_path.is_dir() and len(list(mount_path.iterdir())) != 0:
            LOG.error(f"Non-empty mount path at {mount_path}")
            # this is most likely because it was already mounted; unmount it
            await self._unmount()
        elif not mount_path.is_dir():
            LOG.warning(f"File at mount path {mount_path}")
            mount_path.unlink()
            mount_path.mkdir()
        elif not mount_path.exists():
            mount_path.mkdir()
        mount = await asyncio.create_subprocess_exec(
            "/usr/sbin/mount",
            f"/dev/mapper/{self.SECURE_STORAGE_DEVMAPPER_NAME}",
            str(mount_path),
        )
        if await mount.wait() != 0:
            LOG.error(
                f"Failed to mount secure storage ({mount.returncode}): stdout={mount.stdout}, stderr={mount.stderr}"
            )

    async def _unmount(self) -> None:
        """Unmount a created loopback device."""
        mount_path = self.SECURE_STORAGE_DIRECTORY / self.SECURE_STORAGE_MOUNT_DIR_NAME
        unmount = await asyncio.create_subprocess_exec("/usr/sbin/unmount", mount_path)
        # we don't care if this fails, really; it would only do so if the mount wasn't mounted
        await unmount.wait()

    async def _unmap(self) -> None:
        """Unmap a created loopback device."""
        dmsetup_remove = await asyncio.create_subprocess_exec(
            "/usr/bin/dmsetup",
            "remove",
            "--force",
            "--retry",
            self.SECURE_STORAGE_DEVMAPPER_NAME,
        )
        if await dmsetup_remove.wait() != 0:
            LOG.warning(
                f"dmsetup remove failed ({dmsetup_remove.returncode}): stdout={dmsetup_remove.stdout}, stderr={dmsetup_remove.stderr}"
            )

    async def _find_loopback_device(self) -> str:
        losetup_list = await asyncio.create_subprocess_exec(
            "/usr/sbin/losetup", "--list", "--json"
        )
        stdout, stderr = await losetup_list.communicate()
        if losetup_list.returncode != 0:
            LOG.error(
                f"losetup list failed ({losetup_list.returncode}): stdout={losetup_list.stdout}, stderr={losetup_list.stderr}"
            )
        losetup_list_res = json.loads(stdout.decode().strip())
        devlist = losetup_list_res.get("loopdevices")
        for loopback_dev in devlist:
            if loopback_dev.get("backfile", "") == str(self._image()):
                return cast(str, loopback_dev.get("name", ""))
        LOG.error(
            f"Could not find loopback device for {str(self._image())} in losetup result {stdout!r}"
        )
        return ""

    async def mount(self) -> None:
        """Mounts a previously-created secure volume by loading a CAAM red key and setting up the dm-crypto table.

        If the keyblob does not exist (i.e. because of a previous call to destroy()), initializes a new one.
        """
        if self._keyblob().exists():
            await self.create()
        await self._load_key()
        await self._loopback_setup()
        await self._mount()

    async def unmount(self) -> None:
        """Unmounts a currently-mounted secure volume and tears down dm-crypto and key setup (though the keyblob is preserved)."""
        await self._unmount()
        await self._unmap()
        # the only way to delete a key from KKRS, as far as I'm aware, is to set a short timeout and then...
        # wait for a timeout
        timeout = await asyncio.create_subprocess_exec(
            "/usr/bin/keyctl", "timeout", str(self._keyid), "1"
        )
        if await timeout.wait() != 0:
            LOG.warning(
                f"key timeout failed ({timeout.returncode}): stdout={timeout.stdout}, stderr={timeout.stderr}"
            )

    async def destroy(self) -> None:
        """Destroys a secure volume by removing the CAAM keyblob."""
        await self.unmount()
        if self._keyblob().exists():
            self._keyblob().unlink()


_accessor = AppStateAccessor[SecureVolumeManager]("secure_volume_manager")


def install_secure_volume_manager(
    app_state: AppState, secure_volume_manager: SecureVolumeManager
) -> None:
    """Place the server's singleton SecureVolumeNaager in server state, for later retrieval by get_secure_volume_manager()."""
    _accessor.set_on(app_state, secure_volume_manager)


def get_secure_volume_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> SecureVolumeManager:
    """Return the server's singleton SecureVolumeManager."""
    secure_volume_manager = _accessor.get_from(app_state)
    if secure_volume_manager is None:
        secure_volume_manager = SecureVolumeManager()
        _accessor.set_on(app_state, secure_volume_manager)
    return secure_volume_manager

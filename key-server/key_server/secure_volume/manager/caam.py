"""A software state manager for the CAAM secure volume."""

from __future__ import annotations

import asyncio
import json
from functools import wraps
from logging import getLogger
from pathlib import Path
from subprocess import PIPE
from typing import (
    Any,
    Awaitable,
    Callable,
    Concatenate,
    Coroutine,
    Final,
    ParamSpec,
    TypeVar,
    cast,
)

from .interface import SecureVolumeManager
from key_server.util import subproc_wait_timeout

LOG = getLogger(__name__)

_R = TypeVar("_R")
_P = ParamSpec("_P")
_T = TypeVar("_T", bound="CAAMSecureVolume")


def _lock(
    func: Callable[Concatenate[_T, _P], Awaitable[_R]],
) -> Callable[Concatenate[_T, _P], Coroutine[Any, Any, _R]]:
    @wraps(func)
    async def _locked(slf: _T, /, *args: _P.args, **kwargs: _P.kwargs) -> _R:
        async with slf._lock_obj:
            return await func(slf, *args, **kwargs)

    return _locked


async def _stringify_process(
    proc: asyncio.subprocess.Process,
    override_stdout: str | None = None,
    override_stderr: str | None = None,
) -> str:
    """Provide a helpful stringification of processes for e.g. logs."""
    if override_stdout is not None:
        stdout_data = override_stdout
    elif proc.stdout is None:
        stdout_data = "<not captured>"
    else:
        stdout_data = (await proc.stdout.read()).decode()
    if override_stderr is not None:
        stderr_data = override_stderr
    elif proc.stderr is None:
        stderr_data = "<not captured>"
    else:
        stderr_data = (await proc.stderr.read()).decode()
    return f"subprocess {proc.pid}: returncode {proc.returncode} stdout={stdout_data} stderr={stderr_data}"


class CAAMSecureVolume(SecureVolumeManager):
    """Creates, modifies, and destroys the CAAM secure volume."""

    SECURE_STORAGE_KEY_NAME: Final[str] = "ot-secure-storage-key"
    SECURE_STORAGE_IMAGE_NAME: Final = "ot-secure-storage-backing"
    SECURE_STORAGE_KEYCTL_PREFIX: Final = "ot-secure-storage"
    SECURE_STORAGE_DEVMAPPER_NAME: Final = "ot-secure-storage"

    def __init__(
        self, image_mount_point: Path, base_directory: Path, volume_size_mb: int
    ) -> None:
        """Build a SecureVolumeManager.

        Building one of these objects does very little on its own, because all the things it does need
        to be async.
        """
        self._keyid = 0
        self._path: Path | None = None
        self._base_directory = base_directory
        self._image_mount_point = image_mount_point
        self._volume_size_mb = volume_size_mb
        self._lock_obj = asyncio.Lock()

    def _keyblob(self) -> Path:
        return self._base_directory / f"{self.SECURE_STORAGE_KEY_NAME}.bb"

    def _image(self) -> Path:
        return self._base_directory / self.SECURE_STORAGE_IMAGE_NAME

    def _keyname(self) -> str:
        return f"{self.SECURE_STORAGE_KEYCTL_PREFIX}:{id(self)}"

    async def _must_create(self) -> bool:
        """Check if the volume is created (by seeing if the image and keyblob exist)."""
        if not self._keyblob().exists():
            return True
        if not self._image().exists():
            return True
        return False

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
            "/usr/bin/caam-keygen",
            "import",
            str(self._keyblob()),
            str(self.SECURE_STORAGE_KEY_NAME),
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(import_key) != 0:
            LOG.error(f"Failed to import key: {await _stringify_process(import_key)}")
        else:
            LOG.info("Imported key from CAAM")
        key_data = (self._base_directory / self.SECURE_STORAGE_KEY_NAME).read_bytes()
        keyring_add = await asyncio.create_subprocess_exec(
            "/usr/bin/keyctl",
            "padd",
            "logon",
            str(self._keyname()),
            "@s",
            stdout=PIPE,
            stderr=PIPE,
            stdin=PIPE,
        )
        stdout_b, stderr_b = await keyring_add.communicate(input=key_data)
        stdout = stdout_b.decode()
        stderr = stderr_b.decode()
        if await subproc_wait_timeout(keyring_add) != 0:
            LOG.error(
                f"Failed to add key to KKRS: {await _stringify_process(keyring_add, override_stdout=stdout, override_stderr=stderr)}"
            )
            self._keyid = 0
        else:
            LOG.info(f"added key to KKRS at {stdout}")
            try:
                self._keyid = int(stdout)
            except ValueError:
                LOG.error(
                    f"Invalid key number from KKRS: {stdout} cannot be parsed as an int"
                )
        # we always want to delete the key after moving it to KKRS so we can run this again if we want
        (self._base_directory / self.SECURE_STORAGE_KEY_NAME).unlink()
        LOG.info("Removed key storage")

    async def _loopback_setup(self) -> None:
        """Set up the encrypted loopback device that makes the mount available to the key server."""
        losetup = await asyncio.create_subprocess_exec(
            "/usr/sbin/losetup", "-f", str(self._image()), stdout=PIPE, stderr=PIPE
        )
        if await subproc_wait_timeout(losetup) != 0:
            LOG.error(f"losetup failed: {_stringify_process(losetup)}")
        else:
            LOG.info("Set up loopback device")

    async def _map(self) -> None:
        """Set up a device-mapper map for the loopback."""
        losetup_device = await self._find_loopback_device()
        LOG.info(f"Using loopback device for secure volume image at {losetup_device}")
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
        SECTOR_SIZE_B = 512
        dmsetup_table = f"0 {self._volume_size_mb * 1024 * 1024 // SECTOR_SIZE_B} crypt capi:tk(cbc(aes))-plain :56:logon:{self._keyname()} 0 {losetup_device} 0 1 sector_size:{SECTOR_SIZE_B}"
        dmsetup = await asyncio.create_subprocess_exec(
            "/usr/sbin/dmsetup",
            "create",
            self.SECURE_STORAGE_DEVMAPPER_NAME,
            "--table",
            dmsetup_table,
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(dmsetup) != 0:
            LOG.error(
                f"dmsetup failed with table {dmsetup_table}: {await _stringify_process(dmsetup)}"
            )
        else:
            LOG.info("device-mapper map created")

    async def _mount(self) -> None:
        """Mount a created loopback device."""
        mount_path = self._image_mount_point
        if mount_path.is_dir() and len(list(mount_path.iterdir())) != 0:
            LOG.error(f"Non-empty mount path at {mount_path}")
            # this is most likely because it was already mounted; unmount it
            await self._unmount()
        elif mount_path.exists() and not mount_path.is_dir():
            # file, link, special, etc. delete it
            LOG.warning(f"File at mount path {mount_path}")
            mount_path.unlink()
            mount_path.mkdir()
        elif not mount_path.exists():
            LOG.info("Creating mount path")
            mount_path.mkdir()
        mount = await asyncio.create_subprocess_exec(
            "/usr/bin/mount",
            f"/dev/mapper/{self.SECURE_STORAGE_DEVMAPPER_NAME}",
            str(mount_path),
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(mount) != 0:
            LOG.error(
                f"Failed to mount secure storage: {await _stringify_process(mount)}"
            )
        else:
            LOG.info("Mounted secure volume")

    async def _unmount(self) -> None:
        """Unmount a created loopback device."""
        mount_path = self._image_mount_point
        unmount = await asyncio.create_subprocess_exec(
            "/usr/bin/umount", str(mount_path), stdout=PIPE, stderr=PIPE
        )
        # we don't care if this fails, really; it would only do so if the mount wasn't mounted
        await subproc_wait_timeout(unmount)
        LOG.info("Unmounted secure volume")

    async def _unmap(self) -> None:
        """Unmap a created loopback device."""
        dmsetup_remove = await asyncio.create_subprocess_exec(
            "/usr/sbin/dmsetup",
            "remove",
            "--force",
            "--retry",
            self.SECURE_STORAGE_DEVMAPPER_NAME,
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(dmsetup_remove) != 0:
            LOG.warning(
                f"dmsetup remove failed: {await _stringify_process(dmsetup_remove)}"
            )
        else:
            LOG.info("Removed diskmapper bind")

    async def _loopback_remove(self) -> None:
        """Remove a loopback bind."""
        loopback_device = await self._find_loopback_device()
        losetup_remove = await asyncio.create_subprocess_exec(
            "/usr/sbin/losetup", "-d", loopback_device, stdout=PIPE, stderr=PIPE
        )
        if (await subproc_wait_timeout(losetup_remove)) != 0:
            LOG.error(f"losetup remove failed: {_stringify_process(losetup_remove)}")
        else:
            LOG.info(f"Removed loopback device {loopback_device}")

    async def _unload_key(self) -> None:
        """Unload a key from KKRS."""
        # the only way to delete a key from KKRS, as far as I'm aware, is to set a short timeout and then...
        # wait for a timeout
        timeout = await asyncio.create_subprocess_exec(
            "/usr/bin/keyctl",
            "timeout",
            str(self._keyid),
            "1",
            stdout=PIPE,
            stderr=PIPE,
        )
        self._keyid = 0
        if await subproc_wait_timeout(timeout) != 0:
            LOG.warning(f"key timeout failed: {await _stringify_process(timeout)}")
        else:
            LOG.info("set key timeout from kkrs")

    async def _find_loopback_device(self) -> str:
        losetup_list = await asyncio.create_subprocess_exec(
            "/usr/sbin/losetup",
            "--list",
            "--json",
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(losetup_list) != 0:
            LOG.error(f"losetup list failed: {await _stringify_process(losetup_list)} ")
        assert losetup_list.stdout
        losetup_stdout_data = (await losetup_list.stdout.read()).decode().strip()
        losetup_list_res = json.loads(losetup_stdout_data)
        devlist = losetup_list_res.get("loopdevices")
        for loopback_dev in devlist:
            if loopback_dev.get("back-file", "") == str(self._image()):
                return cast(str, loopback_dev.get("name", ""))
        LOG.error(
            f"Could not find loopback device for {str(self._image())} in losetup result {losetup_stdout_data}"
        )
        return ""

    @_lock
    async def create(self) -> None:
        """Creates the secure volume by initializing a new CAAM black key and building a backing store."""
        return await self._do_create()

    async def _do_create(self) -> None:
        LOG.info("Creating secure volume: beginning")
        if self._keyblob().exists():
            LOG.info("Creating secure volume: removing existing CAAM keyblob")
            self._keyblob().unlink()
        LOG.info("Creating secure volume: creating CAAM keyblob")
        create_bk = await asyncio.create_subprocess_exec(
            "/usr/bin/caam-keygen",
            "create",
            str(self.SECURE_STORAGE_KEY_NAME),
            "ccm",
            "-s",
            "24",
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(create_bk) != 0:
            LOG.error(
                f"Failed to create CAAM black key: {await _stringify_process(create_bk)}"
            )
        # the command above creates a keyblob and also the actual key. we could use
        # this actual key, but we'd have to have a special codepath, so we delete it
        # so we can use the codepath that we use during boot when we have a keyblob
        # but no loaded key yet.
        (self._base_directory / self.SECURE_STORAGE_KEY_NAME).unlink()
        # the secure storage is stored on disk as an encrypted blob; create a zeroed
        # file for it
        if self._image().exists():
            LOG.info("Creating secure volume: removing old secure volume image")
            self._image().unlink()
        LOG.info("Creating secure volume: making new secure volume image")
        create_backing_store = await asyncio.create_subprocess_exec(
            "/usr/bin/dd",
            "if=/dev/zero",
            f"of={str(self._image())}",
            "bs=1M",
            f"count={self._volume_size_mb}",
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(create_backing_store) != 0:
            LOG.error(
                f"Creating secure volume: failed to create backing store: {await _stringify_process(create_backing_store)}"
            )
        else:
            LOG.info("Creating secure volumpe: made secure volume image")
        await self._load_key()
        await self._loopback_setup()
        await self._map()
        mkfs = await asyncio.create_subprocess_exec(
            "/usr/sbin/mkfs.ext4",
            f"/dev/mapper/{self.SECURE_STORAGE_DEVMAPPER_NAME}",
            stdout=PIPE,
            stderr=PIPE,
        )
        if await subproc_wait_timeout(mkfs) != 0:
            LOG.error(
                f"Creating secure volume: failed to mkfs on the encrypted volume: {await _stringify_process(mkfs)}"
            )
        else:
            LOG.info("Creating secure volume: made fs on encrypted volume")
        LOG.info("Creating secure volume: unmapping device-mapper")
        await self._unmap()
        LOG.info("Creating secure volume: removing loopback")
        await self._loopback_remove()
        LOG.info("Creating secure volume: unloading key")
        await self._unload_key()
        LOG.info("Creating secure volume: done")

    @_lock
    async def mount(self) -> None:
        """Mounts a secure volume by loading a CAAM red key and setting up the dm-crypto table.

        If the volume doesn't exist yet, this will create it.
        """
        await self._do_mount()

    async def _do_mount(self) -> None:
        LOG.info("Mounting secure volume: beginning")
        if await self._must_create():
            LOG.info("Mounting secure volume: creating volume")
            await self._do_create()
        LOG.info("Mounting secure volume: loading key")
        await self._load_key()
        LOG.info("Mounting secure volume: setting up loopback device")
        await self._loopback_setup()
        LOG.info("Mounting secure volume: creating device-map")
        await self._map()
        LOG.info("Mounting secure volume: mounting loopback device")
        await self._mount()
        self._path = self._image_mount_point
        LOG.info("Mounting secure volume: complete")

    @_lock
    async def unmount(self) -> None:
        """Unmounts a currently-mounted secure volume and tears down dm-crypto and key setup (though the keyblob is preserved)."""
        await self._do_unmount()

    async def _do_unmount(self) -> None:
        LOG.info("Unmounting secure volume: beginning")
        self._path = None
        LOG.info("Unmounting secure volume: unmounting loopback device")
        await self._unmount()
        LOG.info("Unmounting secure volume: unmapping disk mapper")
        await self._unmap()
        LOG.info("Unmounting secure volume: removing loopback device")
        await self._loopback_remove()
        LOG.info("Unmounting secure volume: timing out key from KKRS")
        await self._unload_key()
        LOG.info("Unmounting secure volume: complete")

    @_lock
    async def destroy(self) -> None:
        """Destroys a secure volume by removing the CAAM keyblob."""
        LOG.info("Destroying secure volume: beginning")
        await self._do_unmount()
        if self._keyblob().exists():
            LOG.info("Destroying secure volume: removing keyblob")
            self._keyblob().unlink()
        LOG.info("Destroying secure volume: Complete")

    @property
    def path(self) -> Path:
        """Get the path of the mounted secure volume. Raise if not mounted."""
        if not self._path:
            raise RuntimeError("Secure volume has not been mounted")
        return self._path

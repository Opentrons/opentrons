import asyncio
import json
from pathlib import Path
from subprocess import PIPE
from typing import Any
from unittest.mock import MagicMock

import pytest
from decoy import Decoy

from .util import AsyncioCSE, build_subproc_result
from key_server.secure_volume.manager.caam import CAAMSecureVolume


def mock_str(decoy: Decoy, path: Path, res: str, monkeypatch: Any) -> None:
    def __str__(slf: Path) -> str: ...  # type: ignore [empty-body]

    monkeypatch.setattr(path, "__str__", decoy.mock(func=__str__))
    decoy.when(path.__str__()).then_return(res)


def mock_subdir(decoy: Decoy, path: Path, subdir: str) -> Path:
    new_path = build_mock_path(decoy)

    def fake_truediv(slf: Path, other: str) -> Path: ...  # type: ignore[empty-body]

    if isinstance(path.__truediv__, MagicMock):
        path.__truediv__ = decoy.mock(func=fake_truediv)  # type: ignore[method-assign, assignment]
    decoy.when(path.__truediv__(subdir)).then_return(new_path)
    return new_path


def build_mock_path(decoy: Decoy) -> Path:
    mock_path = MagicMock(spec=Path)
    mock_path.exists = decoy.mock(func=mock_path.exists)
    mock_path.is_dir = decoy.mock(func=mock_path.is_dir)
    mock_path.unlink = decoy.mock(func=mock_path.unlink)
    mock_path.read_bytes = decoy.mock(func=mock_path.read_bytes)
    mock_path.is_dir = decoy.mock(func=mock_path.is_dir)
    mock_path.mkdir = decoy.mock(func=mock_path.mkdir)
    mock_path.iterdir = decoy.mock(func=mock_path.iterdir)
    return mock_path


@pytest.fixture
def mock_mount_path(decoy: Decoy, monkeypatch: Any) -> Path:
    mock_mount = build_mock_path(decoy)
    mock_str(decoy, mock_mount, "mock mount path", monkeypatch)
    return mock_mount


@pytest.fixture
def mock_base_directory(decoy: Decoy, monkeypatch: Any) -> Path:
    mock_base = build_mock_path(decoy)
    mock_str(decoy, mock_base, "mock base dir", monkeypatch)
    return mock_base


@pytest.fixture
def mock_keyblob_path(
    decoy: Decoy, mock_base_directory: Path, monkeypatch: Any
) -> Path:
    mkp = mock_subdir(
        decoy, mock_base_directory, f"{CAAMSecureVolume.SECURE_STORAGE_KEY_NAME}.bb"
    )

    mock_str(decoy, mkp, "mock keyblob path", monkeypatch)
    return mkp


@pytest.fixture
def mock_image_path(decoy: Decoy, mock_base_directory: Path, monkeypatch: Any) -> Path:
    mip = mock_subdir(
        decoy, mock_base_directory, CAAMSecureVolume.SECURE_STORAGE_IMAGE_NAME
    )
    mock_str(decoy, mip, "mock image path", monkeypatch)
    return mip


@pytest.fixture
def mock_keyfile(decoy: Decoy, monkeypatch: Any, mock_base_directory: Path) -> Path:
    mock_key = mock_subdir(
        decoy, mock_base_directory, CAAMSecureVolume.SECURE_STORAGE_KEY_NAME
    )
    mock_str(decoy, mock_key, "mock key", monkeypatch)
    return mock_key


@pytest.fixture
async def rehearse_load_key(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_image_path: Path,
    mock_keyfile: Path,
    subject: CAAMSecureVolume,
) -> str:
    """Fixture for importing a key into KKRS. Gives the key ID."""
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/caam-keygen",
            "import",
            "mock keyblob path",
            "ot-secure-storage-key",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    decoy.when(mock_image_path.exists()).then_return(True)
    decoy.when(mock_keyfile.read_bytes()).then_return(b"key data")
    mock_keyring_add = decoy.mock(cls=asyncio.subprocess.Process)
    decoy.when(await mock_keyring_add.wait()).then_return(0)
    mock_keyid = b"1234"
    decoy.when(await mock_keyring_add.communicate(input=b"key data")).then_return(
        (mock_keyid, b"")
    )
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/keyctl",
            "padd",
            "logon",
            f"ot-secure-storage:{id(subject)}",
            "@s",
            stdout=PIPE,
            stderr=PIPE,
            stdin=PIPE,
        )
    ).then_return(mock_keyring_add)
    return mock_keyid.decode()


@pytest.fixture
async def rehearse_losetup(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_image_path: Path,
    subject: CAAMSecureVolume,
) -> None:
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/losetup", "-f", "mock image path", stdout=PIPE, stderr=PIPE
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))


@pytest.fixture
async def rehearse_map(
    decoy: Decoy, mock_asyncio_subprocess: AsyncioCSE, subject: CAAMSecureVolume
) -> None:
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/losetup", "--list", "--json", stdout=PIPE, stderr=PIPE
        )
    ).then_return(
        await build_subproc_result(
            decoy,
            0,
            json.dumps(
                {
                    "loopdevices": [
                        {"back-file": "mock image path", "name": "mock loopback"}
                    ]
                }
            ),
            "",
        )
    )

    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/dmsetup",
            "create",
            "ot-secure-storage",
            "--table",
            f"0 131072 crypt capi:tk(cbc(aes))-plain :56:logon:ot-secure-storage:{id(subject)} 0 mock loopback 0 1 sector_size:512",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))


@pytest.fixture
async def rehearse_unmap(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
) -> None:
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/dmsetup",
            "remove",
            "--force",
            "--retry",
            "ot-secure-storage",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))


@pytest.fixture
async def rehearse_losetup_teardown(
    decoy: Decoy, mock_asyncio_subprocess: AsyncioCSE, mock_image_path: Path
) -> None:
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/losetup", "--list", "--json", stdout=PIPE, stderr=PIPE
        )
    ).then_return(
        await build_subproc_result(
            decoy,
            0,
            json.dumps(
                {
                    "loopdevices": [
                        {"back-file": "mock image path", "name": "mock loopback"}
                    ]
                }
            ),
            "",
        )
    )
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/losetup", "-d", "mock loopback", stdout=PIPE, stderr=PIPE
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))


@pytest.fixture
async def rehearse_remove_key(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_image_path: Path,
    mock_keyfile: Path,
    subject: CAAMSecureVolume,
) -> None:
    """Fixture for removing a key from KKRS. Gives the key ID."""
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/keyctl",
            "timeout",
            "1234",
            "1",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))


@pytest.fixture
async def rehearse_umount(
    decoy: Decoy,
    mock_mount_path: Path,
    mock_asyncio_subprocess: AsyncioCSE,
) -> None:
    """Fixture for removing a mount."""
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/umount", "mock mount path", stdout=PIPE, stderr=PIPE
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))


@pytest.fixture
def subject(
    mock_base_directory: Path,
    mock_mount_path: Path,
) -> CAAMSecureVolume:
    return CAAMSecureVolume(
        image_mount_point=mock_mount_path,
        base_directory=mock_base_directory,
        volume_size_mb=64,
    )


@pytest.mark.parametrize(
    "blob_exists,image_exists,result",
    [
        (True, True, False),
        (True, False, True),
        (False, True, True),
        (False, False, True),
    ],
)
async def test_must_create(
    blob_exists: bool,
    image_exists: bool,
    result: bool,
    mock_keyblob_path: Path,
    mock_image_path: Path,
    decoy: Decoy,
    subject: CAAMSecureVolume,
) -> None:
    """It should check if the image needs creation."""
    decoy.when(mock_keyblob_path.exists()).then_return(blob_exists)
    decoy.when(mock_image_path.exists()).then_return(image_exists)

    assert await subject._must_create() == result


async def test_create_happypath_with_clears(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_base_directory: Path,
    mock_mount_path: Path,
    mock_keyblob_path: Path,
    mock_image_path: Path,
    monkeypatch: Any,
    subject: CAAMSecureVolume,
    rehearse_load_key: str,
    rehearse_losetup: None,
    rehearse_map: None,
    rehearse_unmap: None,
    rehearse_losetup_teardown: None,
    rehearse_remove_key: None,
    mock_keyfile: Path,
) -> None:
    """It should create the image and remove previous keys."""
    decoy.when(mock_keyblob_path.exists()).then_return(True)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/caam-keygen",
            "create",
            CAAMSecureVolume.SECURE_STORAGE_KEY_NAME,
            "ccm",
            "-s",
            "24",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/dd",
            "if=/dev/zero",
            "of=mock image path",
            "bs=1M",
            "count=64",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))

    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/mkfs.ext4",
            "/dev/mapper/ot-secure-storage",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    await subject.create()
    decoy.verify(mock_keyblob_path.unlink())
    decoy.verify(mock_image_path.unlink())
    decoy.verify(mock_keyfile.unlink())


async def test_mount_happypath_when_created(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_base_directory: Path,
    mock_mount_path: Path,
    mock_keyblob_path: Path,
    mock_image_path: Path,
    monkeypatch: Any,
    rehearse_load_key: str,
    rehearse_map: None,
    rehearse_losetup: None,
    subject: CAAMSecureVolume,
) -> None:
    """It should mount the image if it's already created."""
    decoy.when(mock_keyblob_path.exists()).then_return(True)
    decoy.when(mock_image_path.exists()).then_return(True)
    decoy.when(mock_mount_path.is_dir()).then_return(False)
    decoy.when(mock_mount_path.exists()).then_return(False)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/mount",
            "/dev/mapper/ot-secure-storage",
            "mock mount path",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    with pytest.raises(RuntimeError):
        subject.path
    await subject.mount()
    assert subject.path == mock_mount_path
    decoy.verify(mock_mount_path.mkdir())


async def test_mount_creates_if_necessary(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_base_directory: Path,
    mock_mount_path: Path,
    mock_keyblob_path: Path,
    mock_image_path: Path,
    monkeypatch: Any,
    rehearse_load_key: str,
    rehearse_losetup: None,
    rehearse_map: None,
    rehearse_unmap: None,
    rehearse_losetup_teardown: None,
    rehearse_remove_key: None,
    subject: CAAMSecureVolume,
) -> None:
    """It should call create() if necessary."""
    decoy.when(mock_keyblob_path.exists()).then_return(False)
    decoy.when(mock_image_path.exists()).then_return(True)
    decoy.when(mock_keyblob_path.exists()).then_return(False)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/caam-keygen",
            "create",
            CAAMSecureVolume.SECURE_STORAGE_KEY_NAME,
            "ccm",
            "-s",
            "24",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/dd",
            "if=/dev/zero",
            "of=mock image path",
            "bs=1M",
            "count=64",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))

    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/mkfs.ext4",
            "/dev/mapper/ot-secure-storage",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    decoy.when(mock_mount_path.is_dir()).then_return(False)
    decoy.when(mock_mount_path.exists()).then_return(False)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/mount",
            "/dev/mapper/ot-secure-storage",
            "mock mount path",
            stdout=PIPE,
            stderr=PIPE,
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    with pytest.raises(RuntimeError):
        subject.path
    await subject.mount()
    assert subject.path == mock_mount_path
    decoy.verify(mock_mount_path.mkdir())


async def test_unmount_happypath(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_mount_path: Path,
    mock_keyblob_path: Path,
    rehearse_unmap: None,
    rehearse_losetup_teardown: None,
    rehearse_umount: None,
    rehearse_remove_key: None,
    subject: CAAMSecureVolume,
) -> None:
    """It should unmount everything."""
    subject._keyid = 1234
    await subject.unmount()


async def test_destroy(
    decoy: Decoy,
    rehearse_unmap: None,
    rehearse_losetup_teardown: None,
    rehearse_umount: None,
    mock_keyblob_path: Path,
    rehearse_remove_key: None,
    subject: CAAMSecureVolume,
) -> None:
    """It should destroy the keyblob."""
    decoy.when(mock_keyblob_path.exists()).then_return(True)
    subject._keyid = 1234
    await subject.destroy()
    decoy.verify(mock_keyblob_path.unlink())

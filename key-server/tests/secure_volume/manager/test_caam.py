import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest
from decoy import Decoy

from .util import AsyncioCSE, AsyncioSubprocess, build_subproc_result
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


async def test_create_happypath_with_clears(
    decoy: Decoy,
    mock_asyncio_subprocess: AsyncioCSE,
    mock_base_directory: Path,
    mock_mount_path: Path,
    mock_keyblob_path: Path,
    mock_image_path: Path,
    monkeypatch: Any,
) -> None:
    subject = CAAMSecureVolume(
        image_mount_point=mock_mount_path,
        base_directory=mock_base_directory,
        volume_size_mb=64,
    )
    decoy.when(mock_keyblob_path.exists()).then_return(True)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/caam_keygen",
            "create",
            CAAMSecureVolume.SECURE_STORAGE_KEY_NAME,
            "ccm",
            "-s",
            "24",
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/dd", "if=/dev/zero", "of=mock image path", "bs=1M", "count=64"
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    mock_key = mock_subdir(
        decoy, mock_base_directory, CAAMSecureVolume.SECURE_STORAGE_KEY_NAME
    )
    mock_str(decoy, mock_key, "mock key", monkeypatch)
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/caam_keygen",
            "import",
            "mock keyblob path",
            "mock key",
        )
    ).then_return(await build_subproc_result(decoy, 0, "ok", "ok"))
    decoy.when(mock_image_path.exists()).then_return(True)
    decoy.when(mock_key.read_bytes()).then_return(b"key data")
    mock_keyring_add = decoy.mock(cls=AsyncioSubprocess)
    decoy.when(await mock_keyring_add.wait()).then_return(0)
    decoy.when(await mock_keyring_add.communicate(input=b"key data")).then_return(
        ("1234", "")
    )
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/keyctl", "padd", "logon", f"ot-secure-storage:{id(subject)}", "@p"
        )
    ).then_return(mock_keyring_add)
    decoy.when(
        await mock_asyncio_subprocess("/usr/sbin/losetup", "-f", "mock image path")
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    decoy.when(
        await mock_asyncio_subprocess("/usr/sbin/losetup", "--list", "--json")
    ).then_return(
        await build_subproc_result(
            decoy,
            0,
            json.dumps(
                {
                    "loopdevices": [
                        {"backfile": "mock image path", "name": "mock loopback"}
                    ]
                }
            ),
            "",
        )
    )
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/bin/dmsetup",
            "create",
            "ot-secure-storage",
            "--table",
            f"0 131072 crypt capi:tk(cbc(aes))-plain :36:logon:ot-secure-storage:{id(subject)} 0 mock loopback 0 1 sector_size:512",
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    decoy.when(
        await mock_asyncio_subprocess(
            "/usr/sbin/mkfs.ext4", "/dev/mapper/ot-secure-storage"
        )
    ).then_return(await build_subproc_result(decoy, 0, "", ""))
    await subject.create()
    decoy.verify(mock_keyblob_path.unlink())
    decoy.verify(mock_image_path.unlink())
    decoy.verify(mock_key.unlink())

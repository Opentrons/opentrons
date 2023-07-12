import lzma
import os
import subprocess
import re
import zipfile
from typing import Tuple
from unittest import mock
from unittest.mock import MagicMock

import pytest

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as HTTPTestClient

from otupdate import buildroot, common

from otupdate import openembedded
from otupdate.common.update_actions import Partition
from otupdate.openembedded import PartitionManager
from tests.common.config import FakeRootPartElem

HERE = os.path.abspath(os.path.dirname(__file__))
one_up = os.path.abspath(os.path.join(__file__, "../../"))


@pytest.fixture(params=[openembedded, buildroot])
async def test_cli(
    aiohttp_client, otupdate_config, request, version_file_path, mock_name_synchronizer
) -> Tuple[HTTPTestClient, str]:
    """
    Build an app using dummy versions, then build a test client and return it
    """
    cli_client_pkg = request.param
    app = await cli_client_pkg.get_app(
        name_synchronizer=mock_name_synchronizer,
        system_version_file=version_file_path,
        config_file_override=otupdate_config,
        boot_id_override="dummy-boot-id-abc123",
    )
    client = await aiohttp_client(app)
    return client, cli_client_pkg.__name__


@pytest.fixture
def downloaded_update_file_consolidated(request, extracted_update_file_consolidated):
    """
    Return the path to a zipped update file

    To exclude files, mark with ``exclude_rootfs_ext4``,
    ``exclude_rootfs_ext4_hash``, ``exclude_rootfs_ext4_hash_sig``.

    This uses :py:meth:`extracted_update_file` to generate the contents, so
    marks that fixture understands can be used when requesting this fixture

    Can also be used by tests that will upload it to a test server, since
    when the test server boots its download path will be somewhere else
    """
    zip_path_arr = []
    list_of_update_files = [
        (
            "systemfs.xz",
            "systemfs.xz.sha256",
            "systemfs.xz.hash.sig",
            "tmp_uncomp_xz_hash_path",
            "system-update.zip",
            "VERSION.json",
        ),
        (
            "rootfs.ext4",
            "rootfs.ext4.hash",
            "rootfs.ext4.hash.sig",
            "tmp_uncomp_xz_hash_path",
            "ot2-system.zip",
            "VERSION.json",
        ),
    ]
    for index, (rootfs, sha256, sig, xz_hash, pkg, version) in enumerate(
        list_of_update_files
    ):
        rootfs_path = os.path.join(extracted_update_file_consolidated[index], rootfs)
        hash_path = os.path.join(extracted_update_file_consolidated[index], sha256)
        sig_path = os.path.join(extracted_update_file_consolidated[index], sig)
        xz_hash_path = os.path.join(extracted_update_file_consolidated[index], xz_hash)
        zip_path = os.path.join(extracted_update_file_consolidated[index], pkg)
        with zipfile.ZipFile(zip_path, "w") as zf:
            if not request.node.get_closest_marker("exclude_rootfs_ext4"):
                zf.write(rootfs_path, rootfs)
            if not request.node.get_closest_marker("exclude_rootfs_ext4_hash"):
                zf.write(hash_path, sha256)
            if not request.node.get_closest_marker("exclude_rootfs_ext4_hash_sig"):
                zf.write(sig_path, sig)
            zf.write(xz_hash_path, xz_hash)
            zip_path_arr.append(zip_path)
        os.unlink(rootfs_path)
        os.unlink(hash_path)
        os.unlink(sig_path)

    return zip_path_arr


def write_fake_rootfs(
    rootfs_name: str, rootfs_path: str, rootfs_contents: bytes, uncomp_xz_path: str
) -> str:
    if rootfs_name == "rootfs.xz":
        with lzma.open(rootfs_path, "w") as f:
            f.write(rootfs_contents)
        with lzma.open(rootfs_path, "rb") as fsrc, open(uncomp_xz_path, "wb") as fdst:
            while True:
                chunk = fsrc.read(1024)
                fdst.write(chunk)
                if len(chunk) != 1024:
                    break
        return uncomp_xz_path
    else:
        with open(rootfs_path, "wb") as rfs:
            rfs.write(rootfs_contents)
            return rootfs_path


def gen_hash_val_direct(rfs_path: str) -> str:
    try:
        shasum_out = subprocess.check_output(
            [
                "shasum",
                "-a",
                "256",
                rfs_path,
            ]
        )
        return shasum_out
    except (subprocess.CalledProcessError, FileNotFoundError):
        pytest.skip("no shasum invokeable on command line")


@pytest.fixture
def extracted_update_file_consolidated(request, tmpdir):
    """
    Return the path to a dir containing an unzipped update file.

    To make a bad hash, mark with ``bad_hash``. To make a bad
    signature, mark with ``bad_sig``.
    """
    extracted_files_dir_path_arr = []
    list_of_extracted_files = [
        (
            "systemfs.xz",
            "systemfs.xz.sha256",
            "systemfs.xz.hash.sig",
        ),
        (
            "rootfs.ext4",
            "rootfs.ext4.hash",
            "rootfs.ext4.hash.sig",
        ),
    ]

    for (rootfs, sha256, sig) in list_of_extracted_files:
        rootfs_path = os.path.join(tmpdir, rootfs)
        hash_path = os.path.join(tmpdir, sha256)
        uncomp_xz_hash_path = os.path.join(tmpdir, "tmp_uncomp_xz_hash_path")
        sig_path = os.path.join(tmpdir, sig)
        uncomp_xz_path = os.path.join(tmpdir, "tmp_uncomp")
        rootfs_contents = os.urandom(100000)
        write_fake_rootfs(rootfs, rootfs_path, rootfs_contents, uncomp_xz_path)
        if request.node.get_closest_marker("bad_hash"):
            hashval = b"0oas0ajcs0asd0asjc0ans0d9ajsd0ian0s9djas"
        else:

            hashval = re.match(
                b"^([a-z0-9]+) ",
                gen_hash_val_direct(rootfs_path),
            ).group(1)
            hashval2 = re.match(
                b"^([a-z0-9]+) ",
                gen_hash_val_direct(uncomp_xz_path),
            ).group(1)
        with open(hash_path, "wb") as rfsh:
            rfsh.write(hashval)
        with open(uncomp_xz_hash_path, "wb") as rfsh:
            rfsh.write(hashval2)
        if not request.node.get_closest_marker("bad_sig"):
            try:
                subprocess.check_output(["openssl", "version"])
            except (subprocess.CalledProcessError, FileNotFoundError):
                pytest.skip("requires openssl binary to be installed")
            subprocess.check_call(
                [
                    "openssl",
                    "dgst",
                    "-sha256",
                    "-sign",
                    os.path.join(one_up, "ot-update-server-unit-tests.key"),
                    "-out",
                    sig_path,
                    hash_path,
                ]
            )
        else:
            with open(sig_path, "wb") as sigfile:
                sigfile.write(os.urandom(256))
        extracted_files_dir_path_arr.append(tmpdir)
    return extracted_files_dir_path_arr


@pytest.fixture
def testing_partition(monkeypatch, tmpdir):
    partfile = os.path.join(tmpdir, "fake-partition")
    find_unused = mock.Mock()
    monkeypatch.setattr(common.update_actions, "_find_unused_partition", find_unused)

    find_unused.return_value = FakeRootPartElem(
        "TWO", common.update_actions.Partition(2, partfile)
    )
    return partfile


@pytest.fixture
def mock_partition_manager_valid_switch(tmpdir) -> MagicMock:
    """Mock Partition Manager."""
    partfile = os.path.join(tmpdir, "fake-partition")
    mock_part = MagicMock(spec=PartitionManager)
    mock_part.find_unused_partition.return_value = Partition(2, partfile)
    mock_part.switch_partition.return_value = Partition(2, partfile)
    mock_part.resize_partition.return_value = True
    mock_part.mount_fs.return_value = True
    mock_part.umount_fs.return_value = True

    mock_part.mountpoint_root.return_value = "/mnt"

    return mock_part

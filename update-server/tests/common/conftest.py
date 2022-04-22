import os
import subprocess
import re

import pytest

from otupdate import buildroot

from otupdate import openembedded

HERE = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture(params=[openembedded, buildroot])
async def test_cli(aiohttp_client, loop, otupdate_config, request):
    """
    Build an app using dummy versions, then build a test client and return it
    """
    cli_client_pkg = request.param
    app = cli_client_pkg.get_app(
        system_version_file=os.path.join(HERE, "version.json"),
        config_file_override=otupdate_config,
        name_override="opentrons-test",
        boot_id_override="dummy-boot-id-abc123",
        loop=loop,
    )
    client = await loop.create_task(aiohttp_client(app))
    return client


br_files = dict(
    [
        ("ROOTFS", "rootfs.ext4"),
        ("ROOTFS_HASH", "rootfs.ext4.hash"),
        ("ROOTFS_SIG", "rootfs.ext4.hash.sig"),
    ]
)
oe_files = dict(
    [
        ("ROOTFS", "rootfs.ext4"),
        ("ROOTFS_HASH", "rootfs.ext4.hash"),
        ("ROOTFS_SIG", "rootfs.ext4.hash.sig"),
    ]
)


@pytest.fixture(params=[br_files, oe_files])
def extracted_update_file(request, tmpdir):
    """
    Return the path to a dir containing an unzipped update file.

    To make a bad hash, mark with ``bad_hash``. To make a bad
    signature, mark with ``bad_sig``.
    """
    files = request.param
    rootfs_path = os.path.join(tmpdir, files["ROOTFS"])
    hash_path = os.path.join(tmpdir, files["ROOTFS_HASH"])
    sig_path = os.path.join(tmpdir, files["ROOTFS_SIG"])
    rootfs_contents = os.urandom(100000)
    with open(rootfs_path, "wb") as rfs:
        rfs.write(rootfs_contents)
    if request.node.get_closest_marker("bad_hash"):
        hashval = b"0oas0ajcs0asd0asjc0ans0d9ajsd0ian0s9djas"
    else:
        try:
            shasum_out = subprocess.check_output(["shasum", "-a", "256", rootfs_path])
        except (subprocess.CalledProcessError, FileNotFoundError):
            pytest.skip("no shasum invokeable on command line")
        hashval = re.match(b"^([a-z0-9]+) ", shasum_out).group(1)
    with open(hash_path, "wb") as rfsh:
        rfsh.write(hashval)
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
                os.path.join(HERE, "ot-update-server-unit-tests.key"),
                "-out",
                sig_path,
                hash_path,
            ]
        )
    else:
        with open(sig_path, "wb") as sigfile:
            sigfile.write(os.urandom(256))
    return tmpdir

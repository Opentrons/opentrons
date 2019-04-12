import os

import pytest
import random
import re
import shutil
import subprocess
import zipfile


HERE = os.path.dirname(__file__)


@pytest.fixture
def unused_sysroot(tmpdir):
    sr = os.path.join(tmpdir, 'dummy-sysroot')
    os.makedirs(sr, exist_ok=True)
    return sr


@pytest.fixture
def state_partition(tmpdir):
    state = os.path.join(tmpdir, 'state-partition')
    connection_dir = os.path.join(
        state, 'root-overlay', 'etc', 'NetworkManager', 'system-connections')
    os.makedirs(connection_dir, exist_ok=True)
    shutil.copy2(os.path.join(HERE, 'linksys-open'), connection_dir)
    shutil.copy2(os.path.join(HERE, 'Opentrons'), connection_dir)
    return state


@pytest.fixture
def boot_partition(tmpdir):
    boot = os.path.join(tmpdir, 'boot-partition')
    connection_dir = os.path.join(boot, 'system-connections')
    os.makedirs(connection_dir, exist_ok=True)
    shutil.copy2(os.path.join(HERE, 'resin-wifi-01'), connection_dir)
    return boot


@pytest.fixture
def data_partition(tmpdir, resin_data_dir):
    """ Create a folder that acts like mounting /dev/mmcblk0p6.

    Implicitly uses :py:meth:`balena_data_dir` and symlinks it, pretending to
    be a bind mount, in the correct subdir
    """
    resin_id = int(random.random() * 10000000.0)
    data = os.path.join(tmpdir, 'data-partition')
    resin_data = os.path.join(data, 'resin-data')
    os.makedirs(resin_data, exist_ok=True)
    os.symlink(resin_data_dir, os.path.join(resin_data, str(resin_id)),
               target_is_directory=True)
    return data


@pytest.fixture
def resin_data_dir(tmpdir):
    """ Create a directory with correct filetree to be the equivalent of
    /data in a running container.
    """
    data = os.path.join(tmpdir, 'data')
    os.makedirs(data, exist_ok=True)
    open(os.path.join(data, 'fingerprint'), 'w').write(
        "this better be moved")
    nested = os.path.join(data, 'user_storage', 'opentrons_data')
    os.makedirs(nested, exist_ok=True)
    open(os.path.join(nested, 'fingerprint2'), 'w').write('this too')
    return data


@pytest.fixture
def state_system_connections(state_partition):
    """ The path to the system connections in the state partition """
    return os.path.join(state_partition,
                        'root-overlay',
                        'etc', 'NetworkManager', 'system-connections')


@pytest.fixture
def boot_system_connections(boot_partition):
    """ The path to the system connections in the boot partition"""
    return os.path.join(boot_partition, 'system-connections')


@pytest.fixture
def downloaded_update_file(request, extracted_update_file):
    """
    Return the path to a zipped update file.

    To exclude files mark with ``exclude_rootfs_ext4``,
    ``exclude_rootfs_ext4_hash``, ``exclude_boot_vfat``,
    ``exclude_boot_vfat_hash``
    """
    rootfs_path = os.path.join(extracted_update_file, 'rootfs.ext4')
    rootfs_hash_path = os.path.join(extracted_update_file, 'rootfs.ext4.hash')
    bootfs_path = os.path.join(extracted_update_file, 'boot.vfat')
    bootfs_hash_path = os.path.join(extracted_update_file, 'boot.vfat.hash')
    zip_path = os.path.join(extracted_update_file, 'ot2-migration.zip')
    with zipfile.ZipFile(zip_path, 'w') as zf:
        for marker, filepath in [('exclude_rootfs_ext4', rootfs_path),
                                 ('exclude_rootfs_ext4_hash',
                                  rootfs_hash_path),
                                 ('exclude_boot_vfat', bootfs_path),
                                 ('exclude_boot_vfat_hash', bootfs_hash_path)]:
            if not request.node.get_marker(marker):
                zf.write(filepath, os.path.basename(filepath))
    return zip_path


@pytest.fixture
def boot_dev(tmpdir):
    path = os.path.join(tmpdir, 'boot-device')
    return path


@pytest.fixture
def extracted_update_file(request, resin_data_dir):
    """
    Return the path to a directory containing a full unzipped update file.

    This path will actually be the equivalent of /data/update-storage, inside
    the :py:meth:`resin_data_dir` fixture.

    To make a bad rootfs hash, mark with ``bad_rootfs_ext4_hash``. To make a
    bad boot hash, mark with ``bad_boot_vfat_hash``.
    """
    dl_dir = os.path.join(resin_data_dir, 'update-storage')
    rootfs_path = os.path.join(dl_dir, 'rootfs.ext4')
    rootfs_hash_path = os.path.join(dl_dir, 'rootfs.ext4.hash')
    bootfs_path = os.path.join(dl_dir, 'boot.vfat')
    bootfs_hash_path = os.path.join(dl_dir, 'boot.vfat.hash')
    os.makedirs(dl_dir, exist_ok=True)
    for fi in (rootfs_path, bootfs_path):
        with open(fi, 'wb') as rfs:
            rfs.write(os.urandom(100000))

    for fs_path, hash_path, marker in [
            (rootfs_path, rootfs_hash_path, 'bad_rootfs_ext4_hash'),
            (bootfs_path, bootfs_hash_path, 'bad_boot_vfat_hash')]:
        if request.node.get_marker(marker):
            hashval = b'1092uf0ja0fjas0do0sfihoahf0a9'
        else:
            try:
                shasum_out = subprocess.check_output(
                    ['shasum', '-a', '256', fs_path])
            except (subprocess.CalledProcessError, FileNotFoundError):
                pytest.skip("requires openssl binary to be installed")
            hashval = re.match(b'^([a-z0-9]+) ', shasum_out).group(1)
        with open(hash_path, 'wb') as hash_file:
            hash_file.write(hashval)

    return dl_dir

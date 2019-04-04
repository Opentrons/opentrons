import contextlib
import logging
import os
import re
import shutil
import subprocess
from typing import Callable, Sequence, Tuple


from otupdate.buildroot.file_actions import (unzip_update,
                                             hash_file,
                                             ROOTFS_NAME,
                                             ROOTFS_HASH_NAME,
                                             HashMismatch)
from .constants import DATA_DIR_NAME

BOOT_NAME = 'boot.vfat'
BOOT_HASH_NAME = 'boot.vfat.hash'

UPDATE_FILES = [BOOT_NAME, BOOT_HASH_NAME, ROOTFS_NAME, ROOTFS_HASH_NAME]

LOG = logging.getLogger(__name__)


def validate_update(
        filepath: str,
        progress_callback: Callable[[float], None]) -> Tuple[str, str]:
    """ Like otupdate.buildroot.file_actions.validate_update but moreso

    Checks for the rootfs, rootfs hash, bootfs, and bootfs hash.

    Returns the path to the rootfs and the path to the bootfs
    """
    filenames = [ROOTFS_NAME, ROOTFS_HASH_NAME, BOOT_NAME, BOOT_HASH_NAME]

    def zip_callback(progress):
        progress_callback(progress/3.0)

    files, sizes = unzip_update(filepath, zip_callback, filenames, filenames)

    def rootfs_hash_callback(progress):
        progress_callback(progress/3.0 + 0.33)

    rootfs = files.get(ROOTFS_NAME)
    assert rootfs
    rootfs_calc_hash = hash_file(rootfs, rootfs_hash_callback,
                                 file_size=sizes[ROOTFS_NAME])
    rootfs_hashfile = files.get(ROOTFS_HASH_NAME)
    assert rootfs_hashfile
    rootfs_packaged_hash = open(rootfs_hashfile, 'rb').read().strip()
    if rootfs_calc_hash != rootfs_packaged_hash:
        msg = f"Hash mismatch (rootfs): calculated {rootfs_calc_hash} != "\
            f"packaged {rootfs_packaged_hash}"
        LOG.error(msg)
        raise HashMismatch(msg)

    def bootfs_hash_callback(progress):
        progress_callback(progress/3.0 + 0.66)

    bootfs = files.get(BOOT_NAME)
    assert bootfs
    bootfs_calc_hash = hash_file(bootfs, bootfs_hash_callback,
                                 file_size=sizes[BOOT_NAME])
    bootfs_hashfile = files.get(BOOT_HASH_NAME)
    assert bootfs_hashfile
    bootfs_packaged_hash = open(bootfs_hashfile, 'rb').read().strip()
    if bootfs_calc_hash != bootfs_packaged_hash:
        msg = f"Hash mismatch (bootfs): calculated {bootfs_calc_hash} != "\
            f"packged {bootfs_packaged_hash}"
        LOG.error(msg)
        raise HashMismatch(msg)

    return rootfs, bootfs


def _get_proc_cmdline() -> bytes:
    """ Load /proc/cmdline """
    return open('/proc/cmdline', 'rb').read()


def find_active_sysroot() -> str:
    """ Parse /proc/cmdline to find the active sysroot. Return the path """
    cmdline = _get_proc_cmdline()
    match = re.search(b'root=([/a-zA-Z0-9.]+)', cmdline)
    if not match:
        raise RuntimeError(f"Couldn't find bootpart from {cmdline}")
    return match.group(1).decode()


def find_inactive_sysroot() -> str:
    """ Parse /proc/cmdline to find the inactive sysroot. Return the path """
    active = find_active_sysroot()
    return {'/dev/mmcblk0p3': '/dev/mmcblk0p2',
            '/dev/mmcblk0p2': '/dev/mmcblk0p3'}[active]


def patch_connection_file_paths(connection: str) -> str:
    """
    Patch any paths in a connection to remove the balena host paths

    Undoes the changes applied by
    :py:meth:`opentrons.system.nmcli._rewrite_key_path_to_host_path`

    :param connection: The contents of a NetworkManager connection file
    :return: The patches contents, suitable for writing somewher
    """
    new_conn_lines = []
    for line in connection.split('\n'):
        if '=' in line:
            parts = line.split('=')
            path_matches = re.search(
                '/mnt/data/resin-data/[0-9]+/(.*)', parts[1])
            if path_matches:
                new_path = f'/data/{path_matches.group(1)}'
                new_conn_lines.append(
                    '='.join([parts[0], new_path]))
                LOG.info(
                    f"migrate_connection_file: {parts[0]}: "
                    f"{parts[1]}->{new_path}")
                continue
        new_conn_lines.append(line)
    return '\n'.join(new_conn_lines)


@contextlib.contextmanager
def mount_state_partition():
    """ Mount the active sysroot partition somewhere and yield it """
    with mount_partition('/dev/mmcblk0p5', '/mnt/resin-state') as mountpath:
        yield mountpath


@contextlib.contextmanager
def mount_boot_partition():
    """ Mount the balena boot partition somewhere and yield it """
    with mount_partition('/dev/mmcblk0p1', '/mnt/boot') as mountpath:
        yield mountpath


@contextlib.contextmanager
def mount_data_partition():
    """ Mount the balena data partition somewhere and yield it """
    with mount_partition('/dev/mmcblk0p6', '/mnt/data') as mountpath:
        yield mountpath


@contextlib.contextmanager
def mount_partition(partition: str, mountpath: str):
    os.makedirs(mountpath, exist_ok=True)
    subprocess.check_call(['mount', partition, mountpath])
    try:
        yield mountpath
    finally:
        subprocess.check_call(['umount', mountpath])


def migrate(ignore: Sequence[str], name: str):
    """ Copy everything in the app data to the root of the new partition

    :param ignore: Files to ignore in the root. This should be populated
                   with the names (with no directory elements) of the migration
                   update zipfile and everything unzipped from it.
    :param str: The name of the robot
    """
    try:
        with mount_data_partition() as datamount:
            migrate_data(ignore, datamount, DATA_DIR_NAME)
            migrate_connections(datamount)
            migrate_hostname(datamount, name)
    except Exception:
        LOG.exception("Exception during data migration")
        raise


def migrate_files_to_ignore(src, names):
    if src.endswith('jupyter') and 'jupyter' in names:
        return ['jupyter']

    return []


def migrate_data(ignore: Sequence[str],
                 new_data_path: str,
                 old_data_path: str):
    """ Copy everything in the app data to the root of the main data part

    :param ignore: A list of files that should be ignored in the root of /data
    :param new_data_path: Where the new data partition is mounted
    :param old_data_path: Where the old date files are
    """
    # the new ’data’ path is actually /var and /data is in /var/data
    dest_data = os.path.join(new_data_path, 'data')
    LOG.info(f"migrate_data: copying {old_data_path} to {dest_data}")
    os.makedirs(dest_data, exist_ok=True)
    with os.scandir(old_data_path) as scanner:
        for entry in scanner:
            if entry.name in ignore:
                LOG.info(f"migrate_data: ignoring {entry.name}")
                continue
            src = os.path.join(old_data_path, entry.name)
            dest = os.path.join(dest_data, entry.name)
            if os.path.exists(dest):
                LOG.info(f"migrate_data: removing dest tree {dest}")
                shutil.rmtree(dest, ignore_errors=True)
            if entry.is_dir():
                LOG.info(f"migrate_data: copying tree {src}->{dest}")
                shutil.copytree(src, dest, symlinks=True,
                                ignore=migrate_files_to_ignore)
            else:
                LOG.info(f"migrate_data: copying file {src}->{dest}")
                shutil.copy2(src, dest)


def migrate_system_connections(src_sc: str, dest_sc: str) -> bool:
    """ Migrate the contents of a system-connections dir

    :param dest_sc: The system-connections to copy to. Will be created if it
                    does not exist
    :param src_sc: The system-connections to copy from
    :return: True if anything was moved
    """
    found = False
    LOG.info(f"migrate_system_connections: checking {dest_sc}")
    os.makedirs(dest_sc, exist_ok=True)
    with os.scandir(src_sc) as scanner:
        for entry in scanner:
            # ignore readme and sample
            if entry.name.endswith('.ignore'):
                continue
            # ignore the hardwired connection added by api server
            if entry.name == 'static-eth0':
                continue
            # ignore weird remnants of boot partition connections
            if entry.name.startswith('._'):
                continue
            patched = patch_connection_file_paths(
                open(os.path.join(src_sc, entry.name), 'r').read())
            open(os.path.join(dest_sc, entry.name), 'w').write(patched)
            LOG.info(f"migrate_connections: migrated {entry.name}")
            found = True
    return found


def migrate_connections(new_data_path: str):
    """ Migrate wifi connection files to new locations and patch them

    :param new_data_path: The path to where the new data partition is mounted
    """
    dest_connections = os.path.join(
        new_data_path, 'lib', 'NetworkManager', 'system-connections')
    os.makedirs(dest_connections, exist_ok=True)

    with mount_state_partition() as state_path:
        src_connections = os.path.join(
            state_path, 'root-overlay', 'etc', 'NetworkManager',
            'system-connections')
        LOG.info(f"migrate_connections: moving nmcli connections from"
                 f" {src_connections} to {dest_connections}")
        found = migrate_system_connections(src_connections, dest_connections)

    if found:
        return

    LOG.info(
        "migrate_connections: No connections found in state, checking boot")

    with mount_boot_partition() as boot_path:
        src_connections = os.path.join(
            boot_path, 'system-connections')
        LOG.info(f"migrate_connections: moving nmcli connections from"
                 f" {src_connections} to {dest_connections}")
        found = migrate_system_connections(src_connections, dest_connections)
        if not found:
            LOG.info("migrate_connections: No connections found in boot")


def migrate_hostname(dest_data: str, name: str):
    """ Write the machine name to a couple different places

    :param dest_data: The path to the root of ``/var`` in buildroot
    :param name: The name

    The hostname gets written to:
    - dest_path/hostname (bind mounted to /etc/hostname)
    (https://www.freedesktop.org/software/systemd/man/hostname.html#)
    - dest_path/machine-info as the PRETTY_HOSTNAME (bind mounted to
      /etc/machine-info)
    (https://www.freedesktop.org/software/systemd/man/machine-info.html#)
    - dest_path/serial since we assume the resin name is the serial number

    We also create some basic defaults for the machine-info.
    """
    if name.startswith('opentrons-'):
        name = name[len('opentrons-'):]
    LOG.info(
        f"migrate_hostname: writing name {name} to {dest_data}/hostname,"
        f" {dest_data}/machine-info, {dest_data}/serial")
    with open(os.path.join(dest_data, 'hostname'), 'w') as hn:
        hn.write(name + "\n")
    with open(os.path.join(dest_data, 'machine-info'), 'w') as mi:
        mi.write(f'PRETTY_HOSTNAME={name}\nDEPLOYMENT=production\n')
    with open(os.path.join(dest_data, 'serial'), 'w') as ser:
        ser.write(name)


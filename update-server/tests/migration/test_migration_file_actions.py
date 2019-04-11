""" test the update primitives in otupdate.migration.file_actions """

import contextlib
import os
from unittest import mock
import zipfile

import pytest

from otupdate.migration import file_actions
from otupdate.buildroot.file_actions import FileMissing, HashMismatch

HERE = os.path.dirname(__file__)


def test_validate_update_happypath(downloaded_update_file):
    cb = mock.Mock()
    rootfs, bootfs = file_actions.validate_update(downloaded_update_file, cb)
    assert cb.called
    unzipped_rootfs = os.path.join(
        os.path.dirname(downloaded_update_file), 'rootfs.ext4')
    unzipped_bootfs = os.path.join(
        os.path.dirname(downloaded_update_file), 'boot.vfat')
    assert rootfs == unzipped_rootfs
    assert bootfs == unzipped_bootfs
    with zipfile.ZipFile(downloaded_update_file, 'r') as zf:
        assert open(unzipped_bootfs, 'rb').read()\
            == zf.open('boot.vfat', 'r').read()
        assert open(unzipped_rootfs, 'rb').read()\
            == zf.open('rootfs.ext4', 'r').read()


@pytest.mark.exclude_rootfs_ext4
def test_validate_update_catches_missing_rootfs(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(FileMissing):
        file_actions.validate_update(downloaded_update_file, cb)


@pytest.mark.exclude_boot_vfat
def test_validate_update_catches_missing_bootfs(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(FileMissing):
        file_actions.validate_update(downloaded_update_file, cb)


@pytest.mark.exclude_rootfs_ext4_hash
def test_validate_update_catches_missing_rootfs_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(FileMissing):
        file_actions.validate_update(downloaded_update_file, cb)


@pytest.mark.exclude_boot_vfat_hash
def test_validate_update_catches_missing_boot_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(FileMissing):
        file_actions.validate_update(downloaded_update_file, cb)


@pytest.mark.bad_boot_vfat_hash
def test_validate_update_catches_bad_boot_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(HashMismatch):
        file_actions.validate_update(downloaded_update_file, cb)


@pytest.mark.bad_rootfs_ext4_hash
def test_validate_update_catches_bad_root_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(HashMismatch):
        file_actions.validate_update(downloaded_update_file, cb)


def test_patch_connection_file_paths():
    with_paths = open(os.path.join(HERE, 'linksys-open'), 'r').read()
    without_paths = file_actions.patch_connection_file_paths(with_paths)
    found_privkey = False
    found_clientcert = False
    for oldline, newline in zip(with_paths.split('\n'),
                                without_paths.split('\n')):
        # We should patch the lines that have keyfile paths
        if '=' in newline and newline.split('=')[0] == 'private-key':
            assert newline == 'private-key=/data/user_storage/opentrons_data'\
                '/network_keys/'\
                '67fbc58f09f2df3ad919710aab108baa53f915c3de540352bb2309f'\
                '872566ab6/client.key'
            found_privkey = True
        elif '=' in newline and newline.split('=')[0] == 'client-cert':
            assert newline == 'client-cert=/data/user_storage/opentrons_data/'\
                'network_keys/3d122be0492522b63c4bb52d4c90836ff3ffe4fe8d0e'\
                '4de69211fa4f9a574eea/client.crt'
            found_clientcert = True
        else:
            # We should leave lines without keyfile paths untouched
            assert newline == oldline

    assert found_privkey and found_clientcert

    # If files have no keyfile paths they should be untouched
    no_paths_old = open(os.path.join(HERE, 'Opentrons'), 'r').read()
    no_paths_new = file_actions.patch_connection_file_paths(no_paths_old)
    assert no_paths_old == no_paths_new


def test_migrate_system_connections(state_system_connections, data_partition):
    dest_system_connections = os.path.join(data_partition,
                                           'lib', 'NetworkManager',
                                           'system-connections')
    ret = file_actions.migrate_system_connections(
        state_system_connections,
        dest_system_connections)
    assert ret
    # The Opentrons connection should have been copied
    assert open(
        os.path.join(dest_system_connections, 'Opentrons'), 'r').read()\
        == open(
            os.path.join(state_system_connections, 'Opentrons'), 'r').read()
    # The linksys-open connection should hav ebeen patched
    patched = file_actions.patch_connection_file_paths(
        open(os.path.join(
            state_system_connections, 'linksys-open'), 'r').read())
    assert patched == open(os.path.join(
        dest_system_connections, 'linksys-open'), 'r').read()


def test_migrate_connections_state(state_partition, tmpdir, monkeypatch):
    @contextlib.contextmanager
    def patched_mount_state():
        yield state_partition

    @contextlib.contextmanager
    def dummy_mount_boot():
        assert False, 'shouldnt try and mount boot'
        yield

    monkeypatch.setattr(file_actions, 'mount_state_partition',
                        patched_mount_state)
    monkeypatch.setattr(file_actions, 'mount_boot_partition',
                        dummy_mount_boot)
    dest = os.path.join(tmpdir, 'checkitout')
    file_actions.migrate_connections(dest)
    # if these files exist, test_migrate_system_connections means they should
    # be correct
    assert sorted(os.listdir(os.path.join(
        dest, 'lib', 'NetworkManager', 'system-connections')))\
        == sorted(['Opentrons', 'linksys-open'])


def test_migrate_connections_boot(boot_partition, tmpdir, monkeypatch):

    dummy_state = os.path.join(tmpdir, 'nothing-here')
    dummy_sc = os.path.join(dummy_state, 'root-overlay',
                            'etc', 'NetworkManager', 'system-connections')
    os.makedirs(dummy_sc)
    dest = os.path.join(tmpdir, 'move-to-here')

    @contextlib.contextmanager
    def patched_mount_boot():
        yield boot_partition

    @contextlib.contextmanager
    def dummy_mount_state():
        yield dummy_state

    monkeypatch.setattr(file_actions, 'mount_state_partition',
                        dummy_mount_state)
    monkeypatch.setattr(file_actions, 'mount_boot_partition',
                        patched_mount_boot)

    file_actions.migrate_connections(dest)
    assert os.listdir(os.path.join(
        dest, 'lib', 'NetworkManager', 'system-connections'))\
        == ['resin-wifi-01']


def test_migrate_data(resin_data_dir, data_partition):
    with open(os.path.join(resin_data_dir, 'DO-NOT-MOVE'), 'w') as dnm:
        dnm.write("dont you dare")
    dest = os.path.join(data_partition, 'data')
    file_actions.migrate_data(['DO-NOT-MOVE'],
                              data_partition,
                              resin_data_dir)
    assert not os.path.exists(os.path.join(dest, 'DO-NOT-MOVE'))
    for filepath, contents in [(os.path.join(dest, 'fingerprint'),
                                'this better be moved'),
                               (os.path.join(dest, 'user_storage',
                                             'opentrons_data', 'fingerprint2'),
                                'this too')]:
        assert open(filepath, 'r').read() == contents


def test_migrate_hostname(data_partition):
    robot_name = 'this-is-my-robot'
    file_actions.migrate_hostname(data_partition, robot_name)
    assert open(os.path.join(data_partition, 'hostname')).read()\
        == f'{robot_name}\n'
    assert open(os.path.join(data_partition, 'machine-info')).read()\
        == f'PRETTY_HOSTNAME={robot_name}\nDEPLOYMENT=production\n'


def test_sysroot_functions(monkeypatch):
    proc_cmdline_p2 = b'8250.nr_uarts=1 bcm2708_fb.fbwidth=656 bcm2708_fb.fbheight=416 bcm2708_fb.fbdepth=16 bcm2708_fb.fbswap=1 vc_mem.mem_base=0x3f000000 vc_mem.mem_size=0x3f600000  dwc_otg.lpm_enable=0 console=null root=/dev/mmcblk0p2 rootfstype=ext4 rootwait vt.global_cursor_default=0\n'  # noqa(E501)
    proc_cmdline_p3 = b'8250.nr_uarts=1 bcm2708_fb.fbwidth=656 bcm2708_fb.fbheight=416 bcm2708_fb.fbdepth=16 bcm2708_fb.fbswap=1 vc_mem.mem_base=0x3f000000 vc_mem.mem_size=0x3f600000  dwc_otg.lpm_enable=0 console=null root=/dev/mmcblk0p3 rootfstype=ext4 rootwait vt.global_cursor_default=0\n'  # noqa(E501)
    monkeypatch.setattr(file_actions, '_get_proc_cmdline',
                        lambda: proc_cmdline_p2)
    assert file_actions.find_active_sysroot() == '/dev/mmcblk0p2'
    monkeypatch.setattr(file_actions, '_get_proc_cmdline',
                        lambda: proc_cmdline_p3)
    assert file_actions.find_active_sysroot()\
        == '/dev/mmcblk0p3'

    assert file_actions.find_inactive_sysroot()\
        == '/dev/mmcblk0p2'
    monkeypatch.setattr(file_actions, '_get_proc_cmdline',
                        lambda: proc_cmdline_p2)
    assert file_actions.find_inactive_sysroot()\
        == '/dev/mmcblk0p3'

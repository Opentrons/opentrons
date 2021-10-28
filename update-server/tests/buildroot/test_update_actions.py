""" tests for otupdate.buildroot.file_actions

Checks functionality and error cases for the update utility functions there
"""
import binascii
import hashlib
import os
import subprocess
from unittest import mock
import zipfile

import pytest

from otupdate.buildroot import update_actions
from otupdate.common import file_actions


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_validate_hash_only(downloaded_update_file):
    updater = update_actions.OT2UpdateActions()
    cb = mock.Mock()
    assert updater.validate_update(downloaded_update_file, cb, cert_path=None)
    # We should have a callback call for
    # - the unzips (see test_unzip for calculation)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        rootfs_size = zf.getinfo(update_actions.ROOTFS_NAME).file_size
        rootfs_calls = rootfs_size // 1024
        if rootfs_calls * 1024 != rootfs_size:
            rootfs_calls += 1
    # only adding 1 extra call because we don’t have a signature file
    calls = rootfs_calls + 1

    # - the hashes, one for each chunk, the same chunks as unzip
    calls += rootfs_calls
    assert cb.call_count == calls


def test_validate(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    assert updater.validate_update(downloaded_update_file, cb, cert_path=testing_cert)
    # We should have a callback call for
    # - the unzips (see test_unzip for calculation)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        rootfs_size = zf.getinfo(update_actions.ROOTFS_NAME).file_size
        rootfs_calls = rootfs_size // 1024
        if rootfs_calls * 1024 != rootfs_size:
            rootfs_calls += 1
    calls = rootfs_calls + 2

    # - the hashes, one for each chunk, the same chunks as unzip
    calls += rootfs_calls
    assert cb.call_count == calls


@pytest.mark.bad_hash
def test_validate_catches_bad_hash(downloaded_update_file):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    with pytest.raises(file_actions.HashMismatch):
        updater.validate_update(downloaded_update_file, cb, None)


@pytest.mark.bad_sig
def test_validate_catches_bad_sig(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    with pytest.raises(file_actions.SignatureMismatch):
        updater.validate_update(downloaded_update_file, cb, testing_cert)


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_validate_catches_missing_sig(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    with pytest.raises(file_actions.FileMissing):
        updater.validate_update(downloaded_update_file, cb, testing_cert)


@pytest.mark.exclude_rootfs_ext4_hash
def test_validate_catches_missing_hash(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    with pytest.raises(file_actions.FileMissing):
        updater.validate_update(downloaded_update_file, cb, testing_cert)


@pytest.mark.exclude_rootfs_ext4
def test_validate_catches_missing_image(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    updater = update_actions.OT2UpdateActions()
    with pytest.raises(file_actions.FileMissing):
        updater.validate_update(downloaded_update_file, cb, testing_cert)


def test_write_update(extracted_update_file, testing_partition):
    updater = update_actions.OT2UpdateActions()
    img = os.path.join(extracted_update_file, "rootfs.ext4")
    cb = mock.Mock()
    updater.write_update(img, cb)

    filesize = open(testing_partition).seek(0, 2)

    call_count = filesize // 1024
    if call_count * 1024 != filesize:
        call_count += 1

    assert cb.call_count == call_count

    hasher = hashlib.sha256()
    hasher.update(open(testing_partition, "rb").read())
    hash_val = binascii.hexlify(hasher.digest())
    assert (
        hash_val
        == open(os.path.join(extracted_update_file, "rootfs.ext4.hash"), "rb")
        .read()
        .strip()
    )


def test_commit_update(monkeypatch):
    updater = update_actions.OT2UpdateActions()
    unused = update_actions.RootPartitions.TWO
    new = update_actions.RootPartitions.TWO
    monkeypatch.setattr(update_actions, "_find_unused_partition", lambda: unused)
    monkeypatch.setattr(update_actions, "_switch_partition", lambda: new)
    updater.commit_update()


def test_commit_mismatch(monkeypatch):
    updater = update_actions.OT2UpdateActions()
    unused = update_actions.RootPartitions.THREE
    new = update_actions.RootPartitions.TWO
    monkeypatch.setattr(update_actions, "_find_unused_partition", lambda: unused)
    monkeypatch.setattr(update_actions, "_switch_partition", lambda: new)
    with pytest.raises(RuntimeError):
        updater.commit_update()


def test_mount_update(monkeypatch, tmpdir):
    updater = update_actions.OT2UpdateActions()
    subprocess_mock = mock.Mock()
    subprocess_mock.return_value = 0
    monkeypatch.setattr(subprocess, "check_output", subprocess_mock)
    unused = update_actions.RootPartitions.THREE
    monkeypatch.setattr(update_actions, "_find_unused_partition", lambda: unused)
    monkeypatch.setattr(update_actions, "_mountpoint_root", lambda: tmpdir)
    mountpoint = None
    with updater.mount_update() as mount:
        subprocess_mock.assert_called_once_with(["mount", unused.value.path, mount])
        subprocess_mock.reset_mock()
        subprocess_mock.return_value = 0
        mountpoint = mount
    subprocess_mock.assert_called_once_with(["umount", mountpoint])


def test_write_machine_id(monkeypatch, tmpdir):
    updater = update_actions.OT2UpdateActions()
    new = os.path.join(tmpdir, "new_root")
    old = os.path.join(tmpdir, "old_root")
    os.makedirs(os.path.join(new, "etc"))
    os.makedirs(os.path.join(old, "etc"))
    mid = "78a59366e08f4650bd2212afd7777eab\n"
    open(os.path.join(old, "etc", "machine-id"), "w").write(mid)
    updater.write_machine_id(old, new)
    assert open(os.path.join(new, "etc", "machine-id")).read() == mid

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

from otupdate.buildroot import file_actions


def test_unzip(downloaded_update_file):
    cb = mock.Mock()
    paths, sizes = file_actions.unzip_update(downloaded_update_file, cb,
                                             file_actions.UPDATE_FILES,
                                             file_actions.UPDATE_FILES)
    assert sorted(list(paths.keys())) == sorted(file_actions.UPDATE_FILES)
    for filename, path in paths.items():
        assert os.path.dirname(path) == os.path.dirname(downloaded_update_file)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        for filename, size in sizes.items():
            assert zf.getinfo(filename).file_size == size
        for filename, path in paths.items():
            assert zf.read(filename) == open(path, 'rb').read()
    # We should have callback calls for
    # - every chunk (including the fractional one at the end) of rootfs
    calls = sizes[file_actions.ROOTFS_NAME] // 1024
    if calls * 1024 != sizes[file_actions.ROOTFS_NAME]:
        calls += 1
    # - the two files that are less than a chunk
    calls += 2
    assert cb.call_count == calls


@pytest.mark.exclude_rootfs_ext4
def test_unzip_requires_rootfs(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(downloaded_update_file, cb,
                                  file_actions.UPDATE_FILES,
                                  file_actions.UPDATE_FILES)


@pytest.mark.exclude_rootfs_ext4_hash
def test_unzip_requires_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(downloaded_update_file, cb,
                                  file_actions.UPDATE_FILES,
                                  file_actions.UPDATE_FILES)


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_unzip_does_not_require_sig(downloaded_update_file):
    cb = mock.Mock()
    file_actions.unzip_update(downloaded_update_file, cb,
                              file_actions.UPDATE_FILES,
                              [file_actions.ROOTFS_NAME,
                               file_actions.ROOTFS_HASH_NAME])


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_unzip_requires_sig(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(downloaded_update_file, cb,
                                  file_actions.UPDATE_FILES,
                                  file_actions.UPDATE_FILES)


def test_hash(extracted_update_file):
    cb = mock.Mock()
    hash_output = file_actions.hash_file(
        os.path.join(extracted_update_file, 'rootfs.ext4'),
        cb)
    assert hash_output == open(
        os.path.join(extracted_update_file, 'rootfs.ext4.hash'), 'rb').read()
    cb.assert_called()


def test_verify_signature_ok(extracted_update_file, testing_cert):
    file_actions.verify_signature(os.path.join(extracted_update_file,
                                               'rootfs.ext4.hash'),
                                  os.path.join(extracted_update_file,
                                               'rootfs.ext4.hash.sig'),
                                  testing_cert)


@pytest.mark.bad_sig
def test_verify_signature_catches_bad_sig(
        extracted_update_file, testing_cert):
    with pytest.raises(file_actions.SignatureMismatch):
        file_actions.verify_signature(os.path.join(extracted_update_file,
                                                   'rootfs.ext4.hash'),
                                      os.path.join(extracted_update_file,
                                                   'rootfs.ext4.hash.sig'),
                                      testing_cert)


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_validate_hash_only(downloaded_update_file):
    cb = mock.Mock()
    assert file_actions.validate_update(downloaded_update_file,
                                        cb,
                                        cert_path=None)
    # We should have a callback call for
    # - the unzips (see test_unzip for calculation)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        rootfs_size = zf.getinfo(file_actions.ROOTFS_NAME).file_size
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
    assert file_actions.validate_update(downloaded_update_file,
                                        cb,
                                        cert_path=testing_cert)
    # We should have a callback call for
    # - the unzips (see test_unzip for calculation)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        rootfs_size = zf.getinfo(file_actions.ROOTFS_NAME).file_size
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
    with pytest.raises(file_actions.HashMismatch):
        file_actions.validate_update(downloaded_update_file, cb, None)


@pytest.mark.bad_sig
def test_validate_catches_bad_sig(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    with pytest.raises(file_actions.SignatureMismatch):
        file_actions.validate_update(downloaded_update_file, cb,
                                     testing_cert)


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_validate_catches_missing_sig(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.validate_update(downloaded_update_file, cb, testing_cert)


@pytest.mark.exclude_rootfs_ext4_hash
def test_validate_catches_missing_hash(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.validate_update(downloaded_update_file, cb, testing_cert)


@pytest.mark.exclude_rootfs_ext4
def test_validate_catches_missing_image(downloaded_update_file, testing_cert):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.validate_update(downloaded_update_file, cb, testing_cert)


def test_write_update(extracted_update_file, testing_partition):
    img = os.path.join(extracted_update_file, 'rootfs.ext4')
    cb = mock.Mock()
    file_actions.write_update(img, cb)

    filesize = open(testing_partition).seek(0, 2)

    call_count = filesize // 1024
    if call_count * 1024 != filesize:
        call_count += 1

    assert cb.call_count == call_count

    hasher = hashlib.sha256()
    hasher.update(open(testing_partition, 'rb').read())
    hash_val = binascii.hexlify(hasher.digest())
    assert hash_val\
        == open(
            os.path.join(extracted_update_file, 'rootfs.ext4.hash'),
            'rb').read().strip()


def test_commit_update(monkeypatch):
    unused = file_actions.RootPartitions.TWO
    new = file_actions.RootPartitions.TWO
    monkeypatch.setattr(file_actions, '_find_unused_partition',
                        lambda: unused)
    monkeypatch.setattr(file_actions, '_switch_partition',
                        lambda: new)
    file_actions.commit_update()


def test_commit_mismatch(monkeypatch):
    unused = file_actions.RootPartitions.THREE
    new = file_actions.RootPartitions.TWO
    monkeypatch.setattr(file_actions, '_find_unused_partition',
                        lambda: unused)
    monkeypatch.setattr(file_actions, '_switch_partition',
                        lambda: new)
    with pytest.raises(RuntimeError):
        file_actions.commit_update()


def test_mount_update(monkeypatch, tmpdir):
    subprocess_mock = mock.Mock()
    subprocess_mock.return_value = 0
    monkeypatch.setattr(subprocess, 'check_output', subprocess_mock)
    unused = file_actions.RootPartitions.THREE
    monkeypatch.setattr(file_actions, '_find_unused_partition',
                        lambda: unused)
    monkeypatch.setattr(file_actions, '_mountpoint_root',
                        lambda: tmpdir)
    mountpoint = None
    with file_actions.mount_update() as mount:
        subprocess_mock.assert_called_once_with(
            ['mount', unused.value.path, mount])
        subprocess_mock.reset_mock()
        subprocess_mock.return_value = 0
        mountpoint = mount
    subprocess_mock.assert_called_once_with(
        ['umount', mountpoint])


def test_write_machine_id(monkeypatch, tmpdir):
    new = os.path.join(tmpdir, 'new_root')
    old = os.path.join(tmpdir, 'old_root')
    os.makedirs(os.path.join(new, 'etc'))
    os.makedirs(os.path.join(old, 'etc'))
    mid = '78a59366e08f4650bd2212afd7777eab\n'
    open(os.path.join(old, 'etc', 'machine-id'), 'w').write(mid)
    file_actions.write_machine_id(old, new)
    assert open(os.path.join(new, 'etc', 'machine-id')).read() == mid

from unittest import mock
import os
import zipfile

import pytest

from otupdate.common import file_actions

UPDATE_FILES = ['rootfs.ext4', 'rootfs.ext4.hash', 'rootfs.ext4.hash.sig']


def test_unzip(downloaded_update_file):
    cb = mock.Mock()
    paths, sizes = file_actions.unzip_update(downloaded_update_file, cb,
                                             UPDATE_FILES,
                                             UPDATE_FILES)
    assert sorted(list(paths.keys())) == sorted(UPDATE_FILES)
    for filename, path in paths.items():
        assert os.path.dirname(path) == os.path.dirname(downloaded_update_file)
    with zipfile.ZipFile(downloaded_update_file) as zf:
        for filename, size in sizes.items():
            assert zf.getinfo(filename).file_size == size
        for filename, path in paths.items():
            assert zf.read(filename) == open(path, 'rb').read()
    # We should have callback calls for
    # - every chunk (including the fractional one at the end) of rootfs
    calls = sizes['rootfs.ext4'] // 1024
    if calls * 1024 != sizes['rootfs.ext4']:
        calls += 1
    # - the two files that are less than a chunk
    calls += 2
    assert cb.call_count == calls


@pytest.mark.exclude_rootfs_ext4
def test_unzip_requires_rootfs(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(
            downloaded_update_file, cb, UPDATE_FILES, UPDATE_FILES)


@pytest.mark.exclude_rootfs_ext4_hash
def test_unzip_requires_hash(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(
            downloaded_update_file, cb, UPDATE_FILES, UPDATE_FILES)


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_unzip_does_not_require_sig(downloaded_update_file):
    cb = mock.Mock()
    file_actions.unzip_update(
        downloaded_update_file, cb,
        UPDATE_FILES, UPDATE_FILES[:-1])


@pytest.mark.exclude_rootfs_ext4_hash_sig
def test_unzip_requires_sig(downloaded_update_file):
    cb = mock.Mock()
    with pytest.raises(file_actions.FileMissing):
        file_actions.unzip_update(downloaded_update_file, cb,
                                  UPDATE_FILES,
                                  UPDATE_FILES)


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

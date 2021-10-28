import collections
import os
import json
import re
import subprocess
from unittest import mock
import zipfile

import pytest

from otupdate import buildroot

HERE = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture
def downloaded_update_file(request, extracted_update_file):
    """
    Return the path to a zipped update file

    To exclude files, mark with ``exclude_rootfs_ext4``,
    ``exclude_rootfs_ext4_hash``, ``exclude_rootfs_ext4_hash_sig``.

    This uses :py:meth:`extracted_update_file` to generate the contents, so
    marks that fixture understands can be used when requesting this fixture

    Can also be used by tests that will uploaded it to a test server, since
    when the test server boots its download path will be somewhere else
    """
    rootfs_path = os.path.join(extracted_update_file, 'rootfs.ext4')
    hash_path = os.path.join(extracted_update_file, 'rootfs.ext4.hash')
    sig_path = os.path.join(extracted_update_file, 'rootfs.ext4.hash.sig')
    zip_path = os.path.join(extracted_update_file, 'ot2-system.zip')
    with zipfile.ZipFile(zip_path, 'w') as zf:
        if not request.node.get_closest_marker('exclude_rootfs_ext4'):
            zf.write(rootfs_path, 'rootfs.ext4')
        if not request.node.get_closest_marker('exclude_rootfs_ext4_hash'):
            zf.write(hash_path, 'rootfs.ext4.hash')
        if not request.node.get_closest_marker('exclude_rootfs_ext4_hash_sig'):
            zf.write(sig_path, 'rootfs.ext4.hash.sig')
    os.unlink(rootfs_path)
    os.unlink(hash_path)
    os.unlink(sig_path)
    return zip_path


@pytest.fixture
def extracted_update_file(request, tmpdir):
    """
    Return the path to a dir containing an unzipped update file.

    To make a bad hash, mark with ``bad_hash``. To make a bad
    signature, mark with ``bad_sig``.
    """
    rootfs_path = os.path.join(tmpdir, 'rootfs.ext4')
    hash_path = os.path.join(tmpdir, 'rootfs.ext4.hash')
    sig_path = os.path.join(tmpdir, 'rootfs.ext4.hash.sig')
    rootfs_contents = os.urandom(100000)
    with open(rootfs_path, 'wb') as rfs:
        rfs.write(rootfs_contents)
    if request.node.get_closest_marker('bad_hash'):
        hashval = b'0oas0ajcs0asd0asjc0ans0d9ajsd0ian0s9djas'
    else:
        try:
            shasum_out = subprocess.check_output(
                ['shasum', '-a', '256', rootfs_path])
        except (subprocess.CalledProcessError, FileNotFoundError):
            pytest.skip("no shasum invokeable on command line")
        hashval = re.match(b'^([a-z0-9]+) ', shasum_out).group(1)
    with open(hash_path, 'wb') as rfsh:
        rfsh.write(hashval)
    if not request.node.get_closest_marker('bad_sig'):
        try:
            subprocess.check_output(['openssl', 'version'])
        except (subprocess.CalledProcessError, FileNotFoundError):
            pytest.skip('requires openssl binary to be installed')
        subprocess.check_call(
            ['openssl', 'dgst', '-sha256', '-sign',
             os.path.join(HERE, 'ot-update-server-unit-tests.key'),
             '-out', sig_path, hash_path])
    else:
        with open(sig_path, 'wb') as sigfile:
            sigfile.write(os.urandom(256))
    return tmpdir


@pytest.fixture
def testing_cert():
    """ Path to the testing public cert """
    return os.path.join(HERE, 'ot-update-server-unit-tests.crt')


@pytest.fixture
def otupdate_config(request, tmpdir, testing_cert):
    """ Build a config file.

    By default signatures are required; to turn them off decorate the test with
    @pytest.mark.no_signature_required

    For an invalid cert path decorate with @pytest.mark.bad_cert_path
    For no cert path decorate with @pytest.mark.no_cert_path
    """
    path = os.path.join(tmpdir, 'config.json')
    conf = {
            'signature_required':
            not bool(request.node.get_closest_marker('no_signature_required')),
            'download_storage_path': os.path.join(tmpdir, 'downloads')
        }
    if not request.node.get_closest_marker('no_cert_path'):
        if request.node.get_closest_marker('bad_cert_path'):
            conf.update({'update_cert_path': 'asodhafjasda'})
        else:
            conf.update({'update_cert_path':
                         os.path.join(
                             HERE, 'ot-update-server-unit-tests.crt')})
    json.dump(conf, open(path, 'w'))
    return path


# This can be used to replace file_actions.RootPartitions elements as long
# as the callee doesn’t actually do identity checking
FakeRootPartElem = collections.namedtuple('FakeRootPartElem',
                                          ('name', 'value'))


@pytest.fixture
def testing_partition(monkeypatch, tmpdir):
    partfile = os.path.join(tmpdir, 'fake-partition')
    find_unused = mock.Mock()
    monkeypatch.setattr(buildroot.file_actions, '_find_unused_partition',
                        find_unused)
    find_unused.return_value = FakeRootPartElem(
        'TWO', buildroot.file_actions.Partition(2, partfile))
    return partfile

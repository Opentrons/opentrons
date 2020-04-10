"""
 otupdate.buildroot.file_actions: what files to expect and what to do with them

This module has functions that actually accomplish the various tasks required
for an update: unzipping update files, hashing rootfs, checking signatures,
writing to root partitions
"""
import binascii
import contextlib
import enum
import hashlib
import logging
import os
import re
import subprocess
import tempfile
from typing import (Callable, Dict, List, Mapping, NamedTuple,
                    Optional, Sequence, Tuple)
import zipfile


ROOTFS_SIG_NAME = 'rootfs.ext4.hash.sig'
ROOTFS_HASH_NAME = 'rootfs.ext4.hash'
ROOTFS_NAME = 'rootfs.ext4'
UPDATE_FILES = [ROOTFS_NAME, ROOTFS_SIG_NAME, ROOTFS_HASH_NAME]
LOG = logging.getLogger(__name__)


class Partition(NamedTuple):
    number: int
    path: str


class RootPartitions(enum.Enum):
    TWO: Partition = Partition(2, '/dev/mmcblk0p2')
    THREE: Partition = Partition(3, '/dev/mmcblk0p3')


class SignatureMismatch(ValueError):
    def __init__(self, message):
        self.message = message
        self.short = 'Signature Mismatch'

    def __repr__(self, message):
        return f'<{self.__class__.__name__}: {self.message}>'

    def __str__(self):
        return self.message


class HashMismatch(ValueError):
    def __init__(self, message):
        self.message = message
        self.short = 'Hash Mismatch'

    def __repr__(self):
        return f'<{self.__class__.__name__}: {self.message}>'

    def __str__(self):
        return self.message


class FileMissing(ValueError):
    def __init__(self, message):
        self.message = message
        self.short = 'File Missing'

    def __repr__(self):
        return f'<{self.__class__.__name__}: {self.message}>'

    def __str__(self):
        return self.message


def unzip_update(filepath: str,
                 progress_callback: Callable[[float], None],
                 acceptable_files: Sequence[str],
                 mandatory_files: Sequence[str],
                 chunk_size: int = 1024) -> Tuple[Mapping[str, Optional[str]],
                                                  Mapping[str, int]]:
    """ Unzip an update file

    The update file must contain

    - a file called rootfs.ext4
    - a file called rootfs.ext4.hash

    It may contain

    - a file called rootfs.ext4.hash.sig

    These will all be unzipped (discarding their leading directories) to
    the same file as the zipfile.

    This function is blocking and takes a while. It calls ``progress_callback``
    to indicate update progress with a number between 0 and 1 indicating
    overall archive unzip progress.

    :param filepath: The path zipfile to unzip. The contents will be in its
                     directory
    :param progress_callback: A callable taking a number between 0 and 1 that
                              will be called periodically to check progress.
                              This is for user display; it may not reach 1.0
                              exactly.
    :param acceptable_files: A list of files to unzip if found. Others will be
                             ignored.
    :param mandatory_files: A list of files to raise an error about if they're
                            not in the zip. Should probably be a subset of
                            ``acceptable_files``.
    :param chunk_size: If specified, the size of the chunk to read and write.
                       If not specified, will default to 1024
    :return: Two dictionaries, the first mapping file names to paths and the
             second mapping file names to sizes

    :raises FileMissing: If a mandatory file is missing
    """
    assert chunk_size
    total_size = 0
    written_size = 0
    to_unzip: List[zipfile.ZipInfo] = []
    file_paths: Dict[str, Optional[str]] = {fn: None
                                            for fn in acceptable_files}
    file_sizes: Dict[str, int] = {fn: 0 for fn in acceptable_files}
    LOG.info(f"Unzipping {filepath}")
    with zipfile.ZipFile(filepath, 'r') as zf:
        files = zf.infolist()
        remaining_filenames = [fn for fn in acceptable_files]
        for fi in files:
            if fi.filename in acceptable_files:
                to_unzip.append(fi)
                total_size += fi.file_size
                remaining_filenames.remove(fi.filename)
                LOG.debug(f"Found {fi.filename} ({fi.file_size}B)")
            else:
                LOG.debug(f"Ignoring {fi.filename}")

        for name in remaining_filenames:
            if name in mandatory_files:
                raise FileMissing(f'File {name} missing from zip')

        for fi in to_unzip:
            uncomp_path = os.path.join(os.path.dirname(filepath), fi.filename)
            with zf.open(fi) as zipped, open(uncomp_path, 'wb') as unzipped:
                LOG.debug(f"Beginning unzip of {fi.filename} to {uncomp_path}")
                while True:
                    chunk = zipped.read(chunk_size)
                    unzipped.write(chunk)
                    written_size += len(chunk)
                    progress_callback(written_size/total_size)
                    if len(chunk) != chunk_size:
                        break
                file_paths[fi.filename] = uncomp_path
                file_sizes[fi.filename] = fi.file_size
                LOG.debug(f"Unzipped {fi.filename} to {uncomp_path}")
    LOG.info(
        f"Unzipped {filepath}, results: \n\t" + '\n\t'.join(
            [f'{k}: {file_paths[k]} ({file_sizes[k]}B)'
             for k in file_paths.keys()]))
    return file_paths, file_sizes


def hash_file(path: str,
              progress_callback: Callable[[float], None],
              chunk_size: int = 1024,
              file_size: int = None,
              algo: str = 'sha256') -> bytes:
    """
    Hash a file and return the hash, providing progress callbacks

    :param path: The file to hash
    :param progress_callback: The callback to call with progress between 0 and
                              1. May not ever be precisely 1.0.
    :param chunk_size: If specified, the size of the chunks to hash in one call
                       If not specified, defaults to 1024
    :param file_size: If specified, the size of the file to hash (used for
                      progress callback generation). If not specified,
                      calculated internally.
    :param algo: The algorithm to use. Can be anything used by
                 :py:mod:`hashlib`
    :returns: The output has ascii hex
    """
    hasher = hashlib.new(algo)
    have_read = 0
    if not chunk_size:
        chunk_size = 1024
    with open(path, 'rb') as to_hash:
        if not file_size:
            file_size = to_hash.seek(0, 2)
            to_hash.seek(0)
        while True:
            chunk = to_hash.read(chunk_size)
            hasher.update(chunk)
            have_read += len(chunk)
            progress_callback(have_read/file_size)
            if len(chunk) != chunk_size:
                break
    return binascii.hexlify(hasher.digest())


def verify_signature(message_path: str,
                     sigfile_path: str,
                     cert_path: str) -> None:
    """
    Verify the signature (assumed, of the hash file)

    It is assumed that the public key for the signature is in the keyring

    :param message_path: The path to the message file to check
    :param sigfile_path: The path to the signature to check
    :param cert_path: The path to the certificate to check the signature with
    :returns True: If the signature verifies
    :raises SignatureMismatch: If the signature does not verify
    """
    with tempfile.TemporaryDirectory() as pubkey_dir:
        pubkey_contents = subprocess.check_output(
            ['openssl', 'x509', '-in', cert_path,
             '-pubkey', '-noout'])
        pubkey_file = os.path.join(pubkey_dir, 'pubkey')
        open(pubkey_file, 'wb').write(pubkey_contents)
        try:
            verification = subprocess.check_output(
                ['openssl', 'dgst', '-sha256', '-verify', pubkey_file,
                 '-signature', sigfile_path, message_path],
                stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as cpe:
            verification = cpe.output

    if verification.strip() == b'Verified OK':
        LOG.info(f"Verification passed from cert {cert_path}")
    else:
        LOG.error(
            f"Verification failed with cert {cert_path}: {verification!r}")
        raise SignatureMismatch('Signature check failed')


def validate_update(filepath: str,
                    progress_callback: Callable[[float], None],
                    cert_path: Optional[str]):
    """ Worker for validation. Call in an executor (so it can return things)

    - Unzips filepath to its directory
    - Hashes the rootfs inside
    - If requested, checks the signature of the hash
    :param filepath: The path to the update zip file
    :param progress_callback: The function to call with progress between 0
                              and 1.0. May never reach precisely 1.0, best
                              only for user information
    :param cert_path: Path to an x.509 certificate to check the signature
                      against. If ``None``, signature checking is disabled
    :returns str: Path to the rootfs file to update

    Will also raise an exception if validation fails
    """

    def zip_callback(progress):
        progress_callback(progress/2.0)

    required = [ROOTFS_NAME, ROOTFS_HASH_NAME]
    if cert_path:
        required.append(ROOTFS_SIG_NAME)
    files, sizes = unzip_update(filepath, zip_callback,
                                UPDATE_FILES,
                                required)

    def hash_callback(progress):
        progress_callback(progress/2.0 + 0.5)
    rootfs = files.get(ROOTFS_NAME)
    assert rootfs
    rootfs_hash = hash_file(rootfs,
                            hash_callback,
                            file_size=sizes[ROOTFS_NAME])
    hashfile = files.get(ROOTFS_HASH_NAME)
    assert hashfile
    packaged_hash = open(hashfile, 'rb').read().strip()
    if packaged_hash != rootfs_hash:
        msg = f"Hash mismatch: calculated {rootfs_hash!r} != "\
            f"packaged {packaged_hash!r}"
        LOG.error(msg)
        raise HashMismatch(msg)

    if cert_path:
        sigfile = files.get(ROOTFS_SIG_NAME)
        assert sigfile
        verify_signature(hashfile, sigfile, cert_path)

    return rootfs


def _find_unused_partition() -> RootPartitions:
    """ Find the currently-unused root partition to write to """
    which = subprocess.check_output(['ot-unused-partition']).strip()
    return {b'2': RootPartitions.TWO,
            b'3': RootPartitions.THREE}[which]


def write_file(infile: str,
               outfile: str,
               progress_callback: Callable[[float], None],
               chunk_size: int = 1024,
               file_size: int = None):
    """ Write a file to another file with progress callbacks.

    :param infile: The input filepath
    :param outfile: The output filepath
    :param progress_callback: The callback to call for progress
    :param chunk_size: The size of file chunks to copy in between progress
                       notifications
    :param file_size: The total size of the update file (for generating
                      progress percentage). If ``None``, generated with
                      ``seek``/``tell``.
    """
    total_written = 0
    with open(infile, 'rb') as img, open(outfile, 'wb') as part:
        if None is file_size:
            file_size = img.seek(0, 2)
            img.seek(0)
            LOG.info(f'write_file: file size calculated as {file_size}B')
        LOG.info(f'write_file: writing {infile} ({file_size}B)'
                 f' to {outfile} in {chunk_size}B chunks')
        while True:
            chunk = img.read(chunk_size)
            part.write(chunk)
            total_written += len(chunk)
            progress_callback(total_written / file_size)
            if len(chunk) != chunk_size:
                break


def write_update(rootfs_filepath: str,
                 progress_callback: Callable[[float], None],
                 chunk_size: int = 1024,
                 file_size: int = None) -> RootPartitions:
    """
    Write the new rootfs to the next root partition

    - Figure out, from the system, the correct root partition to write to
    - Write the rootfs at ``rootfs_filepath`` there, with progress

    :param rootfs_filepath: The path to a checked rootfs.ext4
    :param progress_callback: A callback to call periodically with progress
                              between 0 and 1.0. May never reach precisely
                              1.0, best only for user information.
    :param chunk_size: The size of file chunks to copy in between progress
                       notifications
    :param file_size: The total size of the update file (for generating
                      progress percentage). If ``None``, generated with
                      ``seek``/``tell``.
    :returns: The root partition that the rootfs image was written to, e.g.
              ``RootPartitions.TWO`` or ``RootPartitions.THREE``.
    """
    unused = _find_unused_partition()
    part_path = unused.value.path
    write_file(rootfs_filepath, part_path, progress_callback,
               chunk_size, file_size)
    return unused


def _mountpoint_root():
    """ provides mountpoint location for :py:meth:`mount_update`.

    exists only for ease of mocking
    """
    return '/mnt'


@contextlib.contextmanager
def mount_update():
    """ Mount the freshly-written partition r/w (to update machine-id).

    Should be used as a context manager, and the yielded value is the path
    to the mount. When the context manager exits, the partition will be
    unmounted again and its mountpoint removed.

    :param mountpoint_in: The directory in which to create the mountpoint.
    """
    unused = _find_unused_partition()
    part_path = unused.value.path
    with tempfile.TemporaryDirectory(dir=_mountpoint_root()) as mountpoint:
        subprocess.check_output(['mount', part_path, mountpoint])
        LOG.info(f"mounted {part_path} to {mountpoint}")
        try:
            yield mountpoint
        finally:
            subprocess.check_output(['umount', mountpoint])
            LOG.info(f"Unmounted {part_path} from {mountpoint}")


def write_machine_id(current_root: str, new_root: str):
    """ Update the machine id in target rootfs """
    mid = open(os.path.join(current_root, 'etc', 'machine-id')).read()
    with open(os.path.join(new_root, 'etc', 'machine-id'), 'w') as new_mid:
        new_mid.write(mid)
    LOG.info(f'Wrote machine_id {mid.strip()} to {new_root}/etc/machine-id')


def _switch_partition() -> RootPartitions:
    """ Switch the active boot partition using the switch script """
    res = subprocess.check_output(['ot-switch-partitions'])
    for line in res.split(b'\n'):
        matches = re.match(
            b'Current boot partition: ([23]), setting to ([23])',
            line)
        if matches:
            return {b'2': RootPartitions.TWO,
                    b'3': RootPartitions.THREE}[matches.group(2)]
    else:
        raise RuntimeError(f'Bad output from ot-switch-partitions: {res!r}')


def commit_update():
    """ Switch the target boot partition. """
    unused = _find_unused_partition()
    new = _switch_partition()
    if new != unused:
        msg = f"Bad switch: switched to {new} when {unused} was unused"
        LOG.error(msg)
        raise RuntimeError(msg)
    else:
        LOG.info(f'commit_update: committed to booting {new}')

"""
common.file_actions - actions common to both buildroot and openembedded like
handling hash and sig checking
"""

import binascii
import hashlib
import logging
import os
import subprocess
from typing import Callable, Sequence, Mapping, Optional, Tuple
import tempfile
import zipfile

LOG = logging.getLogger(__name__)


class FileMissing(ValueError):
    def __init__(self, message):
        self.message = message
        self.short = 'File Missing'

    def __repr__(self):
        return f'<{self.__class__.__name__}: {self.message}>'

    def __str__(self):
        return self.message


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

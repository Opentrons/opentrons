"""
otupdate.common.update_actions: abc and resources for system-specific
update actions
"""

import abc
import contextlib
from typing import NamedTuple, Optional, Callable, Iterator, List
from aiohttp import web

from .constants import APP_VARIABLE_PREFIX

from otupdate.common.file_actions import (
    unzip_update,
    hash_file,
    verify_signature,
    HashMismatch,
)

import logging

FILE_ACTIONS_VARNAME = APP_VARIABLE_PREFIX + "fileactions"

LOG = logging.getLogger(__name__)


class Partition(NamedTuple):
    number: int
    path: str


class UpdateActionsInterface:
    @staticmethod
    def from_request(request: web.Request) -> Optional["UpdateActionsInterface"]:
        """Get the update object from the aiohttp app store"""
        return request.app.get(FILE_ACTIONS_VARNAME, None)

    @classmethod
    def build_and_insert(cls, app: web.Application):
        """Build the object and put it in the app store"""
        app[FILE_ACTIONS_VARNAME] = cls()

    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
        rootfs_name: str,
        rootfs_hash_name: str,
        rootfs_sig_name: str,
        update_files: List[str],
        algo: str = "sha256",
    ):
        """Worker for validation. Call in an executor (so it can return things)

        - Unzips filepath to its directory
        - Hashes the rootfs inside
        - If requested, checks the signature of the hash
        :param filepath: The path to the update zip file
        :param progress_callback: The function to call with progress between 0
                                  and 1.0. May never reach precisely 1.0, best
                                  only for user information
        :param cert_path: Path to an x.509 certificate to check the signature
                          against. If ``None``, signature checking is disabled

        :param rootfs_name: name of the root FS
        :param rootfs_hash_name: name of the root FS hash
        :param rootfs_sig_name: name of root FS sig
        :param algo: hash algo to use (md5/sha256)
        :param update_files: list of update files
        :returns str: Path to the rootfs file to update

        Will also raise an exception if validation fails
        """

        def zip_callback(progress):
            progress_callback(progress / 2.0)

        required = [rootfs_name, rootfs_hash_name]
        if cert_path:
            required.append(rootfs_sig_name)
        files, sizes = unzip_update(filepath, zip_callback, update_files, required)

        def hash_callback(progress):
            progress_callback(progress / 2.0 + 0.5)

        rootfs = files.get(rootfs_name)
        assert rootfs
        rootfs_hash = hash_file(
            rootfs, hash_callback, file_size=sizes[rootfs_name], algo="md5"
        )
        hashfile = files.get(rootfs_hash_name)
        assert hashfile
        packaged_hash = open(hashfile, "rb").read().strip().split()[0]
        if packaged_hash != rootfs_hash:
            msg = (
                f"Hash mismatch: calculated {rootfs_hash!r} != "
                f"packaged {packaged_hash!r}"
            )
            LOG.error(msg)
            raise HashMismatch(msg)

        if cert_path:
            sigfile = files.get(rootfs_sig_name)
            assert sigfile
            verify_signature(hashfile, sigfile, cert_path)

        return rootfs

    @abc.abstractmethod
    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int,
        file_size: Optional[int],
    ) -> Partition:
        """
        Write the object to a specific rootfs path
        """
        ...

    @abc.abstractmethod
    @contextlib.contextmanager
    def mount_update(self) -> Iterator:
        """
        Mount the fs to overwrite with the update
        """
        ...

    @abc.abstractmethod
    def commit_update(self) -> None:
        """
        Command the hardware to boot from the freshly-updated filesystem
        """
        ...

    @abc.abstractmethod
    def write_machine_id(self, current_root: str, new_root: str) -> None:
        """Copy the machine id over to the new partition"""
        ...

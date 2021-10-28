"""
otupdate.common.update_actions: abc and resources for system-specific
update actions
"""

import abc
import contextlib
from typing import NamedTuple, Optional, Callable
from aiohttp import web

from .constants import APP_VARIABLE_PREFIX

FILE_ACTIONS_VARNAME = APP_VARIABLE_PREFIX + "fileactions"


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

    @abc.abstractmethod
    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
    ):
        """
        Validate that the object is correct in some system-dependent way
        """
        ...

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
    def mount_update(self) -> None:
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

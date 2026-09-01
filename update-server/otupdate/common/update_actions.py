"""
otupdate.common.update_actions: abc and resources for system-specific
update actions
"""

from __future__ import annotations

import abc
import contextlib
import logging
from typing import Annotated, Callable, Generator, NamedTuple, Optional

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

LOG = logging.getLogger(__name__)

_update_actions_accessor = AppStateAccessor["UpdateActionsInterface"](
    "otupdate_update_actions"
)


class Partition(NamedTuple):
    number: int
    path: str
    mount_point: str = ""


class UpdateActionsInterface:
    @staticmethod
    def from_app_state(app_state: AppState) -> Optional[UpdateActionsInterface]:
        """Get the update object from global app state"""
        return _update_actions_accessor.get_from(app_state)

    @classmethod
    def build_and_insert(cls, app_state: AppState) -> None:
        """Build the object and put it in global app state"""
        _update_actions_accessor.set_on(app_state, cls())

    @abc.abstractmethod
    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
    ) -> str:
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
        :returns str: Path to the rootfs file to update

        Will also raise an exception if validation fails
        """

    @abc.abstractmethod
    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = -1,
        file_size: Optional[int] = None,
    ) -> Partition:
        """
        Write the object to a specific rootfs path
        """
        ...

    @abc.abstractmethod
    @contextlib.contextmanager
    def mount_update(self) -> Generator[str, None, None]:
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

    @abc.abstractmethod
    def clean_up(self, download_dir: str) -> None:
        """Deletes the update files from the download dir."""
        ...

    @abc.abstractmethod
    def restart(self) -> None:
        """Restart the robot."""

    @abc.abstractmethod
    def shutdown(self) -> None:
        """Shut down the robot."""


def install_update_actions(
    app_state: AppState, update_actions: UpdateActionsInterface
) -> None:
    """Store the hardware-specific update actions on global app state.

    This should be done as part of server startup.
    """
    _update_actions_accessor.set_on(app_state, update_actions)


def get_update_actions(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> Optional[UpdateActionsInterface]:
    """A FastAPI dependency to retrieve the hardware-specific update actions."""
    return UpdateActionsInterface.from_app_state(app_state)

"""Grant the restricted protocol user access to persistence files.

Protocol execution on the Flex can run as the `ot-protocol` system user. Persistence
files are created by robot-server as root with modes `0750` / `0640`, which only
work if those paths are also group-owned by `ot-protocol`.

systemd-tmpfiles applies that group at boot for paths that already exist. This helper
applies the same policy when robot-server creates or migrates those paths, so a
subprocess can read them on the same boot.

Directories also get the setgid bit (`02750`). On Linux, later `mkdir` / `open` under
that tree inherit group `ot-protocol`.
"""

from __future__ import annotations

import logging
import os
import pwd
import stat
from pathlib import Path

from typing_extensions import Final

from server_utils.persistence.folder_migrator import (
    PROTOCOL_DIR_PERMISSIONS,
    PROTOCOL_FILE_PERMISSIONS,
)

from .file_and_directory_names import DATA_FILES_DIRECTORY, PROTOCOLS_DIRECTORY

PROTOCOL_USER_NAME: Final = "ot-protocol"
_DIR_MODE_WITH_SETGID: Final = PROTOCOL_DIR_PERMISSIONS | stat.S_ISGID

_log = logging.getLogger(__name__)


def grant_protocol_user_access(version_dir: Path) -> None:
    """Grant `ot-protocol` access to a persistence version directory.

    Applies to `version_dir` itself so the user can traverse it, then recursively
    to `protocols/` and `data_files/` when those exist. Other files in the
    version directory, including the SQLite database, are left unchanged.

    `version_dir` is setgid so children created later inherit group `ot-protocol`.
    """
    apply_protocol_user_permissions(version_dir, recursive=False)
    for name in (PROTOCOLS_DIRECTORY, DATA_FILES_DIRECTORY):
        child = version_dir / name
        if child.exists():
            apply_protocol_user_permissions(child, recursive=True)


def apply_protocol_user_permissions(path: Path, *, recursive: bool = False) -> None:
    """Set protocol-user modes, and group ownership when `ot-protocol` exists.

    Directories become setgid `02750` and files become `0640`. If the
    `ot-protocol` user is missing, only the mode bits are changed.
    """
    gid = _protocol_user_gid()
    _apply_to_path(path, gid)
    if recursive and path.is_dir():
        for item in path.rglob("*"):
            _apply_to_path(item, gid)


def _protocol_user_gid() -> int | None:
    """Return the `ot-protocol` group id, or `None` if that user does not exist."""
    try:
        return pwd.getpwnam(PROTOCOL_USER_NAME).pw_gid
    except KeyError:
        return None


def _apply_to_path(path: Path, gid: int | None) -> None:
    if path.is_symlink() or not path.exists():
        return

    is_dir = path.is_dir()
    if not is_dir:
        os.chmod(path, PROTOCOL_FILE_PERMISSIONS)

    if gid is not None:
        try:
            os.chown(path, -1, gid)
        except PermissionError:
            _log.warning(
                "Could not set group ownership of %s to %s.",
                path,
                PROTOCOL_USER_NAME,
                exc_info=True,
            )

    if is_dir:
        os.chmod(path, _DIR_MODE_WITH_SETGID)

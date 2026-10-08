"""Configure systemd-journald local log storage level."""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

from .models import LogLevels

LOG = logging.getLogger(__name__)

JOURNALD_CONF_PATH = Path("/run/systemd/journald.conf")

# journald uses "err" rather than "error".
_LEVEL_TO_JOURNALD: dict[LogLevels, str] = {
    LogLevels.debug: "debug",
    LogLevels.info: "info",
    LogLevels.warning: "warning",
    LogLevels.error: "err",
}


def set_max_level_store(level: LogLevels, conf_path: Path | None = None) -> str:
    """Write MaxLevelStore to journald.conf and ask journald to reload.

    Args:
        level: The Python-style log level to apply.
        conf_path: Path to the journald configuration file to write.
            Defaults to ``JOURNALD_CONF_PATH``.

    Returns:
        The journald level string that was written (e.g. ``"info"``, ``"err"``).
    """
    if conf_path is None:
        conf_path = JOURNALD_CONF_PATH
    journald_level = _LEVEL_TO_JOURNALD[level]
    conf_path.parent.mkdir(parents=True, exist_ok=True)
    conf_path.write_text(
        f"[Journal]\nMaxLevelStore={journald_level}\n",
        encoding="utf-8",
    )
    LOG.info("Wrote %s with MaxLevelStore=%s", conf_path, journald_level)
    _sighup_journald()
    return journald_level


def _sighup_journald() -> None:
    """Send SIGHUP to systemd-journald so it reloads its configuration."""
    subprocess.run(
        [
            "systemctl",
            "kill",
            "--signal=SIGHUP",
            "--kill-whom=main",
            "systemd-journald.service",
        ],
        check=True,
    )
    LOG.info("Sent SIGHUP to systemd-journald.service")

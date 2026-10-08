"""Tests for journald configuration helpers."""

from pathlib import Path

import pytest
from decoy import Decoy

from system_server.logs import journald
from system_server.logs.journald import set_max_level_store
from system_server.logs.models import LogLevels


@pytest.mark.parametrize(
    ("level", "expected_journald_level"),
    [
        (LogLevels.debug, "debug"),
        (LogLevels.info, "info"),
        (LogLevels.warning, "warning"),
        (LogLevels.error, "err"),
    ],
)
def test_set_max_level_store_writes_conf_and_sighups(
    tmp_path: Path,
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    level: LogLevels,
    expected_journald_level: str,
) -> None:
    """It should write MaxLevelStore and SIGHUP journald."""
    conf_path = tmp_path / "journald.conf"
    mock_run = decoy.mock(func=journald.subprocess.run)
    monkeypatch.setattr(journald.subprocess, "run", mock_run)

    decoy.when(
        mock_run(
            [
                "systemctl",
                "kill",
                "--signal=SIGHUP",
                "--kill-whom=main",
                "systemd-journald.service",
            ],
            check=True,
        )
    ).then_return(None)

    result = set_max_level_store(level, conf_path=conf_path)

    assert result == expected_journald_level
    assert conf_path.read_text(encoding="utf-8") == (
        f"[Journal]\nMaxLevelStore={expected_journald_level}\n"
    )

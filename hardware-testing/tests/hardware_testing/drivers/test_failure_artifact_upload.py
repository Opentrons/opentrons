"""Failure evidence uploads keep the legacy log-only interface compatible."""

from contextlib import nullcontext
from pathlib import Path
import shlex
import subprocess
from unittest.mock import MagicMock, call

import pytest

from hardware_testing.drivers import data_center_client as client


@pytest.fixture
def transport(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Replace the SSH transport so tests cannot connect to a server."""
    monkeypatch.setattr(
        client,
        "_failure_log_ssh_commands",
        lambda: nullcontext(({"TEST": "yes"}, ["mock-ssh"], ["mock-scp"])),
    )
    run = MagicMock()
    monkeypatch.setattr(client, "_run_failure_log_command", run)
    return run


@pytest.mark.parametrize("extension", [".log", ".json", ".csv", ".CSV"])
def test_artifact_upload_uses_shared_destination(
    tmp_path: Path,
    transport: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    extension: str,
) -> None:
    """Each supported artifact is copied as one file using safe arguments."""
    path = tmp_path / f"QC evidence $(not-a-command){extension}"
    path.write_text("evidence", encoding="utf-8")
    remote_dir = "/opt/QC evidence 'archive'"
    monkeypatch.setattr(client, "FAILURE_LOG_REMOTE_DIR", remote_dir)
    destination = f"{client.FAILURE_LOG_USER}@{client.FAILURE_LOG_SERVER}"

    assert client.upload_failure_artifact(path) is True

    assert transport.call_args_list == [
        call(
            ["mock-ssh", destination, f"mkdir -p -- {shlex.quote(remote_dir)}"],
            {"TEST": "yes"},
        ),
        call(
            ["mock-scp", str(path), f"{destination}:{shlex.quote(remote_dir + '/')}"],
            {"TEST": "yes"},
        ),
    ]


@pytest.mark.parametrize("extension", [".log", ".json", ".csv", ".CSV"])
def test_artifacts_share_report_subdirectory(
    tmp_path: Path,
    transport: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    extension: str,
) -> None:
    """Mkdir and SCP use the exact same report folder for every artifact type."""
    path = tmp_path / f"QC evidence $(not-a-command){extension}"
    path.write_text("evidence", encoding="utf-8")
    archive = "/opt/QC evidence 'archive'/"
    monkeypatch.setattr(client, "FAILURE_LOG_REMOTE_DIR", archive)
    report_dir = "P1000M12345_20261029T031626.123456Z"
    remote_dir = archive + report_dir
    destination = f"{client.FAILURE_LOG_USER}@{client.FAILURE_LOG_SERVER}"

    assert client.FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED is True
    assert client.upload_failure_artifact(path, remote_subdir=report_dir) is True

    assert transport.call_args_list == [
        call(
            ["mock-ssh", destination, f"mkdir -p -- {shlex.quote(remote_dir)}"],
            {"TEST": "yes"},
        ),
        call(
            ["mock-scp", str(path), f"{destination}:{shlex.quote(remote_dir + '/')}"],
            {"TEST": "yes"},
        ),
    ]


@pytest.mark.parametrize(
    "remote_subdir",
    [
        "",
        ".",
        "..",
        "../outside",
        "one/two",
        "/absolute",
        "one\\two",
        "SN with spaces",
        "$(touch injected)",
        "SN;touch_injected",
        "SN`id`",
        "SN'quote",
        'SN"quote',
        "SN\nsecond_line",
        "SN\x00",
        "序列号",
    ],
)
@pytest.mark.parametrize(
    "entry_point", ["upload_failure_artifact", "upload_failure_log"]
)
def test_rejects_invalid_remote_subdirectory_before_transport(
    tmp_path: Path,
    transport: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    remote_subdir: str,
    entry_point: str,
) -> None:
    """Untrusted names cannot escape the archive or run remote shell commands."""
    path = tmp_path / "evidence.log"
    path.write_text("evidence", encoding="utf-8")
    authentication = MagicMock()
    monkeypatch.setattr(client, "_failure_log_ssh_commands", authentication)
    upload = getattr(client, entry_point)

    assert upload(path, remote_subdir=remote_subdir) is False
    with pytest.raises(client.FailureLogUploadError, match="Remote subdirectory"):
        upload(path, remote_subdir=remote_subdir, raise_on_error=True)

    authentication.assert_not_called()
    transport.assert_not_called()


def test_legacy_log_entry_supports_report_subdirectory(
    tmp_path: Path, transport: MagicMock
) -> None:
    """The legacy log-only entry point also supports opt-in report folders."""
    path = tmp_path / "evidence.log"
    path.write_text("evidence", encoding="utf-8")
    report_dir = "P1000M12345_20261029T031626Z"
    destination = f"{client.FAILURE_LOG_USER}@{client.FAILURE_LOG_SERVER}"
    remote_dir = f"{client.FAILURE_LOG_REMOTE_DIR}/{report_dir}"

    assert (
        client.upload_failure_log(
            str(path), raise_on_error=True, remote_subdir=report_dir
        )
        is True
    )

    assert transport.call_args_list == [
        call(
            ["mock-ssh", destination, f"mkdir -p -- {shlex.quote(remote_dir)}"],
            {"TEST": "yes"},
        ),
        call(
            ["mock-scp", str(path), f"{destination}:{shlex.quote(remote_dir + '/')}"],
            {"TEST": "yes"},
        ),
    ]


@pytest.mark.parametrize("extension", [".txt", ".zip", ".json.exe", ""])
def test_rejects_unsupported_artifact(
    tmp_path: Path, transport: MagicMock, extension: str
) -> None:
    """Unsupported files fail before any upload command."""
    path = tmp_path / f"evidence{extension}"
    path.write_text("evidence", encoding="utf-8")

    assert client.upload_failure_artifact(path) is False
    with pytest.raises(client.FailureLogUploadError, match="extension"):
        client.upload_failure_artifact(path, raise_on_error=True)
    transport.assert_not_called()


@pytest.mark.parametrize("create_directory", [False, True])
def test_requires_existing_file(
    tmp_path: Path, transport: MagicMock, create_directory: bool
) -> None:
    """A missing path or a directory cannot be uploaded as evidence."""
    path = tmp_path / "evidence.json"
    if create_directory:
        path.mkdir()

    assert client.upload_failure_artifact(path) is False
    transport.assert_not_called()


@pytest.mark.parametrize("extension", [".json", ".csv"])
def test_legacy_log_entry_rejects_new_artifact_types(
    tmp_path: Path, transport: MagicMock, extension: str
) -> None:
    """The old entry point remains log-only."""
    path = tmp_path / f"evidence{extension}"
    path.write_text("evidence", encoding="utf-8")

    with pytest.raises(client.FailureLogUploadError, match="must use the .log"):
        client.upload_failure_log(path, raise_on_error=True)
    transport.assert_not_called()


def test_legacy_log_entry_uploads(tmp_path: Path, transport: MagicMock) -> None:
    """The existing keyword and string path continue to work."""
    path = tmp_path / "evidence.log"
    path.write_text("evidence", encoding="utf-8")

    assert client.upload_failure_log(str(path), raise_on_error=True) is True
    assert transport.call_count == 2


@pytest.mark.parametrize("raise_on_error", [False, True])
def test_upload_error_is_sanitized(
    tmp_path: Path,
    transport: MagicMock,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    raise_on_error: bool,
) -> None:
    """Credentials and subprocess command arguments never enter run logs."""
    password = "test-secret-credential"
    monkeypatch.setattr(client, "FAILURE_LOG_PASSWORD", password)
    path = tmp_path / "evidence.json"
    path.write_text("evidence", encoding="utf-8")
    transport.side_effect = [
        None,
        subprocess.CalledProcessError(
            1, ["scp", "hidden-command-argument"], stderr=f"Denied {password}".encode()
        ),
    ]

    if raise_on_error:
        with pytest.raises(client.FailureLogUploadError) as exc:
            client.upload_failure_artifact(path, raise_on_error=True)
        message = str(exc.value)
    else:
        assert client.upload_failure_artifact(path) is False
        message = capsys.readouterr().out

    assert "copying artifact with SCP" in message
    assert "exit status 1: Denied [redacted]" in message
    assert password not in message
    assert "hidden-command-argument" not in message
    assert password not in capsys.readouterr().out


def test_command_timeout_is_reported(tmp_path: Path, transport: MagicMock) -> None:
    """Artifacts use the same bounded-command timeout error reporting."""
    path = tmp_path / "evidence.csv"
    path.write_text("evidence", encoding="utf-8")
    transport.side_effect = subprocess.TimeoutExpired(["hidden-command"], 120)

    with pytest.raises(
        client.FailureLogUploadError, match="timed out after 120 seconds"
    ):
        client.upload_failure_artifact(path, raise_on_error=True)
    assert transport.call_count == 1

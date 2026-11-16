"""Failure attachments stay grouped by the tested pipette and report creation."""

from datetime import datetime, timezone
import json
from pathlib import Path
import re
from typing import Any, Dict
from unittest.mock import MagicMock

import pytest

from hardware_testing.data.csv_report import CSVReport
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


def _bundle(
    serial: Any = "P1000M12345",
    report_time: Any = "2026/10/29-03:16:26",
    run_id: Any = "run-26-10-28-04-05-06",
    left_serial: Any = "LEFT-FALLBACK",
) -> Dict[str, Any]:
    """Include deliberately different scanned, reference and archive identities."""
    return {
        "report_rows": [
            {
                "section": "META_DATA",
                "tag": "test_device_id",
                "data": [serial, "WRONG-SCANNED-BARCODE", "FAIL"],
            },
            {
                "section": "META_DATA",
                "tag": "test_time_utc",
                "data": [report_time],
            },
        ],
        "report_run_id": run_id,
        "created_at_utc": "2026-10-30T05:06:07.123456+00:00",
        "trace": {
            "identity": {
                "actual_pipettes": {
                    "LEFT": {"serial": left_serial},
                    "RIGHT": {"serial": "RIGHT-REFERENCE"},
                }
            }
        },
    }


def _utc_timestamp(directory: Dict[str, Any]) -> datetime:
    """Accept either ISO UTC spelling while checking the actual instant."""
    return datetime.fromisoformat(directory["timestamp_utc"].replace("Z", "+00:00"))


def test_directory_uses_actual_serial_and_report_creation_time() -> None:
    """A mismatch barcode, reference serial and later failure time are irrelevant."""
    directory = qc._failure_archive_directory(_bundle())
    assert directory["remote_subdir"] == "P1000M12345_20261029T031626Z"
    assert directory["serial_number"] == "P1000M12345"
    assert directory["serial_source"] == "report.test_device_id"
    assert directory["timestamp_source"] == "report.test_time_utc"
    assert _utc_timestamp(directory) == datetime(
        2026, 10, 29, 3, 16, 26, tzinfo=timezone.utc
    )


@pytest.mark.parametrize("serial", [None, ""])
def test_missing_report_serial_uses_actual_left_pipette(serial: Any) -> None:
    """Unfinished scanner metadata still groups by the attached DUT."""
    directory = qc._failure_archive_directory(_bundle(serial=serial))
    assert directory["remote_subdir"] == "LEFT-FALLBACK_20261029T031626Z"
    assert directory["serial_number"] == "LEFT-FALLBACK"
    assert directory["serial_source"] == "trace.identity.actual_pipettes.LEFT.serial"


def test_missing_left_identity_never_uses_right_reference_serial() -> None:
    """An absent DUT serial remains explicitly unknown, even with a reference."""
    bundle = _bundle(serial=None, left_serial=None)
    bundle["trace"]["identity"]["actual_pipettes"].pop("LEFT")
    directory = qc._failure_archive_directory(bundle)
    assert directory["remote_subdir"] == "unknown-SN_20261029T031626Z"
    assert directory["serial_number"] in (None, "unknown-SN")
    assert directory["serial_source"] == "unavailable"


@pytest.mark.parametrize("report_time", [None, "", "invalid", "2026/02/30-01:02:03"])
def test_missing_or_invalid_report_time_uses_report_run_id(report_time: Any) -> None:
    """Bad metadata cannot silently switch a known report to failure time."""
    directory = qc._failure_archive_directory(_bundle(report_time=report_time))
    assert directory["remote_subdir"] == "P1000M12345_20261028T040506Z"
    assert _utc_timestamp(directory) == datetime(
        2026, 10, 28, 4, 5, 6, tzinfo=timezone.utc
    )
    assert directory["timestamp_source"] == "report.test_run_id"


@pytest.mark.parametrize("run_id", [None, "invalid", "run-26-02-30-01-02-03"])
def test_missing_report_timestamp_falls_back_to_archive_time(run_id: Any) -> None:
    """Startup evidence retains microseconds when report creation is unavailable."""
    bundle = _bundle(report_time=None, run_id=run_id)
    directory = qc._failure_archive_directory(bundle)
    assert directory["remote_subdir"] == "P1000M12345_20261030T050607.123456Z"
    assert _utc_timestamp(directory) == datetime(
        2026, 10, 30, 5, 6, 7, 123456, tzinfo=timezone.utc
    )
    assert directory["timestamp_source"] == "failure_bundle.created_at_utc"


def test_archive_timestamp_offset_is_converted_to_utc() -> None:
    """A parsed ISO offset cannot leak local-clock time into a UTC folder name."""
    bundle = _bundle(report_time=None, run_id=None)
    bundle["created_at_utc"] = "2026-10-30T13:06:07.123456+08:00"
    directory = qc._failure_archive_directory(bundle)
    assert directory["remote_subdir"] == "P1000M12345_20261030T050607.123456Z"
    assert _utc_timestamp(directory) == datetime(
        2026, 10, 30, 5, 6, 7, 123456, tzinfo=timezone.utc
    )


def test_missing_report_and_trace_remain_explicitly_unknown() -> None:
    """Early startup failures need no report object or actual-pipette capture."""
    bundle = _bundle()
    bundle.update(report_rows=[], report_run_id=None, trace={})
    directory = qc._failure_archive_directory(bundle)
    assert directory["remote_subdir"] == "unknown-SN_20261030T050607.123456Z"
    assert directory["serial_source"]
    assert directory["timestamp_source"]


@pytest.mark.parametrize("serial", ["SN/123", "SN:123", "../SN $(x)", "序列号123"])
def test_unsafe_serial_produces_stable_single_safe_directory(serial: str) -> None:
    """Unsafe characters cannot create path components or shell syntax."""
    directory = qc._failure_archive_directory(_bundle(serial=serial))
    child = directory["remote_subdir"]
    assert re.fullmatch(r"[A-Za-z0-9_.-]+", child)
    assert child not in (".", "..")
    assert child.endswith("_20261029T031626Z")
    assert directory["serial_number"] == serial
    assert directory == qc._failure_archive_directory(_bundle(serial=serial))


def test_sanitized_serial_collisions_have_distinct_directories() -> None:
    """Different unsafe serials that clean to the same text remain distinct."""
    slash = qc._failure_archive_directory(_bundle(serial="SN/123"))
    colon = qc._failure_archive_directory(_bundle(serial="SN:123"))
    assert slash["remote_subdir"] != colon["remote_subdir"]


@pytest.fixture
def report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> CSVReport:
    """A real report has no external filesystem or transport effects."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", None)
    result = CSVReport(
        "archive-directory-test",
        [],
        run_id="run-26-10-28-04-05-06",
        dont_write_to_disk=True,
    )
    result.set_device_id("P1000M12345", "WRONG-SCANNED-BARCODE")
    result("META_DATA", "test_time_utc", ["2026/10/29-03:16:26"])
    result.set_tag("P1000M12345")
    return result


def test_log_manifest_and_encoder_share_one_directory(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Every failure attachment uses one report directory; formal CSV is untouched."""
    encoder = report.parent / "encoder_debug.csv"
    encoder.write_text("cycle,position\n1,42\n", encoding="utf-8")
    report.file_path.write_text("original formal report\n", encoding="utf-8")
    original_stat = report.file_path.stat()
    save_report = MagicMock(side_effect=AssertionError("Unexpected report save"))
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(report, "save_to_disk", save_report)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    monkeypatch.setattr(
        qc.data_center_client,
        "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED",
        True,
        raising=False,
    )
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["test failure"]
    )
    assert log_path is not None
    manifest = json.loads(log_path.with_suffix(".json").read_text())
    child = "P1000M12345_20261029T031626Z"
    assert manifest["archive_directory"]["remote_subdir"] == child
    assert upload.call_count == 3
    assert {call.args[0].name for call in upload.call_args_list} == {
        log_path.name,
        log_path.with_suffix(".json").name,
        log_path.with_suffix(".encoder.csv").name,
    }
    for call in upload.call_args_list:
        assert call.kwargs == {"raise_on_error": True, "remote_subdir": child}
    for artifact in manifest["artifacts"]:
        assert artifact["remote_subdir"] == child
        assert artifact["remote_subdir_applied"] is True
        assert artifact["remote_directory"] == "/opt/pipette_assembly_qc_log/" + child
        assert artifact["upload_status"] == "uploaded"
    save_report.assert_not_called()
    assert report.file_path.read_text() == "original formal report\n"
    assert report.file_path.stat().st_mtime_ns == original_stat.st_mtime_ns


@pytest.mark.parametrize("flag", [None, False])
def test_legacy_artifact_helper_gets_no_directory_keyword_or_retry(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, flag: Any
) -> None:
    """A helper without declared support uploads once to its known flat directory."""
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    if flag is None:
        monkeypatch.delattr(
            qc.data_center_client,
            "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED",
            raising=False,
        )
    else:
        monkeypatch.setattr(
            qc.data_center_client,
            "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED",
            flag,
            raising=False,
        )
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["test failure"]
    )
    assert log_path is not None
    manifest = json.loads(log_path.with_suffix(".json").read_text())
    assert upload.call_count == 2
    for call in upload.call_args_list:
        assert call.kwargs == {"raise_on_error": True}
    for artifact in manifest["artifacts"]:
        assert artifact["upload_status"] == "uploaded"
        assert artifact["remote_subdir"] == "P1000M12345_20261029T031626Z"
        assert artifact["remote_subdir_applied"] is False
        assert artifact["remote_directory"] == "/opt/pipette_assembly_qc_log"
        assert "old" in artifact["upload_note"].lower()


def test_log_only_legacy_helper_keeps_original_call_signature(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The oldest helper keeps a single log upload and truthful flat-path metadata."""
    monkeypatch.delattr(qc.data_center_client, "upload_failure_artifact")
    monkeypatch.setattr(
        qc.data_center_client,
        "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED",
        True,
        raising=False,
    )
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc, "upload_failure_log", upload)
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["test failure"]
    )
    assert log_path is not None
    upload.assert_called_once_with(log_path, raise_on_error=True)
    manifest = json.loads(log_path.with_suffix(".json").read_text())
    log = next(item for item in manifest["artifacts"] if item["role"] == "readable_log")
    assert log["remote_subdir_applied"] is False
    assert log["remote_directory"] == "/opt/pipette_assembly_qc_log"
    assert "old" in log["upload_note"].lower()
    assert (
        next(item for item in manifest["artifacts"] if item["role"] == "manifest")[
            "upload_status"
        ]
        == "skipped_unsupported"
    )

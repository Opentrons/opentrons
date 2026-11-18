"""Failure evidence survives incomplete reports and interrupted uploads."""

import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


@pytest.mark.parametrize(
    "tag,code",
    [
        ("pressure-open-air-S0", "PRESSURE_VALUE_OUT_OF_RANGE"),
        ("humidity-S1", "ENVIRONMENT_HUMIDITY_OUT_OF_RANGE"),
        (
            "liquid-probe-50-tip-primary-probe-accuracy",
            "LIQUID_PROBE_ACCURACY_OUT_OF_RANGE",
        ),
    ],
)
def test_failed_measurement_retains_code_without_written_reason(
    tag: str, code: str
) -> None:
    """Original tests that grade values without a reason still export a stable code."""
    report = CSVReport(
        "codes",
        [CSVSection("TEST", [CSVLine(tag, [float, CSVResult])])],
        dont_write_to_disk=True,
    )
    report("TEST", tag, [2.0, CSVResult.FAIL])
    row = next(row for row in qc._failure_report_rows(report) if row["tag"] == tag)
    assert row["error_codes"] == [code]
    assert row["data"] == [2.0, "FAIL"]


@pytest.fixture
def report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> CSVReport:
    """A partial report with graded and raw pressure measurements."""
    monkeypatch.setattr(CSVReport, "parent", property(lambda self: tmp_path))
    result = CSVReport(
        "failure-bundle-test",
        [
            CSVSection(
                "FIXTURE",
                [
                    CSVLine("pressure-check", [float, CSVResult]),
                    CSVLineRepeating(3, "pressure-curve", [float]),
                    CSVLine("not-started", [float, CSVResult]),
                ],
            )
        ],
        run_id="test-run-id",
        dont_write_to_disk=True,
    )
    result("FIXTURE", "pressure-check", [3.5, CSVResult.PASS])
    result("FIXTURE", "pressure-curve", [1.0], 0)
    result("FIXTURE", "pressure-curve", [2.0], 1)
    monkeypatch.setattr(
        qc,
        "_ACTIVE_QC_TRACE",
        SimpleNamespace(
            snapshot=lambda: {
                "run_id": "trace-run-id",
                "identity": {"protocol": {"sha256": "test-sha"}},
                "events": [{"id": 1, "action": "home", "status": "exception"}],
                "last_failure": {"id": 1, "action": "home", "error": "overpressure"},
                "latest_readings": {
                    "pressure": {"value": 3.5, "observed_at": "earlier"}
                },
                "tests": {"diagnostics": {"status": "exception"}},
            }
        ),
        raising=False,
    )
    return result


def test_export_includes_pass_raw_and_unrecorded(report: CSVReport) -> None:
    """Raw samples and empty rows cannot become implicit passes."""
    rows = qc._failure_report_rows(report)
    passed = next(row for row in rows if row["tag"] == "pressure-check")
    raw = [row for row in rows if row["tag"] == "pressure-curve"]
    assert passed["result"] == "PASS"
    assert passed["data"] == [3.5, "PASS"]
    assert [row["data"] for row in raw] == [[1.0], [2.0], [None]]
    assert [row["index"] for row in raw] == [0, 1, 2]
    assert all(row["result"] == "unknown" for row in raw)
    assert raw[-1]["record_status"] == "not_recorded"
    assert all(row["record_status"] == "recorded" for row in raw[:-1])


def test_metadata_failure_preserves_rows_without_creating_report_csv(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Pre-barcode failures retain evidence without inventing a report export."""
    uploaded = []

    def uploader(path: Path, **kwargs: object) -> bool:
        uploaded.append((path, path.read_text()))
        return True

    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", uploader)
    save_report = MagicMock(side_effect=AssertionError("Unexpected report save"))
    monkeypatch.setattr(report, "save_to_disk", save_report)
    (tmp_path / "encoder_debug.csv").write_text("cycle,position\n1,42\n")
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["metadata error"]
    )
    assert log_path is not None
    local = json.loads(log_path.with_suffix(".json").read_text())
    assert local["run_id"] == "trace-run-id"
    assert {item["role"] for item in local["artifacts"]} == {
        "readable_log",
        "manifest",
        "encoder_csv",
    }
    assert all(item["upload_status"] == "uploaded" for item in local["artifacts"])
    assert all(item["run_id"] == "trace-run-id" for item in local["artifacts"])
    assert uploaded[-1][0].suffix == ".json"
    remote = json.loads(uploaded[-1][1])
    remote_manifest = next(
        item for item in remote["artifacts"] if item["role"] == "manifest"
    )
    assert remote_manifest["upload_status"] == "pending_self_upload"
    assert local["trace"]["last_failure"]["action"] == "home"
    assert "test-sha" in log_path.read_text()
    assert not log_path.with_suffix(".csv").exists()
    save_report.assert_not_called()
    assert any(row["tag"] == "pressure-check" for row in local["report_rows"])
    assert log_path.with_suffix(".encoder.csv").read_text() == "cycle,position\n1,42\n"


def test_failure_archive_does_not_rewrite_or_upload_existing_report(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Failure evidence cannot alter the report's bytes, timestamps or upload route."""
    report.set_tag("test-pipette")
    csv_path = report.file_path
    original_contents = str(report)
    csv_path.write_text(original_contents + "\n", encoding="utf-8")
    original_bytes = csv_path.read_bytes()
    original_mtime = csv_path.stat().st_mtime_ns
    original_files = set(tmp_path.glob("*.csv"))
    save_report = MagicMock(side_effect=AssertionError("Unexpected report save"))
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(report, "save_to_disk", save_report)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["test failure"]
    )
    assert log_path is not None and log_path.exists()
    assert log_path.with_suffix(".json").exists()
    save_report.assert_not_called()
    assert str(report) == original_contents
    assert csv_path.read_bytes() == original_bytes
    assert csv_path.stat().st_mtime_ns == original_mtime
    assert set(tmp_path.glob("*.csv")) == original_files
    assert {call.args[0].suffix for call in upload.call_args_list} == {".log", ".json"}


def test_one_upload_failure_does_not_block_other_files_or_replace_qc_error(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """All other files still upload and the original error remains the evidence."""
    uploaded = []

    def uploader(path: Path, **kwargs: object) -> bool:
        uploaded.append(path)
        if path.suffix == ".log":
            raise RuntimeError("test network failure")
        return True

    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", uploader)
    state = qc._QCFailureContext(
        report=report, report_mode="assembly_qc", stage="calibration"
    )
    original = RuntimeError(
        "The pressure sensor on LEFT has exceeded operational limits"
    )
    try:
        raise original
    except RuntimeError as error:
        qc._archive_runtime_failure(MagicMock(), state, error)
        assert error is original
    manifest_path = next(path for path in uploaded if path.suffix == ".json")
    manifest = json.loads(manifest_path.read_text())
    statuses = {item["role"]: item["upload_status"] for item in manifest["artifacts"]}
    assert statuses == {
        "readable_log": "failed",
        "manifest": "uploaded",
    }
    assert "exceeded operational limits" in manifest["exception_traceback"]
    assert any(
        item["category"] == "overpressure" and item["status"] == "needs_confirmation"
        for item in manifest["recommendations"]
    )


def test_old_helper_uploads_log_and_retains_other_attachments(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Old robot installations remain compatible and never claim CSV upload."""
    monkeypatch.delattr(qc.data_center_client, "upload_failure_artifact")
    old_upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc, "upload_failure_log", old_upload)
    log_path = qc._archive_failed_report(
        MagicMock(), report, "assembly_qc", ["test failure"]
    )
    assert log_path is not None
    old_upload.assert_called_once_with(log_path, raise_on_error=True)
    manifest = json.loads(log_path.with_suffix(".json").read_text())
    assert {item["role"]: item["upload_status"] for item in manifest["artifacts"]} == {
        "readable_log": "uploaded",
        "manifest": "skipped_unsupported",
    }


def test_invalid_json_numbers_and_configuration_recommendation(
    report: CSVReport,
) -> None:
    """Missing numeric readings are null and API incompatibility is classified."""
    report("FIXTURE", "pressure-curve", [float("nan")], 2)
    bundle = qc._failure_bundle(
        report,
        "assembly_qc",
        ["TypeError: got an unexpected keyword argument 'barcode_timeout_seconds'"],
        None,
        "metadata",
        {},
        [],
    )
    json.dumps(bundle, allow_nan=False)
    advice = bundle["recommendations"][0]
    assert advice["category"] == "software_configuration"
    assert advice["status"] == "confirmed_configuration_issue"


def test_runtime_failure_distinguishes_unexecuted_and_skipped_tests(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A runtime abort is not a user-selected skip or a passing untested item."""
    trace = qc._QCTrace()
    trace.tests = {
        "diagnostics": {"status": "exception"},
        "liquid": {"status": "not_started"},
        "fixture": {"status": "skipped"},
    }
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", trace)
    monkeypatch.setattr(
        qc.data_center_client, "upload_failure_artifact", lambda *args, **kwargs: True
    )
    state = qc._QCFailureContext(
        report=report, report_mode="assembly_qc", stage="diagnostics"
    )
    qc._archive_runtime_failure(MagicMock(), state, RuntimeError("test abort"))
    assert trace.tests["diagnostics"]["status"] == "exception"
    assert trace.tests["liquid"]["status"] == "not_run_due_to_previous_failure"
    assert trace.tests["fixture"]["status"] == "skipped"


@pytest.mark.parametrize("localized", [True, False])
def test_failure_error_codes_are_language_independent(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, localized: bool
) -> None:
    """Readable labels and machine error categories remain separate."""
    monkeypatch.setattr(qc, "LOCALIZE", localized)
    report("FIXTURE", "pressure-check", [3.5, CSVResult.FAIL])
    report["FIXTURE"]["pressure-check"].add_failure_reason(
        qc._with_error_code(
            qc.QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE, "reading out of range"
        )
    )
    row = next(
        item
        for item in qc._failure_report_rows(report)
        if item["tag"] == "pressure-check"
    )
    assert row["error_codes"] == ["PRESSURE_VALUE_OUT_OF_RANGE"]


@pytest.mark.parametrize("permanent", [True, False])
def test_json_write_failure_still_uploads_saved_evidence(
    report: CSVReport,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    permanent: bool,
) -> None:
    """A failed manifest checkpoint cannot lose a saved log or encoder evidence."""
    (tmp_path / "encoder_debug.csv").write_text("cycle,position\n1,42\n")
    original_write = Path.write_text
    json_attempts = 0
    uploaded = []

    def write(path: Path, *args: object, **kwargs: object) -> int:
        nonlocal json_attempts
        if path.suffix == ".json":
            json_attempts += 1
            if permanent or json_attempts == 1:
                raise PermissionError("test JSON denied")
        return original_write(path, *args, **kwargs)

    def upload(path: Path, **kwargs: object) -> bool:
        uploaded.append(path)
        return True

    monkeypatch.setattr(Path, "write_text", write)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    ctx = MagicMock()
    log_path = qc._archive_failed_report(
        ctx, report, "assembly_qc", ["original QC error"]
    )
    assert log_path is not None and log_path.exists()
    assert "original QC error" in log_path.read_text()
    assert {".log", ".csv"}.issubset({path.suffix for path in uploaded})
    assert json_attempts == 3
    assert any("not_saved" in call.args[0] for call in ctx.comment.call_args_list)
    if permanent:
        assert not any(path.suffix == ".json" for path in uploaded)
    else:
        bundle = json.loads(log_path.with_suffix(".json").read_text())
        manifest = next(
            item for item in bundle["artifacts"] if item["role"] == "manifest"
        )
        assert manifest["save_status"] == "saved"
        assert manifest["upload_status"] == "uploaded"
        assert manifest["save_errors"] == ["PermissionError: test JSON denied"]


@pytest.mark.parametrize(
    "section,tag,expected",
    [
        ("DIAGNOSTICS", "pressure-open-air-S0", "diagnostic_pressure"),
        ("DIAGNOSTICS", "pressure-sealed-S0", "diagnostic_pressure"),
        ("DIAGNOSTICS", "pressure-compressed-S1", "diagnostic_pressure"),
        ("FIXTURE", "pressure-holding", "pressure_fixture"),
        ("DIAGNOSTICS", "celsius-S0", "environment"),
        ("DIAGNOSTICS", "humidity-S1", "environment"),
    ],
)
def test_recommendations_distinguish_pressure_context_and_environment(
    section: str, tag: str, expected: str
) -> None:
    """Diagnostics pressure failures do not become fixture leak diagnoses."""
    advice = qc._failure_recommendations(
        [
            {
                "evidence_id": f"{section}/{tag}[0]",
                "section": section,
                "tag": tag,
                "failure_reasons": [],
                "result": "FAIL",
            },
        ],
        [],
        None,
    )
    assert advice[0]["category"] == expected
    assert advice[0]["status"] == "needs_confirmation"


def test_reference_plunger_travel_needs_configuration_check() -> None:
    """A software precondition in a reference step is not a confirmed bad part."""
    advice = qc._failure_recommendations(
        [], ["Reference 50 uL: insufficient plunger travel"], None
    )
    assert advice[0]["category"] == "plunger_travel_setup"
    assert advice[0]["status"] == "needs_confirmation"
    assert "预充气参数" in advice[0]["next_checks"][0]

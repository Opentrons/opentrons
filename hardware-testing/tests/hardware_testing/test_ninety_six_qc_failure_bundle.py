"""96-channel failure evidence stays independent of the formal QC report."""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Any, Callable, Dict, List
from unittest.mock import MagicMock

import pytest

from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


@pytest.fixture(autouse=True)
def isolated_archive(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Every test has local storage and transports that cannot contact a server."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(CSVReport, "parent", property(lambda self: tmp_path))
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", None, raising=False)
    monkeypatch.setattr(qc, "upload_failure_log", MagicMock(return_value=True))
    monkeypatch.setattr(
        qc.data_center_client,
        "upload_data_to_google_drive",
        MagicMock(return_value=True),
    )
    monkeypatch.setattr(
        qc.data_center_client, "upload_failure_artifact", MagicMock(return_value=True)
    )
    monkeypatch.setattr(
        qc.data_center_client,
        "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED",
        True,
        raising=False,
    )


@pytest.fixture
def report() -> CSVReport:
    """Use real CSV objects, including repeated, raw, failed and unrecorded rows."""
    result = CSVReport(
        "ninety-six-failure-test",
        [
            CSVSection(
                "PRESSURE",
                [
                    CSVLine("pressure-air-A1", [float, CSVResult]),
                    CSVLine("pressure-closed-H12", [float, CSVResult]),
                    CSVLineRepeating(3, "pressure-samples", [float]),
                    CSVLine("not-started", [float, CSVResult]),
                ],
            )
        ],
        run_id="run-26-10-29-03-16-26",
        dont_write_to_disk=True,
    )
    result.set_device_id("P1K96-TEST", "P1K96-TEST")
    result("META_DATA", "test_time_utc", ["2026/10/29-03:16:26"])
    result.set_tag("P1K96-TEST")
    result("PRESSURE", "pressure-air-A1", [3.5, CSVResult.PASS])
    result("PRESSURE", "pressure-closed-H12", [7.5, CSVResult.FAIL])
    result["PRESSURE"]["pressure-closed-H12"].add_failure_reason(
        "pressure outside the original strict limits"
    )
    result("PRESSURE", "pressure-samples", [1.0], 0)
    result("PRESSURE", "pressure-samples", [2.0], 1)
    return result


def _state(report: CSVReport, stage: str = "result-summary") -> qc._QCFailureContext:
    """Keep the existing execution-state contract used by the protocol."""
    return qc._QCFailureContext(
        report=report,
        stage=stage,
        parameters={"pip_size": "1000", "skip_encoder": True},
        completed_sections=["PRESSURE"],
    )


def _manifest(path: Path) -> Dict[str, Any]:
    """Read the local JSON checkpoint saved next to its readable log."""
    return json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))


def test_export_preserves_pass_fail_raw_and_missing_rows(report: CSVReport) -> None:
    """Evidence does not turn a raw sample or missing result into an implicit pass."""
    rows = qc._failure_report_rows(report)
    passed = next(row for row in rows if row["tag"] == "pressure-air-A1")
    failed = next(row for row in rows if row["tag"] == "pressure-closed-H12")
    raw = [row for row in rows if row["tag"] == "pressure-samples"]
    missing = next(row for row in rows if row["tag"] == "not-started")
    assert passed["result"] == "PASS"
    assert passed["data"] == [3.5, "PASS"]
    assert failed["result"] == "FAIL"
    assert failed["data"] == [7.5, "FAIL"]
    assert failed["failure_reasons"] == ["pressure outside the original strict limits"]
    assert [row["data"] for row in raw] == [[1.0], [2.0], [None]]
    assert [row["index"] for row in raw] == [0, 1, 2]
    assert len({row["evidence_id"] for row in raw}) == 3
    assert all(row["result"] == "unknown" for row in raw)
    assert [row["record_status"] for row in raw] == [
        "recorded",
        "recorded",
        "not_recorded",
    ]
    assert missing["record_status"] == "not_recorded"
    assert missing["result"] == "unknown"


def test_real_96_report_exports_every_section_without_regrading() -> None:
    """Actual 96-channel row builders are supported without rewriting values."""
    result = qc.build_report("ninety-six-real-schema-test")
    result("ENCODER", "encoder-96-cycles", [2, CSVResult.FAIL])
    result("ENCODER", "encoder-96-abs-avg-error", [float("inf"), CSVResult.FAIL])
    before = str(result)
    rows = qc._failure_report_rows(result)
    assert {section.value for section in qc.TestSection}.issubset(
        {row["section"] for row in rows}
    )
    encoded = next(row for row in rows if row["tag"] == "encoder-96-abs-avg-error")
    assert encoded["data"] == [None, "FAIL"]
    assert encoded["result"] == "FAIL"
    json.dumps(rows, allow_nan=False)
    assert str(result) == before


def test_bundle_uploads_log_json_encoder_to_one_serial_utc_directory(
    report: CSVReport, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """All attachments refer to one report and JSON honestly records self-upload."""
    trace = qc._QCTrace()
    trace.identity = {"protocol": {"sha256": "executed-protocol-sha"}}
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", trace)
    encoder_bytes = b"cycle,encoder position,motor position\n1,42,41\n"
    (tmp_path / "encoder_debug.csv").write_bytes(encoder_bytes)
    uploaded: List[Any] = []

    def upload(path: Path, **kwargs: Any) -> bool:
        uploaded.append((path, kwargs, path.read_bytes()))
        return True

    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    path = qc._archive_failure_log(MagicMock(), _state(report))
    assert path is not None
    bundle = _manifest(path)
    assert bundle["schema_version"] == 1
    assert bundle["runtime_error"] is None
    assert bundle["stage"] == "result-summary"
    assert bundle["parameters"]["pip_size"] == "1000"
    assert bundle["run_id"] == trace.run_id
    assert "executed-protocol-sha" in path.read_text()
    assert path.with_suffix(".encoder.csv").read_bytes() == encoder_bytes
    assert {item["role"] for item in bundle["artifacts"]} == {
        "readable_log",
        "manifest",
        "encoder_csv",
    }
    child = "P1K96-TEST_20261029T031626Z"
    assert bundle["archive_directory"]["remote_subdir"] == child
    assert len(uploaded) == 3
    assert uploaded[-1][0].suffix == ".json"
    for _, kwargs, _ in uploaded:
        assert kwargs == {"raise_on_error": True, "remote_subdir": child}
    assert all(item["upload_status"] == "uploaded" for item in bundle["artifacts"])
    assert all(item["run_id"] == trace.run_id for item in bundle["artifacts"])
    remote_copy = json.loads(uploaded[-1][2])
    assert (
        next(item for item in remote_copy["artifacts"] if item["role"] == "manifest")[
            "upload_status"
        ]
        == "pending_self_upload"
    )


def test_ordinary_fail_does_not_save_change_or_upload_formal_csv(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The established formal-report output route and saved bytes remain intact."""
    formal_path = report.file_path
    original_report = str(report)
    formal_path.write_text(original_report + "\n", encoding="utf-8")
    original_bytes = formal_path.read_bytes()
    original_mtime = formal_path.stat().st_mtime_ns
    save = MagicMock(side_effect=AssertionError("Unexpected report save"))
    monkeypatch.setattr(report, "save_to_disk", save)
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    path = qc._archive_failure_log(MagicMock(), _state(report))
    assert path is not None
    save.assert_not_called()
    assert str(report) == original_report
    assert formal_path.read_bytes() == original_bytes
    assert formal_path.stat().st_mtime_ns == original_mtime
    assert {call.args[0].suffix for call in upload.call_args_list} == {".log", ".json"}


def test_metadata_failure_keeps_mismatch_and_no_formal_csv(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The actual serial, failed scanned value and incomplete metadata survive."""
    report.set_device_id("P1K96-TEST", "WRONG-SCAN")
    report._file_name = None
    save = MagicMock(side_effect=RuntimeError("must set tag before saving"))
    monkeypatch.setattr(report, "save_to_disk", save)
    path = qc._archive_failure_log(
        MagicMock(),
        _state(report, "metadata-verification"),
        ValueError("barcode mismatch"),
    )
    assert path is not None
    bundle = _manifest(path)
    metadata = next(
        row for row in bundle["report_rows"] if row["tag"] == "test_device_id"
    )
    assert metadata["data"] == ["P1K96-TEST", "WRONG-SCAN", "FAIL"]
    assert bundle["archive_directory"]["remote_subdir"] == "P1K96-TEST_20261029T031626Z"
    assert bundle["runtime_error"]["type"] == "ValueError"
    assert "barcode mismatch" in bundle["exception_traceback"]
    assert not path.with_suffix(".csv").exists()
    save.assert_called_once_with()


def test_runtime_checkpoint_once_and_upload_failure_never_masks_original(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Even a failed attachment upload cannot replace a live QC exception."""
    save = MagicMock()
    monkeypatch.setattr(report, "save_to_disk", save)
    uploaded: List[Path] = []

    def upload(path: Path, **kwargs: Any) -> bool:
        uploaded.append(path)
        if path.suffix == ".log":
            raise OSError("network disconnected")
        return True

    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    original = RuntimeError("LEFT pressure sensor exceeded operational limits")

    def failing_run(ctx: Any, state: qc._QCFailureContext) -> List[str]:
        state.report = report
        state.stage = "PRESSURE"
        qc._qc_initialize_tests({"pip_size": "1000", "skip_encoder": True})
        qc._ACTIVE_QC_TRACE.tests["PRESSURE"]["status"] = "exception"
        raise original

    monkeypatch.setattr(qc, "_run_qc", failing_run)
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    with pytest.raises(RuntimeError) as raised:
        qc.run(ctx)
    assert raised.value is original
    save.assert_called_once_with()
    assert [path.suffix for path in uploaded] == [".log", ".json"]
    bundle = json.loads(uploaded[-1].read_text())
    assert bundle["runtime_error"]["message"] == str(original)
    assert "LEFT pressure sensor exceeded" in bundle["exception_traceback"]
    tests = bundle["trace"]["tests"]
    assert tests["PRESSURE"]["status"] == "exception"
    assert tests["ENCODER"]["status"] == "skipped_by_configuration"
    assert tests["DROPLETS"]["status"] == "not_run_due_to_previous_failure"
    assert tests["DROPLETS"]["blocking_stage"] == "PRESSURE"
    assert {item["role"]: item["upload_status"] for item in bundle["artifacts"]} == {
        "readable_log": "failed",
        "manifest": "uploaded",
    }


def test_startup_failure_without_report_retains_unknown_serial(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Failures before metadata still have a distinct archive and original error."""
    state = qc._QCFailureContext(stage="instrument-setup")
    monkeypatch.setattr(
        qc, "_failure_log_path", lambda report: tmp_path / "startup.log"
    )
    path = qc._archive_failure_log(MagicMock(), state, ValueError("instrument missing"))
    assert path is not None
    bundle = _manifest(path)
    assert bundle["report_rows"] == []
    assert bundle["report_run_id"] is None
    assert bundle["archive_directory"]["remote_subdir"].startswith("unknown-SN_")
    assert bundle["runtime_error"]["message"] == "instrument missing"


def test_legacy_log_only_uploader_keeps_signature_and_manifest(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An older installed helper uploads its log without claiming JSON support."""
    monkeypatch.delattr(qc.data_center_client, "upload_failure_artifact")
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc, "upload_failure_log", upload)
    path = qc._archive_failure_log(MagicMock(), _state(report))
    assert path is not None
    upload.assert_called_once_with(path, raise_on_error=True)
    assert {
        item["role"]: item["upload_status"] for item in _manifest(path)["artifacts"]
    } == {"readable_log": "uploaded", "manifest": "skipped_unsupported"}


def test_legacy_artifact_uploader_does_not_receive_new_keyword(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Directory grouping is negotiated before calling old helper versions."""
    monkeypatch.delattr(
        qc.data_center_client, "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED"
    )
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    path = qc._archive_failure_log(MagicMock(), _state(report))
    assert path is not None
    assert upload.call_count == 2
    assert all(
        call.kwargs == {"raise_on_error": True} for call in upload.call_args_list
    )
    assert all(
        item["remote_subdir_applied"] is False for item in _manifest(path)["artifacts"]
    )


@pytest.mark.parametrize("permanent", [False, True])
def test_json_write_failure_still_uploads_independently_saved_evidence(
    report: CSVReport, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, permanent: bool
) -> None:
    """A manifest checkpoint error cannot discard the readable and encoder files."""
    (tmp_path / "encoder_debug.csv").write_text("cycle,position\n1,42\n")
    original_write = Path.write_text
    json_attempts = 0

    def write(path: Path, *args: Any, **kwargs: Any) -> int:
        nonlocal json_attempts
        if path.suffix == ".json":
            json_attempts += 1
            if permanent or json_attempts == 1:
                raise PermissionError("JSON checkpoint denied")
        return original_write(path, *args, **kwargs)

    monkeypatch.setattr(Path, "write_text", write)
    upload = MagicMock(return_value=True)
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    path = qc._archive_failure_log(MagicMock(), _state(report))
    assert path is not None and path.exists()
    suffixes = {call.args[0].suffix for call in upload.call_args_list}
    assert {".log", ".csv"}.issubset(suffixes)
    assert (".json" in suffixes) is not permanent
    assert json_attempts >= 2


@pytest.mark.parametrize("serial", ["P1K96-TEST", "SN/123", "../SN $(x)", None])
def test_archive_directory_uses_report_utc_and_actual_serial(serial: Any) -> None:
    """Serial-derived paths stay one safe component and ignore scanned barcodes."""
    bundle = {
        "report_rows": [
            {
                "section": "META_DATA",
                "tag": "test_device_id",
                "data": [serial, "WRONG", "FAIL"],
            },
            {
                "section": "META_DATA",
                "tag": "test_time_utc",
                "data": ["2026/10/29-03:16:26"],
            },
        ],
        "report_run_id": "run-26-10-28-00-00-00",
        "created_at_utc": "2026-10-30T04:05:06+00:00",
        "trace": {"identity": {"actual_pipettes": {"LEFT": {"serial": "LEFT96"}}}},
    }
    directory = qc._failure_archive_directory(bundle)
    assert re.fullmatch(r"[A-Za-z0-9_.-]+", directory["remote_subdir"])
    assert directory["remote_subdir"].endswith("_20261029T031626Z")
    assert directory["serial_number"] == (serial or "LEFT96")
    assert directory["timestamp_source"] == "report.test_time_utc"


def test_simulation_never_builds_archive_or_initializes_hardware(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Real analysis setup declares labware without live QC or failure files."""
    args = {f"skip_{s.value.lower().replace('-', '_')}": False for s in qc.TestSection}
    args["pip_size"] = "1000"
    ctx = MagicMock()
    ctx.is_simulating.return_value = True
    ctx.params.get_all.return_value = args
    ctx.params.pip_size = "1000"
    load_pipette = MagicMock()
    load_labware = MagicMock()
    archive = MagicMock(side_effect=AssertionError("simulation archive"))
    identity = MagicMock(side_effect=AssertionError("simulation hardware trace"))
    monkeypatch.setattr(qc, "_load_analysis_pipette", load_pipette)
    monkeypatch.setattr(qc, "_load_analysis_labware", load_labware)
    monkeypatch.setattr(qc, "_archive_failure_log", archive)
    monkeypatch.setattr(qc, "_qc_capture_identity", identity)
    qc.run(ctx)
    load_pipette.assert_called_once_with(ctx, 1000)
    load_labware.assert_called_once()
    ctx._core.get_hardware.assert_not_called()
    archive.assert_not_called()
    identity.assert_not_called()


@pytest.mark.parametrize("operator", ["Unused", "QC-operator"])
def test_normal_qc_failure_uploads_once_for_any_operator(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch, operator: str
) -> None:
    """Failure evidence follows CSV completion and contains its upload diagnostics."""
    save = MagicMock()
    monkeypatch.setattr(report, "save_to_disk", save)
    operations: List[str] = []
    artifacts: List[Path] = []
    upload_message = "Upload record_id=record-96; stage=complete; status=success"

    def upload_report(
        path: Path, *, direct_upload: bool, progress_callback: Callable[[str], None]
    ) -> bool:
        assert path == report.file_path
        assert direct_upload is True
        assert not operations
        operations.append("csv-started")
        progress_callback(upload_message)
        operations.append("csv-finished")
        return True

    def upload_artifact(path: Path, **kwargs: Any) -> bool:
        if operator != "Unused":
            assert operations[:2] == ["csv-started", "csv-finished"]
        artifacts.append(path)
        operations.append(path.suffix)
        return True

    formal = MagicMock(side_effect=upload_report)
    monkeypatch.setattr(qc.data_center_client, "upload_data_to_google_drive", formal)
    monkeypatch.setattr(
        qc.data_center_client,
        "upload_failure_artifact",
        MagicMock(side_effect=upload_artifact),
    )

    def completed_run(ctx: Any, state: qc._QCFailureContext) -> List[str]:
        state.report = report
        state.parameters = {"operator": operator}
        state.stage = "result-summary"
        return ["PRESSURE/pressure-closed-H12"]

    monkeypatch.setattr(qc, "_run_qc", completed_run)
    archive = MagicMock(wraps=qc._archive_failure_log)
    monkeypatch.setattr(qc, "_archive_failure_log", archive)
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    with pytest.raises(RuntimeError, match="QC failed items"):
        qc.run(ctx)
    archive.assert_called_once()
    save.assert_not_called()
    qc.data_center_client.upload_failure_artifact.assert_called()
    assert formal.call_count == int(operator != "Unused")
    assert operations == (
        ([] if operator == "Unused" else ["csv-started", "csv-finished"])
        + [".log", ".json"]
    )
    bundle = json.loads(artifacts[-1].read_text())
    assert bundle["stage"] == "result-summary"
    if operator != "Unused":
        assert upload_message in json.dumps(bundle["trace"])


def test_successful_run_does_not_archive_failure_evidence(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Adding failure uploads does not create uploads for a passing run."""
    monkeypatch.setattr(qc, "_run_qc", MagicMock(return_value=[]))
    archive = MagicMock()
    monkeypatch.setattr(qc, "_archive_failure_log", archive)
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    qc.run(ctx)
    archive.assert_not_called()
    qc.data_center_client.upload_failure_artifact.assert_not_called()

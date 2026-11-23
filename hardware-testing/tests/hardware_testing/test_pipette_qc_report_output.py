"""Failure evidence leaves the original QC report save and upload path intact."""

from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock, Mock

import pytest

from opentrons.types import Point

from hardware_testing.data.csv_report import CSVLine, CSVReport, CSVResult, CSVSection
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


@pytest.fixture
def report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> CSVReport:
    """Use the real serializer and explicit save with no automatic fixture writes."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", None)
    result = CSVReport(
        "report-output-test",
        [
            CSVSection(
                qc.TestSection.DIAGNOSTICS.value,
                [CSVLine("pressure-open-air-S0", [float, CSVResult])],
            )
        ],
        run_id="report-run-id",
        validate_meta_data=False,
        dont_write_to_disk=True,
    )
    result.set_tag("P1000M-test")
    return result


@pytest.mark.parametrize("mode", ["assembly_qc", "current_speed"])
@pytest.mark.parametrize("operator", ["Unused", "selected-operator"])
@pytest.mark.parametrize("failed", [False, True])
def test_run_keeps_original_report_save_and_operator_upload(
    report: CSVReport,
    monkeypatch: pytest.MonkeyPatch,
    mode: str,
    operator: str,
    failed: bool,
) -> None:
    """Both QC modes keep one final save and the original operator upload gate."""
    section = qc.TestSection.DIAGNOSTICS
    report(
        section.value,
        "pressure-open-air-S0",
        [3.5, CSVResult.FAIL if failed else CSVResult.PASS],
    )
    expected_csv = (str(report) + "\n").encode()
    save = Mock(wraps=report.save_to_disk)
    monkeypatch.setattr(report, "save_to_disk", save)
    test_run = Mock()
    monkeypatch.setattr(qc, "TESTS", [(section, test_run)])
    monkeypatch.setattr(qc, "test_current_speed", test_run)
    monkeypatch.setattr(qc, "build_report", Mock(return_value=report))
    monkeypatch.setattr(qc, "build_current_speed_report", Mock(return_value=report))
    monkeypatch.setattr(qc, "OT3API", SimpleNamespace())
    for name in (
        "log_input_versions",
        "_load_labware_locations",
        "_preflight_devices",
        "_reset_available_tip",
        "store_config",
    ):
        monkeypatch.setattr(qc, name, Mock())
    monkeypatch.setattr(qc.helpers_ot3, "set_csv_report_meta_data_ot3", Mock())
    monkeypatch.setattr(
        qc.helpers_ot3, "_get_serial_for_dut", Mock(return_value="P1000M-test")
    )
    monkeypatch.setattr(
        qc.helpers_ot3,
        "get_slot_top_left_position_ot3",
        Mock(return_value=Point(1, 2, 3)),
    )
    google_upload = Mock(return_value=True)
    monkeypatch.setattr(qc, "upload_data_to_google_drive", google_upload)
    failure_upload = Mock(return_value=True)
    monkeypatch.setattr(
        qc.data_center_client, "upload_failure_artifact", failure_upload
    )
    args = {
        "qc_mode": mode,
        "operator": operator,
        "pipette_type": "flex_8channel_1000",
        "skip_diagnostics": False,
        "fixture_side": "left",
        "aspirate_sample_count": 3,
        "slot_tip_rack_1000": 1,
        "slot_tip_rack_200": 2,
        "slot_tip_rack_50": 3,
        "slot_reservoir": 4,
        "slot_plate": 5,
        "slot_fixture": 6,
        "slot_trash": 7,
        "num_trials": 2,
        "droplet_wait_seconds": 30,
    }
    ctx = MagicMock()
    ctx.params = SimpleNamespace(**args, get_all=lambda: dict(args))
    ctx.is_simulating.return_value = False
    ctx._core.get_hardware.return_value.gantry_position.return_value = Point(1, 2, 3)
    state = qc._QCFailureContext()

    failures, assembly_skipped = qc._run_qc(ctx, state)

    assert bool(failures) is failed
    assert assembly_skipped is False
    assert state.completed_modes == [mode]
    test_run.assert_called_once()
    save.assert_called_once_with()
    assert report.file_path.read_bytes() == expected_csv
    assert list(report.parent.glob("*.csv")) == [report.file_path]
    if operator == "Unused":
        google_upload.assert_not_called()
    else:
        google_upload.assert_called_once_with(report.file_path)
    archived_paths = [call.args[0] for call in failure_upload.call_args_list]
    assert {path.suffix for path in archived_paths} == (
        {".log", ".json"} if failed else set()
    )
    assert report.file_path not in archived_paths


def test_runtime_checkpoint_survives_failure_log_write_error(
    report: CSVReport, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A broken evidence log cannot prevent the original partial report save."""
    report(qc.TestSection.DIAGNOSTICS.value, "pressure-open-air-S0", [3.5, None])
    expected_csv = (str(report) + "\n").encode()
    save = Mock(wraps=report.save_to_disk)
    monkeypatch.setattr(report, "save_to_disk", save)
    write_text = Path.write_text

    def fail_log_write(path: Path, *args: Any, **kwargs: Any) -> int:
        if path.suffix == ".log":
            raise OSError("test failure log unavailable")
        return write_text(path, *args, **kwargs)

    monkeypatch.setattr(Path, "write_text", fail_log_write)
    failure_upload = Mock(return_value=True)
    monkeypatch.setattr(
        qc.data_center_client, "upload_failure_artifact", failure_upload
    )
    state = qc._QCFailureContext(
        report=report, report_mode="assembly_qc", stage="diagnostics"
    )
    ctx = MagicMock()
    original = RuntimeError("original hardware failure")

    qc._archive_runtime_failure(ctx, state, original)

    save.assert_called_once_with()
    assert report.file_path.read_bytes() == expected_csv
    failure_upload.assert_not_called()
    assert any(
        "test failure log unavailable" in call.args[0]
        for call in ctx.comment.call_args_list
    )

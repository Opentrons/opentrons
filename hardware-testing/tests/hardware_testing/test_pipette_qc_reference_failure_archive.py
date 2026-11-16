"""Right-reference failures upload evidence into the existing DUT report folder."""

import json
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock, Mock

import pytest

from opentrons.hardware_control.types import OT3Mount
from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVSection
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


@pytest.fixture
def setup(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    """Use real report rows with local storage and mocked hardware/transports."""
    monkeypatch.setattr(CSVReport, "parent", property(lambda self: tmp_path))
    cfg = SimpleNamespace(
        pipette_volume=1000, pipette_channels=1, simulate=False, mount=OT3Mount.LEFT
    )
    report = CSVReport(
        "reference-archive-test",
        [CSVSection("LIQUID-PROBE", qc.build_liquid_probe_csv_lines(cfg))],
        run_id="run-26-10-30-03-16-26",
        dont_write_to_disk=True,
    )
    report.set_device_id("LEFT-DUT", "LEFT-DUT")
    report.set_tag("LEFT-DUT")
    report("META_DATA", "test_time_utc", ["2026/10/30-03:16:26"])
    save = Mock(side_effect=AssertionError("Unexpected formal CSV save"))
    monkeypatch.setattr(report, "save_to_disk", save)
    ctx, api = MagicMock(), MagicMock()
    ctx.is_simulating.return_value = False
    ctx.params.get_all.return_value = {"operator": "Unused", "pipette_type": "test"}
    api.hardware_pipettes = {
        qc.REFERENCE_MOUNT.to_mount(): SimpleNamespace(pipette_id="RIGHT-REFERENCE")
    }
    api.get_instrument_offset.return_value = SimpleNamespace(offset=[0.1, 0.2, 0.3])
    monkeypatch.setattr(qc, "_verify_reference_instrument", Mock())
    dut = Mock(side_effect=AssertionError("DUT must not run without a reference"))
    monkeypatch.setattr(qc, "_measure_dut_trials", dut)
    trace = qc._QCTrace()
    trace.identity = {
        "actual_pipettes": {
            "LEFT": {"serial": "LEFT-DUT"},
            "RIGHT": {"serial": "RIGHT-REFERENCE"},
        }
    }
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", trace)
    monkeypatch.setattr(qc, "FINAL_TEST_FAIL_INFOR", [])
    uploads = []

    def upload(path: Path, **kwargs: Any) -> bool:
        uploads.append((path, kwargs, path.read_bytes()))
        return True

    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", upload)
    monkeypatch.setattr(
        qc.data_center_client, "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED", True
    )
    monkeypatch.setattr(
        qc, "upload_failure_log", Mock(side_effect=AssertionError("Legacy transport"))
    )
    return SimpleNamespace(
        cfg=cfg,
        report=report,
        ctx=ctx,
        api=api,
        trace=trace,
        uploads=uploads,
        save=save,
        dut=dut,
        parent=tmp_path,
    )


def test_handled_failures_upload_at_summary_without_overwriting_snapshots(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """All tip failures retain separate snapshots in the same left-SN/UTC folder."""
    formal_path = setup.report.file_path
    formal_path.write_text("original formal CSV\n")
    original_stat = formal_path.stat()
    (setup.parent / "encoder_debug.csv").write_text("cycle,position\n1,42\n")
    calls = []

    def measure(api: Any, ctx: Any, cfg: Any, volume: int) -> float:
        assert not setup.uploads
        assert len(list(setup.parent.glob("*.right-reference-*.json"))) == len(calls)
        calls.append(volume)
        qc._qc_observe("liquid_reference_step", mount=OT3Mount.RIGHT, z_mm=97.1)
        try:
            raise ValueError("unstable pressure baseline")
        except ValueError as cause:
            raise qc._ReferenceProbeError(
                f"RIGHT / {volume}: reference failed"
            ) from cause

    monkeypatch.setattr(qc, "_measure_reference", measure)
    qc.test_liquid_probe_new(
        setup.api, setup.report, "LIQUID-PROBE", setup.ctx, setup.cfg
    )
    assert calls == [50, 200, 1000]
    child = "LEFT-DUT_20261030T031626Z"
    assert not setup.uploads
    snapshots = list(setup.parent.glob("*.right-reference-*.json"))
    for path in snapshots:
        bundle = json.loads(path.read_bytes())
        assert bundle["archive_directory"]["remote_subdir"] == child
        assert bundle["runtime_error"] is None
        assert "unstable pressure baseline" in bundle["exception_traceback"]
        assert (
            bundle["trace"]["identity"]["actual_pipettes"]["RIGHT"]["serial"]
            == "RIGHT-REFERENCE"
        )
        assert all(item["upload_status"] == "pending" for item in bundle["artifacts"])
    assert len(snapshots) == 3
    assert {path.stem.rsplit(".", 1)[-1] for path in snapshots} == {
        "right-reference-50ul",
        "right-reference-200ul",
        "right-reference-1000ul",
    }
    for volume in calls:
        row = setup.report["LIQUID-PROBE"][f"liquid-probe-{volume}-tip-primary-probe"]
        assert row.result is CSVResult.FAIL
        assert row.failure_reasons
    events = [e for e in setup.trace.events if e["action"] == "right_reference_failure"]
    assert [e["tip_volume_ul"] for e in events] == calls
    assert all(e["mount"] == "RIGHT" and e["handled"] for e in events)
    local_before_summary = {
        path.with_suffix(".log"): path.with_suffix(".log").read_bytes()
        for path in snapshots
    }
    summary = qc._archive_failed_report(
        setup.ctx, setup.report, "assembly_qc", ["summary"]
    )
    assert summary == formal_path.with_suffix(".log")
    assert len(setup.uploads) == 12
    for path, kwargs, data in setup.uploads:
        assert kwargs == {"raise_on_error": True, "remote_subdir": child}
        assert path != formal_path
    assert not setup.report._qc_pending_reference_failures
    # Re-entering the summary archive must not transfer the reference files twice.
    qc._archive_failed_report(setup.ctx, setup.report, "assembly_qc", ["summary"])
    assert len(setup.uploads) == 15
    assert all(path.read_bytes() == data for path, data in local_before_summary.items())
    setup.save.assert_not_called()
    setup.dut.assert_not_called()
    assert formal_path.read_text() == "original formal CSV\n"
    assert formal_path.stat().st_mtime_ns == original_stat.st_mtime_ns


def test_fatal_height_error_keeps_original_exception_and_runtime_archive(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A bad start height gets its right snapshot and the existing abort archive."""
    error = ValueError("RIGHT: invalid probe start height: 97.10775")
    measure = Mock(side_effect=error)
    monkeypatch.setattr(qc, "_measure_reference", measure)

    def checkpoint_saved() -> None:
        assert not setup.uploads
        assert len(list(setup.parent.glob("*.right-reference-*.json"))) == 1

    checkpoint = Mock(side_effect=checkpoint_saved)
    monkeypatch.setattr(setup.report, "save_to_disk", checkpoint)

    def run_qc(ctx: Any, state: qc._QCFailureContext) -> Any:
        state.report = setup.report
        state.config = setup.cfg
        state.report_mode = "assembly_qc"
        state.stage = "LIQUID-PROBE"
        qc.test_liquid_probe_new(
            setup.api, setup.report, "LIQUID-PROBE", ctx, setup.cfg
        )
        raise AssertionError("Fatal reference failure must abort")

    monkeypatch.setattr(qc, "_run_qc", run_qc)
    with pytest.raises(ValueError) as raised:
        qc.run(setup.ctx)
    assert raised.value is error
    measure.assert_called_once()
    setup.dut.assert_not_called()
    checkpoint.assert_called_once_with()
    manifests = [
        json.loads(data) for path, _, data in setup.uploads if path.suffix == ".json"
    ]
    assert [bundle["stage"] for bundle in manifests] == [
        "right-reference-50ul",
        "LIQUID-PROBE",
    ]
    for bundle in manifests:
        assert (
            bundle["archive_directory"]["remote_subdir"] == "LEFT-DUT_20261030T031626Z"
        )
        assert bundle["runtime_error"]["type"] == "ValueError"
        assert "invalid probe start height" in bundle["exception_traceback"]


@pytest.mark.parametrize("fatal", [False, True])
def test_transport_failure_does_not_change_reference_test_flow(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch, fatal: bool
) -> None:
    """Offline snapshots remain local; continue/abort follows the original error."""
    error = ValueError("bad height") if fatal else qc._ReferenceProbeError("no liquid")
    measure = Mock(side_effect=error)
    monkeypatch.setattr(qc, "_measure_reference", measure)
    uploader = Mock(side_effect=OSError("server offline"))
    monkeypatch.setattr(qc.data_center_client, "upload_failure_artifact", uploader)
    if fatal:
        with pytest.raises(ValueError) as raised:
            qc.test_liquid_probe_new(
                setup.api, setup.report, "LIQUID-PROBE", setup.ctx, setup.cfg
            )
        assert raised.value is error
    else:
        qc.test_liquid_probe_new(
            setup.api, setup.report, "LIQUID-PROBE", setup.ctx, setup.cfg
        )
    expected = 1 if fatal else 3
    assert measure.call_count == expected
    uploader.assert_not_called()
    qc._archive_failed_report(setup.ctx, setup.report, "assembly_qc", ["summary"])
    assert uploader.call_count == (expected + 1) * 2
    manifests = list(setup.parent.glob("*.right-reference-*.json"))
    assert len(manifests) == expected
    for path in manifests:
        bundle = json.loads(path.read_text())
        assert all(item["upload_status"] == "failed" for item in bundle["artifacts"])
    setup.save.assert_not_called()


def test_snapshot_failure_never_replaces_reference_exception(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An unexpected archiver exception cannot stop a recoverable reference test."""
    archive = Mock(side_effect=RuntimeError("archive unavailable"))
    monkeypatch.setattr(qc, "_archive_failed_report", archive)
    monkeypatch.setattr(
        qc, "_measure_reference", Mock(side_effect=qc._ReferenceProbeError("no liquid"))
    )
    qc.test_liquid_probe_new(
        setup.api, setup.report, "LIQUID-PROBE", setup.ctx, setup.cfg
    )
    assert archive.call_count == 3
    setup.dut.assert_not_called()


def test_simulated_reference_failure_does_not_archive(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Simulation does not create or upload reference evidence."""
    setup.cfg.simulate = True
    archive = Mock()
    monkeypatch.setattr(qc, "_archive_failed_report", archive)
    qc._archive_reference_failure(
        setup.ctx, setup.report, setup.cfg, 50, ValueError("test")
    )
    archive.assert_not_called()


def test_successful_references_keep_dut_trials_without_failure_upload(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Valid references retain the existing per-volume DUT tests and grades."""
    monkeypatch.setattr(qc, "_measure_reference", Mock(return_value=90.0))
    setup.dut.side_effect = None
    setup.dut.return_value = {qc.InstrumentProbeType.PRIMARY: [90.0, 90.0, 90.0]}
    qc.test_liquid_probe_new(
        setup.api, setup.report, "LIQUID-PROBE", setup.ctx, setup.cfg
    )
    assert setup.dut.call_count == 3
    assert not setup.uploads
    for volume in (50, 200, 1000):
        row = setup.report["LIQUID-PROBE"][f"liquid-probe-{volume}-tip-primary-probe"]
        assert row.result is CSVResult.PASS
    setup.save.assert_not_called()


def test_pending_uploads_survive_summary_write_failure(
    setup: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Local reference evidence still uploads if the final summary cannot be saved."""
    qc._archive_reference_failure(
        setup.ctx, setup.report, setup.cfg, 50, ValueError("bad height")
    )
    assert not setup.uploads
    monkeypatch.setattr(
        qc, "_failure_log_path", Mock(side_effect=OSError("disk error"))
    )
    assert (
        qc._archive_failed_report(setup.ctx, setup.report, "assembly_qc", ["summary"])
        is None
    )
    assert len(setup.uploads) == 2
    assert not setup.report._qc_pending_reference_failures


def test_pending_uploads_are_scoped_to_their_report(setup: SimpleNamespace) -> None:
    """Archiving another report cannot prematurely upload the reference snapshot."""
    qc._archive_reference_failure(
        setup.ctx, setup.report, setup.cfg, 50, ValueError("bad height")
    )
    qc._upload_pending_reference_failures(setup.ctx, None)
    qc._upload_pending_reference_failures(setup.ctx, SimpleNamespace())
    assert not setup.uploads
    qc._archive_failed_report(setup.ctx, setup.report, "assembly_qc", ["summary"])
    assert len(setup.uploads) == 4

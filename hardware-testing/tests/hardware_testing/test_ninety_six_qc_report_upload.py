"""Completed 96-channel reports upload without altering results or failure evidence."""

from pathlib import Path
from types import SimpleNamespace
from typing import Any, Callable
from unittest.mock import ANY, MagicMock, Mock

import pytest

from hardware_testing.data.csv_report import CSVResult
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


@pytest.fixture
def environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    """Run the real protocol entry points with local reports and mocked hardware/I/O."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", None)
    monkeypatch.setattr(qc, "OT3API", SimpleNamespace())
    monkeypatch.setattr(qc, "_load_analysis_pipette", Mock())
    monkeypatch.setattr(qc, "_load_analysis_labware", Mock())
    monkeypatch.setattr(qc, "_qc_capture_identity", Mock())
    monkeypatch.setattr(qc, "_move_to_test_plunger_position", Mock())
    monkeypatch.setattr(qc.helpers_ot3, "set_csv_report_meta_data_ot3", Mock())
    report = qc.build_report(qc.TEST_NAME)
    report._dont_write_to_disk = True
    report.set_tag("P1K96-TEST")
    report.set_device_id("P1K96-TEST", "P1K96-TEST")
    report.set_operator("QC-operator")
    monkeypatch.setattr(qc, "build_report", Mock(return_value=report))
    args = {f"skip_{s.value.lower().replace('-', '_')}": False for s in qc.TestSection}
    args.update(pip_size="1000", operator="QC-operator")
    ctx = MagicMock()
    ctx.params = SimpleNamespace(**args, get_all=lambda: dict(args))
    ctx.is_simulating.return_value = False
    tests = Mock()
    monkeypatch.setattr(qc, "_run_test_sections", tests)
    upload = Mock(return_value=True)
    monkeypatch.setattr(qc.data_center_client, "upload_data_to_google_drive", upload)
    archive = Mock()
    monkeypatch.setattr(qc, "_archive_failure_log", archive)
    save = Mock(wraps=report.save_to_disk)
    monkeypatch.setattr(report, "save_to_disk", save)
    return SimpleNamespace(
        report=report,
        ctx=ctx,
        args=args,
        tests=tests,
        upload=upload,
        archive=archive,
        save=save,
    )


@pytest.mark.parametrize("pip_size", ["200", "1000"])
@pytest.mark.parametrize("operator", ["Unused", "QC-operator"])
@pytest.mark.parametrize("failed", [False, True])
def test_completed_reports_save_then_upload_without_regrading(
    environment: SimpleNamespace, pip_size: str, operator: str, failed: bool
) -> None:
    """Both 96 models preserve CSV bytes, operator gating, and a failed QC outcome."""
    env = environment
    env.args.update(pip_size=pip_size, operator=operator)
    env.ctx.params.pip_size = pip_size
    env.ctx.params.operator = operator
    env.report(
        "PRESSURE",
        "primary-open-pa",
        [30.0 if failed else 0.0, CSVResult.from_bool(not failed)],
    )
    original_csv = str(env.report) + "\n"
    operations = []

    def archive(ctx: Any, state: qc._QCFailureContext) -> None:
        assert ctx is env.ctx
        assert state.stage == "result-summary"
        assert state.report is env.report
        assert env.report.file_path.read_text() == original_csv
        assert operations == ([] if operator == "Unused" else ["csv-finished"])
        operations.append("archive")

    env.archive.side_effect = archive

    def upload(
        path: Path, *, direct_upload: bool, progress_callback: Callable[[str], None]
    ) -> bool:
        env.save.assert_called_once_with()
        assert path == env.report.file_path
        assert path.read_text() == original_csv
        assert direct_upload is True
        env.archive.assert_not_called()
        progress_callback("Upload record_id=record-96; stage=complete; status=success")
        operations.append("csv-finished")
        return True

    env.upload.side_effect = upload
    if failed:
        with pytest.raises(
            RuntimeError, match="QC failed items: PRESSURE/primary-open-pa"
        ):
            qc.run(env.ctx)
    else:
        qc.run(env.ctx)
    env.tests.assert_called_once()
    assert env.tests.call_args.args[3].pipette == int(pip_size)
    env.save.assert_called_once_with()
    assert env.report.file_path.read_text() == original_csv
    assert str(env.report) + "\n" == original_csv
    assert env.archive.call_count == int(failed)
    if operator == "Unused":
        env.upload.assert_not_called()
    else:
        env.upload.assert_called_once_with(
            env.report.file_path, direct_upload=True, progress_callback=ANY
        )
    assert operations == (
        ([] if operator == "Unused" else ["csv-finished"])
        + (["archive"] if failed else [])
    )


@pytest.mark.parametrize("failed", [False, True])
@pytest.mark.parametrize(
    "upload_error",
    [False, RuntimeError("server unavailable"), TimeoutError("upload wait timed out")],
)
def test_upload_failure_preserves_saved_report_and_qc_outcome(
    environment: SimpleNamespace, failed: bool, upload_error: Any
) -> None:
    """A transport failure neither fails passing QC nor hides an existing QC failure."""
    env = environment
    env.report("PRESSURE", "primary-open-pa", [0.0, CSVResult.from_bool(not failed)])
    original_csv = str(env.report) + "\n"
    operations = []

    def upload(
        path: Path, *, direct_upload: bool, progress_callback: Callable[[str], None]
    ) -> bool:
        assert path.read_text() == original_csv
        env.archive.assert_not_called()
        operations.append("csv-started")
        try:
            if isinstance(upload_error, Exception):
                raise upload_error
            return upload_error
        finally:
            operations.append("csv-finished")

    def archive(ctx: Any, state: qc._QCFailureContext) -> None:
        assert operations == ["csv-started", "csv-finished"]
        assert state.stage == "result-summary"
        operations.append("archive")

    env.upload.side_effect = upload
    env.archive.side_effect = archive
    if failed:
        with pytest.raises(
            RuntimeError, match="QC failed items: PRESSURE/primary-open-pa"
        ):
            qc.run(env.ctx)
    else:
        qc.run(env.ctx)
    assert env.report.file_path.read_text() == original_csv
    env.upload.assert_called_once_with(
        env.report.file_path, direct_upload=True, progress_callback=ANY
    )
    assert env.archive.call_count == int(failed)
    assert operations == ["csv-started", "csv-finished"] + (
        ["archive"] if failed else []
    )
    comments = "\n".join(call.args[0] for call in env.ctx.comment.call_args_list)
    assert "saved locally at" in comments
    assert "CSV uploaded successfully" not in comments


def test_pending_upload_is_visible_before_failure_archive(
    environment: SimpleNamespace,
) -> None:
    """A timed-out server job stays unconfirmed and does not suppress attachments."""
    env = environment
    env.report("PRESSURE", "primary-open-pa", [30.0, CSVResult.FAIL])
    messages = [
        "Upload record_id=record-96; stage=submitted; status=queued",
        "Upload record_id=record-96; stage=wait; status=processing; pending=True; "
        "error=Upload is still processing after the client wait timeout",
    ]

    def upload(
        path: Path, *, direct_upload: bool, progress_callback: Callable[[str], None]
    ) -> bool:
        for message in messages:
            progress_callback(message)
            env.archive.assert_not_called()
        return False

    env.upload.side_effect = upload
    with pytest.raises(RuntimeError, match="QC failed items"):
        qc.run(env.ctx)
    comments = "\n".join(call.args[0] for call in env.ctx.comment.call_args_list)
    assert all(message in comments for message in messages)
    assert "upload not confirmed" in comments
    assert "CSV uploaded successfully" not in comments
    env.archive.assert_called_once()
    assert env.archive.call_args.args[1].stage == "result-summary"


def test_runtime_abort_archives_original_error_without_uploading_incomplete_csv(
    environment: SimpleNamespace,
) -> None:
    """Incomplete reports continue through the existing failure checkpoint route only."""
    env = environment
    original = RuntimeError("hardware motion failed")
    env.tests.side_effect = original
    with pytest.raises(RuntimeError) as raised:
        qc.run(env.ctx)
    assert raised.value is original
    env.archive.assert_called_once()
    assert env.archive.call_args.args[2] is original
    env.upload.assert_not_called()


def test_simulation_never_saves_or_uploads_reports(
    environment: SimpleNamespace,
) -> None:
    """Protocol analysis only loads the selected labware layout."""
    env = environment
    env.ctx.is_simulating.return_value = True
    qc.run(env.ctx)
    env.tests.assert_not_called()
    env.ctx._core.get_hardware.assert_not_called()
    env.save.assert_not_called()
    env.upload.assert_not_called()
    env.archive.assert_not_called()

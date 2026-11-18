"""Failed automatic QC sections require an explicit, persistent operator choice."""

from pathlib import Path
from types import SimpleNamespace
from typing import Any, Literal
from unittest.mock import MagicMock, Mock

import pytest

from hardware_testing.data.csv_report import CSVReport, CSVResult
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


@pytest.fixture
def environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    """Keep real CSV storage and grading, replacing hardware and user input only."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", qc._QCTrace())
    monkeypatch.setattr(qc, "LOCALIZE", False)
    report = qc.build_report("ninety-six-failure-review")
    report._dont_write_to_disk = True
    report.set_tag("P1K96-REVIEW")
    report.set_device_id("P1K96-REVIEW", "P1K96-REVIEW")
    report.set_operator("QC-operator")
    api = MagicMock()
    api.is_simulator = False
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    ctx._core.get_hardware.return_value = api
    args = {f"skip_{s.value.lower().replace('-', '_')}": False for s in qc.TestSection}
    args.update(pip_size="1000", operator="QC-operator")
    ctx.params = SimpleNamespace(**args, get_all=lambda: dict(args))
    answer = Mock(return_value=True)

    def answer_with_prompt(ctx: Any, api: Any, prompt: str, **kwargs: Any) -> bool:
        ctx.comment(f"{prompt}: Scan Yes / No, or press Enter / Esc.")
        return bool(answer.return_value)

    answer.side_effect = answer_with_prompt
    monkeypatch.setattr(qc.helpers_ot3, "get_user_answer", answer)
    save = Mock(wraps=report.save_to_disk)
    monkeypatch.setattr(report, "save_to_disk", save)
    return SimpleNamespace(
        report=report, api=api, ctx=ctx, args=args, answer=answer, save=save
    )


def _record_failure(report: CSVReport, section: str) -> str:
    """Use one genuine report row from each supported automatic section."""
    if section == "META_DATA":
        report.set_device_id("P1K96-REVIEW", "OTHER-BARCODE")
        return "test_device_id"
    records = {
        "CAPACITANCE": ("primary-air-pf", [20.0, CSVResult.FAIL]),
        "PRESSURE": ("primary-open-pa", [30.0, CSVResult.FAIL]),
        "ENVIRONMENT-SENSOR": ("environment-S0-read-valid", [CSVResult.FAIL]),
        "TIP-SENSOR": ("tip-sensor-with-tips", [CSVResult.FAIL]),
        "ENCODER": ("encoder-96-cycles", [2, CSVResult.FAIL]),
    }
    if section == "PLUNGER":
        tag = report[section].lines[0].tag
        report(section, tag, [0.0, 2.0, CSVResult.FAIL])
        return tag
    tag, data = records[section]
    report(section, tag, data)
    return tag


@pytest.mark.parametrize("pipette", [200, 1000])
@pytest.mark.parametrize(
    "section",
    [
        "META_DATA",
        "PLUNGER",
        "CAPACITANCE",
        "PRESSURE",
        "ENVIRONMENT-SENSOR",
        "TIP-SENSOR",
        "ENCODER",
    ],
)
def test_failed_automatic_sections_save_show_details_and_wait_for_choice(
    environment: SimpleNamespace,
    pipette: Literal[200, 1000],
    section: str,
) -> None:
    """Failure values remain unchanged while UI and keyboard wait after checkpoint."""
    env = environment
    tag = _record_failure(env.report, section)
    original = str(env.report) + "\n"
    operations = []

    def save() -> Path:
        operations.append("save")
        return CSVReport.save_to_disk(env.report)

    def comment(message: str) -> None:
        assert env.report.file_path.read_text() == original
        operations.append("comment")

    def answer(*args: Any, **kwargs: Any) -> bool:
        review_ctx, api, prompt = args
        assert review_ctx is env.ctx
        assert api is env.api
        assert section in prompt
        assert kwargs["timeout_seconds"] is None
        assert operations == ["save", "comment"]
        displayed = f"{prompt}: Scan Yes / No, or press Enter / Esc."
        review_ctx.comment(displayed)
        assert env.ctx.comment.call_args.args[0] == displayed
        operations.append("keyboard")
        return True

    env.save.side_effect = save
    env.ctx.comment.side_effect = comment
    env.answer.side_effect = answer

    qc._confirm_failed_section(env.ctx, env.api, env.report, section, pipette)

    assert operations[0] == "save"
    assert operations == ["save", "comment", "comment", "keyboard", "comment"]
    env.ctx.pause.assert_not_called()
    env.answer.assert_called_once()
    comments = "\n".join(call.args[0] for call in env.ctx.comment.call_args_list)
    assert f"{section}/{tag}" in comments
    assert "FAIL" in comments
    assert str(env.report) + "\n" == original
    assert env.report[section][tag].result_passed is False
    env.api.assert_not_called()
    decisions = [
        event["values"]["decision"]
        for event in qc._ACTIVE_QC_TRACE.events
        if event["action"] == "qc_failure_review"
    ]
    assert decisions == ["pending", "continue"]


@pytest.mark.parametrize("localize", [False, True])
def test_complete_failure_log_precedes_existing_yes_no_prompt(
    environment: SimpleNamespace, monkeypatch: pytest.MonkeyPatch, localize: bool
) -> None:
    """Full failure evidence is logged before the ordinary Yes/No question."""
    env = environment
    monkeypatch.setattr(qc, "LOCALIZE", localize)
    for row in env.report["PLUNGER"].lines:
        env.report("PLUNGER", row.tag, [0.0, 10.0, CSVResult.FAIL])
    qc._confirm_failed_section(env.ctx, env.api, env.report, "PLUNGER", 1000)
    summary = env.answer.call_args.args[2]
    assert "Enter" in summary and "Y" in summary and "N" in summary
    assert "关闭此弹窗后" not in summary and "Close this message" not in summary
    details = env.ctx.comment.call_args_list[0].args[0]
    prompt = env.ctx.comment.call_args_list[1].args[0]
    assert len(details) > 220
    assert summary in prompt
    assert env.answer.call_args.args[:2] == (env.ctx, env.api)
    for row in env.report["PLUNGER"].lines:
        assert f"PLUNGER/{row.tag}" in details
    env.ctx.pause.assert_not_called()


@pytest.mark.parametrize("continue_run", [False, True])
def test_existing_yes_no_helper_receives_original_context_and_preserves_notices(
    environment: SimpleNamespace, continue_run: bool
) -> None:
    """Keyboard status messages pass through unchanged while waiting for a choice."""
    env = environment
    tag = _record_failure(env.report, "PRESSURE")
    initialization = "Keyboard opened; waiting for a valid key."
    disconnected = "Keyboard disconnected; reconnecting."
    reconnected = "Keyboard reconnected; release and press again."

    def answer(review_ctx: Any, api: Any, prompt: str, **kwargs: Any) -> bool:
        assert review_ctx is env.ctx
        assert api is env.api
        assert kwargs["timeout_seconds"] is None
        details = env.ctx.comment.call_args.args[0]
        assert f"PRESSURE/{tag}" in details
        assert '[30.0, "FAIL"]' in details
        review_ctx.comment(initialization)
        assert env.ctx.comment.call_args.args[0] == initialization
        displayed = f"{prompt}: Scan Yes / No, or press Enter / Esc."
        for message in (displayed, disconnected, reconnected):
            review_ctx.comment(message)
            assert env.ctx.comment.call_args.args[0] == message
        return continue_run

    env.answer.side_effect = answer
    if continue_run:
        qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)
    else:
        with pytest.raises(qc._QCOperatorStopped):
            qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)

    decision = env.ctx.comment.call_args.args[0]
    assert ("continue" if continue_run else "stopped") in decision
    env.ctx.pause.assert_not_called()
    assert env.report["PRESSURE"][tag].result_passed is False


@pytest.mark.parametrize(
    "case", ["pass", "missing", "manual-jaws", "manual-droplets", "simulation"]
)
def test_no_review_for_unfailed_manual_or_simulated_checks(
    environment: SimpleNamespace, case: str
) -> None:
    """Absent grades are not FAIL, and existing manual checks are not duplicated."""
    env = environment
    section = "PRESSURE"
    if case == "pass":
        env.report(section, "primary-open-pa", [0.0, CSVResult.PASS])
    elif case == "manual-jaws":
        section = "JAWS"
        env.report(
            section,
            env.report[section].lines[0].tag,
            [False, False, False, CSVResult.FAIL],
        )
    elif case == "manual-droplets":
        section = "DROPLETS"
        env.report(section, "droplets-96-tips", [1000.0, CSVResult.FAIL])
    elif case == "simulation":
        _record_failure(env.report, section)
        env.ctx.is_simulating.return_value = True
        env.api.is_simulator = True

    qc._confirm_failed_section(env.ctx, env.api, env.report, section, 1000)

    env.ctx.pause.assert_not_called()
    env.answer.assert_not_called()
    env.save.assert_not_called()


def test_pressure_failure_review_keeps_retained_tips_and_next_section_order(
    environment: SimpleNamespace,
) -> None:
    """Confirming a pressure FAIL does not turn its retained-tip return into FAIL."""
    env = environment
    operations = []

    def pressure(
        api: Any, report: CSVReport, section: str, ctx: Any, **kwargs: Any
    ) -> bool:
        assert kwargs == {"pipette": 1000, "retain_tips": True}
        operations.append("pressure-finished")
        _record_failure(report, section)
        return True

    def tip_sensor(
        api: Any, report: CSVReport, section: str, ctx: Any, **kwargs: Any
    ) -> None:
        assert kwargs == {"pipette": 1000, "use_pressure_tips": True}
        assert operations == ["pressure-finished", "continue"]
        operations.append("tip-sensor")

    env.answer.side_effect = (
        lambda *args, **kwargs: operations.append("continue") or True
    )
    state = qc._QCFailureContext(report=env.report)
    config = qc.TestConfig(
        False,
        {qc.TestSection.PRESSURE: pressure, qc.TestSection.TIP_SENSOR: tip_sensor},
        1000,
    )
    qc._run_test_sections(env.api, env.report, env.ctx, config, state=state)

    assert operations == ["pressure-finished", "continue", "tip-sensor"]
    env.ctx.pause.assert_not_called()
    assert state.completed_sections == ["PRESSURE", "TIP-SENSOR"]
    assert env.report["PRESSURE"]["primary-open-pa"].result_passed is False
    assert qc._ACTIVE_QC_TRACE.tests["PRESSURE"]["status"] == "failed"


@pytest.mark.parametrize(
    "error",
    [RuntimeError("motion failed"), TimeoutError("sensor communication failed")],
)
def test_runtime_error_still_stops_without_a_continue_review(
    environment: SimpleNamespace, error: Exception
) -> None:
    """A failed operation cannot become operator-overridable QC criteria."""
    env = environment
    _record_failure(env.report, "PRESSURE")
    state = qc._QCFailureContext(report=env.report)
    test = Mock(side_effect=error)
    with pytest.raises(type(error)) as raised:
        qc._run_qc_test(
            test, env.api, env.report, "PRESSURE", env.ctx, pipette=1000, state=state
        )
    assert raised.value is error
    assert state.completed_sections == []
    env.ctx.pause.assert_not_called()
    env.answer.assert_not_called()


def test_refusal_stops_next_section_archives_partial_report_and_preserves_fail(
    environment: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """N/Esc semantics propagate through run(), blocking remaining tests and upload."""
    env = environment
    env.answer.return_value = False
    next_section = Mock()
    upload = Mock()
    archive = Mock()
    monkeypatch.setattr(qc, "_qc_capture_identity", Mock())
    monkeypatch.setattr(qc, "_upload_formal_report", upload)
    monkeypatch.setattr(qc, "_archive_failure_log", archive)

    def pressure(
        api: Any, report: CSVReport, section: str, ctx: Any, **kwargs: Any
    ) -> bool:
        _record_failure(report, section)
        return True

    def run_qc(ctx: Any, state: qc._QCFailureContext) -> list[str]:
        state.report = env.report
        qc._qc_initialize_tests(env.args)
        config = qc.TestConfig(
            False,
            {
                qc.TestSection.PRESSURE: pressure,
                qc.TestSection.TIP_SENSOR: next_section,
            },
            1000,
        )
        qc._run_test_sections(env.api, env.report, ctx, config, state=state)
        raise AssertionError("Refusal must not finish the run")

    def archive_failure(
        ctx: Any, state: qc._QCFailureContext, error: Exception
    ) -> None:
        assert isinstance(error, qc._QCOperatorStopped)
        assert state.completed_sections == ["PRESSURE"]
        assert qc._ACTIVE_QC_TRACE.tests["PRESSURE"]["status"] == "failed"
        assert (
            qc._ACTIVE_QC_TRACE.tests["TIP-SENSOR"]["status"]
            == "not_run_due_to_previous_failure"
        )
        assert env.report.file_path.exists()
        assert "primary-open-pa,30.0,FAIL" in env.report.file_path.read_text()
        assert [
            event["values"]["decision"]
            for event in qc._ACTIVE_QC_TRACE.events
            if event["action"] == "qc_failure_review"
        ] == ["pending", "stop"]

    archive.side_effect = archive_failure
    monkeypatch.setattr(qc, "_run_qc", run_qc)
    with pytest.raises(qc._QCOperatorStopped):
        qc.run(env.ctx)
    next_section.assert_not_called()
    upload.assert_not_called()
    archive.assert_called_once()


@pytest.mark.parametrize("interrupt_at", ["prompt", "keyboard"])
def test_cancellation_during_failure_review_is_not_treated_as_continue(
    environment: SimpleNamespace, interrupt_at: str
) -> None:
    """An App stop or interrupted keyboard wait prevents the next hardware test."""
    env = environment
    interrupted = RuntimeError("Engine was stopped")
    if interrupt_at == "prompt":

        def comment(message: str) -> None:
            if "Scan Yes / No" in message:
                raise interrupted

        env.ctx.comment.side_effect = comment

    def answer(review_ctx: Any, api: Any, prompt: str, **kwargs: Any) -> bool:
        review_ctx.comment(f"{prompt}: Scan Yes / No, or press Enter / Esc.")
        raise interrupted

    env.answer.side_effect = answer
    following = Mock()

    def pressure(
        api: Any, report: CSVReport, section: str, ctx: Any, **kwargs: Any
    ) -> bool:
        _record_failure(report, section)
        return True

    config = qc.TestConfig(
        False,
        {qc.TestSection.PRESSURE: pressure, qc.TestSection.TIP_SENSOR: following},
        1000,
    )
    with pytest.raises(RuntimeError) as raised:
        qc._run_test_sections(env.api, env.report, env.ctx, config)
    assert raised.value is interrupted
    following.assert_not_called()
    assert env.report.file_path.exists()
    assert env.report["PRESSURE"]["primary-open-pa"].result_passed is False
    assert [
        event["values"]["decision"]
        for event in qc._ACTIVE_QC_TRACE.events
        if event["action"] == "qc_failure_review"
    ] == ["pending", "interrupted"]
    env.answer.assert_called_once()
    env.ctx.pause.assert_not_called()


def test_failed_checkpoint_cannot_offer_continue_without_saved_measurements(
    environment: SimpleNamespace,
) -> None:
    """A disk failure propagates before any continuation prompt is shown."""
    env = environment
    _record_failure(env.report, "PRESSURE")
    error = OSError("No space left on device")
    env.save.side_effect = error
    with pytest.raises(OSError) as raised:
        qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)
    assert raised.value is error
    env.ctx.pause.assert_not_called()
    env.answer.assert_not_called()


@pytest.mark.parametrize("continue_run", [False, True])
def test_metadata_failure_is_reviewed_before_any_test_section(
    environment: SimpleNamespace, monkeypatch: pytest.MonkeyPatch, continue_run: bool
) -> None:
    """A mismatched barcode is checked even when all hardware tests are skipped."""
    env = environment
    env.answer.return_value = continue_run
    for name in env.args:
        if name.startswith("skip_"):
            env.args[name] = True
            setattr(env.ctx.params, name, True)
    monkeypatch.setattr(qc, "OT3API", SimpleNamespace())
    monkeypatch.setattr(qc, "_load_analysis_pipette", Mock())
    monkeypatch.setattr(qc, "_qc_capture_identity", Mock())
    monkeypatch.setattr(qc, "_move_to_test_plunger_position", Mock())
    monkeypatch.setattr(qc, "build_report", Mock(return_value=env.report))
    monkeypatch.setattr(
        qc.helpers_ot3,
        "set_csv_report_meta_data_ot3",
        Mock(
            side_effect=lambda *args, **kwargs: _record_failure(env.report, "META_DATA")
        ),
    )
    tests = Mock()
    monkeypatch.setattr(qc, "_run_test_sections", tests)
    state = qc._QCFailureContext()
    if continue_run:
        assert qc._run_qc(env.ctx, state) == ["META_DATA/test_device_id"]
        tests.assert_called_once()
    else:
        with pytest.raises(qc._QCOperatorStopped):
            qc._run_qc(env.ctx, state)
        tests.assert_not_called()
    env.answer.assert_called_once()
    env.ctx.pause.assert_not_called()
    assert "META_DATA" in env.answer.call_args.args[2]
    assert env.report["META_DATA"]["test_device_id"].result_passed is False

"""96-channel manual confirmations keep accepting fresh answers after long waits."""

import asyncio
from collections.abc import Iterator
from pathlib import Path
from types import SimpleNamespace
from typing import Callable, Optional
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest

from opentrons.hardware_control.types import Axis
from opentrons.types import Point
from opentrons_shared_data.errors.exceptions import ExecutionCancelledError

from hardware_testing.data.csv_report import CSVResult
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api import liquid_calibration_input as input_module
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


class WaitingKeyboard:
    """Supply fresh keyboard edges only after fifteen simulated minutes per prompt."""

    name = "test USB keyboard"
    path = "/dev/input/test-keyboard"
    identity = "test-keyboard"

    def __init__(self, environment: SimpleNamespace, answers: list[str]) -> None:
        """Keep prompt-local timing while the real input receiver handles polling."""
        self.environment = environment
        self.started_at = environment.now
        self.answers = answers
        self.sent = 0
        self.closed = False

    def set_notice(self, notice: Callable[[str], None]) -> None:
        """Accept the input session's normal notification callback."""

    def poll(self) -> Optional[tuple[str, float]]:
        """Return each configured edge once, with its real simulated arrival time."""
        elapsed = self.environment.now - self.started_at
        if self.sent >= len(self.answers) or elapsed < 900 + self.sent * 180:
            return None
        answer = self.answers[self.sent]
        self.sent += 1
        self.environment.received.append((answer, elapsed))
        return answer, self.environment.now

    def close(self) -> None:
        """Track device cleanup without touching a physical USB keyboard."""
        self.closed = True


@pytest.fixture
def waiting_environment(monkeypatch: pytest.MonkeyPatch) -> Iterator[SimpleNamespace]:
    """Use real confirmation/input loops with virtual time and mocked hardware."""
    loop = asyncio.new_event_loop()
    env = SimpleNamespace(
        now=100.0,
        delay_calls=0,
        answers=[],
        keyboards=[],
        sessions=[],
        received=[],
        expire_first_answer=False,
        expire_next_delay=False,
        cancel_at=None,
        cancellation=ExecutionCancelledError(),
        ctx=MagicMock(),
        api=MagicMock(is_simulator=False),
    )
    monkeypatch.setattr(helpers_ot3, "OT3API", SimpleNamespace())
    monkeypatch.setattr(helpers_ot3, "monotonic", lambda: env.now)
    monkeypatch.setattr(input_module, "monotonic", lambda: env.now)
    monkeypatch.setattr(qc, "monotonic", lambda: env.now)
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", None)
    monkeypatch.setattr(helpers_ot3, "move_to_arched_ot3_sync", Mock())
    monkeypatch.setattr(helpers_ot3, "move_tip_motor_relative_ot3_sync", Mock())

    def open_keyboard(comment: Callable[[str], None]) -> WaitingKeyboard:
        keyboard = WaitingKeyboard(env, env.answers.pop(0))
        env.keyboards.append(keyboard)
        return keyboard

    monkeypatch.setattr(helpers_ot3.YesNoKeyboard, "open", open_keyboard)

    def delay(seconds: float) -> None:
        env.delay_calls += 1
        env.now += 180 if env.delay_calls % 2 else seconds
        if env.expire_next_delay:
            env.now += 4
            env.expire_next_delay = False
        if env.cancel_at is not None and env.now >= env.cancel_at:
            raise env.cancellation
        assert env.now < 5000, "Confirmation failed to finish after scheduled input"

    def read(
        inputs: input_module.LiquidCalibrationInput, close: bool = False
    ) -> input_module.Command:
        if inputs not in env.sessions:
            env.sessions.append(inputs)
        result = loop.run_until_complete(
            input_module.read_liquid_calibration_input(env.api, inputs, close=close)
        )
        if result[0] and env.expire_first_answer:
            env.expire_first_answer = False
            env.expire_next_delay = True
        return result

    env.api.delay.side_effect = delay
    env.api._scan_barcode = AsyncMock(return_value=None)
    env.api._liquid_calibration_input.side_effect = read
    try:
        yield env
    finally:
        pending = asyncio.all_tasks(loop)
        for task in pending:
            task.cancel()
        if pending:
            loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        loop.close()


def assert_closed(env: SimpleNamespace) -> None:
    """The actual helper must release devices and stop background receivers."""
    assert env.keyboards
    assert all(keyboard.closed for keyboard in env.keyboards)
    assert all(session._closed for session in env.sessions)
    assert all(session._receiver is None for session in env.sessions)


@pytest.mark.parametrize("answer", ["YES", "NO"])
def test_initial_jaw_confirmation_accepts_late_answer(
    waiting_environment: SimpleNamespace, answer: str
) -> None:
    """An untouched question still accepts either answer after fifteen minutes."""
    env = waiting_environment
    env.answers = [[answer]]
    assert qc._check_if_jaw_is_aligned_with_endstop(env.ctx, env.api) == (
        answer == "YES"
    )
    assert env.received[0][1] >= 900
    assert_closed(env)


@pytest.mark.parametrize("answers", [["NO"], ["YES", "NO"], ["YES", "YES"]])
def test_jaw_precheck_waits_for_each_late_answer_without_changing_grade(
    waiting_environment: SimpleNamespace, answers: list[str]
) -> None:
    """Both jaw questions wait independently; No retains the original early return."""
    env = waiting_environment
    env.answers = [[answer] for answer in answers]
    expected = (answers[0] == "YES", len(answers) == 2 and answers[1] == "YES")
    assert qc.jaw_precheck(env.ctx, env.api, Axis.Q, speed=8) == expected
    env.api._home_tip_motors.assert_called_once_with(back_off=False)
    assert len(env.received) == len(answers)
    assert all(elapsed >= 900 for _, elapsed in env.received)
    assert helpers_ot3.move_tip_motor_relative_ot3_sync.call_count == int(
        answers[0] == "YES"
    )
    assert_closed(env)


@pytest.mark.parametrize("answer", ["YES", "NO"])
def test_droplet_confirmation_preserves_late_answer_and_dispense(
    waiting_environment: SimpleNamespace, answer: str
) -> None:
    """The leak observation keeps its answer, duration and existing dispense path."""
    env = waiting_environment
    env.answers = [[answer]]
    result, duration = qc.aspirate_and_wait(
        env.ctx, env.api, Point(100, 200, 50), volume=100, seconds=0
    )
    assert result == (answer == "YES")
    assert duration >= 900
    env.api.aspirate.assert_called_once_with(qc.OT3Mount.LEFT, 100)
    env.api.dispense.assert_called_once_with(qc.OT3Mount.LEFT, is_full_dispense=True)
    assert_closed(env)


def test_stale_late_answer_is_rejected_until_fresh_answer(
    waiting_environment: SimpleNamespace,
) -> None:
    """A response delayed by a pause cannot confirm a question after resuming."""
    env = waiting_environment
    env.answers = [["YES", "NO"]]
    env.expire_first_answer = True
    assert qc._check_if_jaw_is_aligned_with_endstop(env.ctx, env.api) is False
    assert [answer for answer, _ in env.received] == ["YES", "NO"]
    assert any(
        "expired" in call.args[0] or "回答已过期" in call.args[0]
        for call in env.ctx.comment.call_args_list
    )
    assert_closed(env)


def test_cancellation_after_long_wait_exits_and_releases_keyboard(
    waiting_environment: SimpleNamespace,
) -> None:
    """Indefinite manual confirmation keeps the hardware cancellation checkpoints."""
    env = waiting_environment
    env.answers = [[]]
    env.cancel_at = env.now + 900
    with pytest.raises(ExecutionCancelledError) as raised:
        qc._check_if_jaw_is_aligned_with_endstop(env.ctx, env.api)
    assert raised.value is env.cancellation
    assert env.received == []
    assert_closed(env)


def test_common_helper_retains_explicit_default_timeout(
    waiting_environment: SimpleNamespace,
) -> None:
    """The 96-specific change does not alter timeout behavior for other callers."""
    env = waiting_environment
    env.answers = [["YES"]]
    with pytest.raises(RuntimeError, match="confirmation timed out"):
        helpers_ot3.get_user_answer(env.ctx, env.api, "default helper timeout")
    assert env.received == []
    assert_closed(env)


@pytest.fixture
def failure_review_environment(
    waiting_environment: SimpleNamespace,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> SimpleNamespace:
    """Run the existing Yes/No helper and receiver against a saved failed report."""
    env = waiting_environment
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    monkeypatch.setattr(qc, "LOCALIZE", False)
    monkeypatch.setattr(helpers_ot3, "LOCALIZE", False)
    env.answer = Mock(wraps=helpers_ot3.get_user_answer)
    monkeypatch.setattr(helpers_ot3, "get_user_answer", env.answer)
    env.ctx.is_simulating.return_value = False
    report = qc.build_report("ninety-six-failure-keyboard-wait")
    report._dont_write_to_disk = True
    report.set_tag("P1K96-KEYBOARD")
    report.set_device_id("P1K96-KEYBOARD", "P1K96-KEYBOARD")
    report.set_operator("QC-operator")
    report("PRESSURE", "primary-open-pa", [30.0, CSVResult.FAIL])
    env.report = report
    env.csv_before = str(report) + "\n"
    env.comments = []

    def comment(message: str) -> None:
        assert report.file_path.read_text() == env.csv_before
        env.comments.append((message, len(env.received)))

    env.ctx.comment.side_effect = comment
    delay = env.api.delay.side_effect

    def delay_after_prompt(seconds: float) -> None:
        assert "PRESSURE/primary-open-pa" in env.comments[0][0]
        assert any("Scan Yes / No" in message for message, _ in env.comments)
        env.ctx.pause.assert_not_called()
        delay(seconds)

    env.api.delay.side_effect = delay_after_prompt
    return env


@pytest.mark.parametrize(
    "answers, expire_first_answer",
    [(["YES"], False), (["NO"], False), (["YES", "NO"], True)],
)
def test_failure_review_uses_existing_yes_no_input_for_late_answer(
    failure_review_environment: SimpleNamespace,
    answers: list[str],
    expire_first_answer: bool,
) -> None:
    """The original context and receiver accept fresh answers after fifteen minutes."""
    env = failure_review_environment
    env.answers = [answers]
    env.expire_first_answer = expire_first_answer

    if answers[-1] == "YES":
        qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)
    else:
        with pytest.raises(qc._QCOperatorStopped):
            qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)

    assert [answer for answer, _ in env.received] == answers
    assert all(elapsed >= 900 for _, elapsed in env.received)
    prompts = [
        (message, received)
        for message, received in env.comments
        if "Scan Yes / No" in message
    ]
    assert prompts[0][1] == 0, "The question must be visible before any keyboard edge"
    for message, _ in prompts:
        assert "PRESSURE/primary-open-pa" in message
        assert '[30.0, "FAIL"]' in message
        assert "Enter/Y" in message and "Esc/N" in message
    if expire_first_answer:
        assert any("Answer expired" in message for message, _ in env.comments)
    decision, received = env.comments[-1]
    assert ("continue" if answers[-1] == "YES" else "stopped") in decision
    assert received == len(answers)
    env.answer.assert_called_once()
    assert env.answer.call_args.args[:2] == (env.ctx, env.api)
    assert env.answer.call_args.kwargs == {"timeout_seconds": None}
    env.ctx.pause.assert_not_called()
    assert str(env.report) + "\n" == env.csv_before
    assert env.report["PRESSURE"]["primary-open-pa"].result_passed is False
    assert_closed(env)


@pytest.mark.parametrize("comment_failed", [False, True])
def test_failure_review_cancellation_after_long_wait_preserves_original_error(
    failure_review_environment: SimpleNamespace,
    capsys: pytest.CaptureFixture[str],
    comment_failed: bool,
) -> None:
    """Cancellation releases input even if the closing comment cannot be delivered."""
    env = failure_review_environment
    env.answers = [[]]
    env.cancel_at = env.now + 900
    comment = env.ctx.comment.side_effect

    def comment_with_stopped_engine(message: str) -> None:
        if comment_failed and "failure review interrupted" in message:
            raise RuntimeError("The stopped engine no longer accepts comments")
        comment(message)

    env.ctx.comment.side_effect = comment_with_stopped_engine
    with pytest.raises(ExecutionCancelledError) as raised:
        qc._confirm_failed_section(env.ctx, env.api, env.report, "PRESSURE", 1000)

    assert raised.value is env.cancellation
    assert env.received == []
    assert env.now >= env.cancel_at
    if comment_failed:
        assert "failure review interrupted" in capsys.readouterr().out
    else:
        assert "failure review interrupted" in env.comments[-1][0]
    env.answer.assert_called_once()
    assert env.answer.call_args.args[:2] == (env.ctx, env.api)
    env.ctx.pause.assert_not_called()
    assert str(env.report) + "\n" == env.csv_before
    assert env.report["PRESSURE"]["primary-open-pa"].result_passed is False
    assert_closed(env)

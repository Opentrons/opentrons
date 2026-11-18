"""Operator leak-channel evidence preserves the existing liquid test grading."""

import asyncio
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Callable, List, Optional, Tuple
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest

from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVSection
from hardware_testing.drivers import liquid_calibration_keyboard
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


def _failed_round(*args: Any, on_leak: Optional[Callable[[], None]] = None) -> bool:
    """Deliver a failed operator answer at the new callback boundary."""
    if on_leak is not None:
        on_leak()
    return False


@pytest.fixture
def config() -> qc.TestConfig:
    """Create an ordinary two-round eight-channel liquid test configuration."""
    return qc.TestConfig(
        simulate=False,
        tests={},
        fixture_side="left",
        aspirate_sample_count=3,
        slot_tip_rack_1000=1,
        slot_tip_rack_200=2,
        slot_tip_rack_50=3,
        slot_reservoir=4,
        slot_plate=5,
        slot_fixture=6,
        slot_trash=7,
        num_trials=2,
        droplet_wait_seconds=30,
        pipette_channels=8,
        pipette_volume=1000,
        mount=OT3Mount.LEFT,
        trash_loc_counter=0,
    )


@pytest.fixture
def trace(monkeypatch: pytest.MonkeyPatch) -> qc._QCTrace:
    """Isolate evidence, failure descriptions, and physical tip reservations."""
    result = qc._QCTrace()
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", result)
    monkeypatch.setattr(qc, "FINAL_TEST_FAIL_INFOR", [])
    monkeypatch.setattr(
        qc,
        "_available_tips",
        {
            volume: [f"{row}{column}" for column in range(1, 13) for row in "ABCDEFGH"]
            for volume in (50, 200, 1000)
        },
    )
    return result


@pytest.fixture
def report(
    config: qc.TestConfig, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> CSVReport:
    """Use actual CSV rows and serialization without filesystem or server writes."""
    monkeypatch.setenv("TESTING_DATA_DIR", str(tmp_path))
    return CSVReport(
        "leak-channel-test",
        [CSVSection("LIQUID", qc.build_liquid_csv_lines(config))],
        run_id="leak-run",
        validate_meta_data=False,
        dont_write_to_disk=True,
    )


@pytest.mark.parametrize(
    "raw,expected",
    [("1", [1]), ("8", [8]), ("12345678", list(range(1, 9))), ("83118", [1, 3, 8])],
)
def test_parse_each_digit_as_one_channel(raw: str, expected: List[int]) -> None:
    """An entered sequence identifies individual channels, never a whole number."""
    assert qc._parse_leaking_channels(raw) == expected


@pytest.mark.parametrize(
    "raw", ["", "0", "9", "10", "129", "1 2", "1,2", "-1", "1.2", "１２", "١٢", "12\n"]
)
def test_parse_rejects_ambiguous_or_out_of_range_channels(raw: str) -> None:
    """Only nonempty ASCII digits 1 through 8 can become evidence."""
    with pytest.raises(ValueError):
        qc._parse_leaking_channels(raw)


def test_read_channel_input_never_invokes_scanner() -> None:
    """The async bridge requests keyboard-only input and returns its exact value."""
    inputs = MagicMock()
    inputs.read = AsyncMock(return_value=("CHANNELS:138", 123.0))
    api = MagicMock()
    result = asyncio.run(qc._read_leak_channel_input(api, inputs))
    assert result == ("CHANNELS:138", 123.0)
    inputs.read.assert_awaited_once_with(None)
    assert api.mock_calls == []


def test_read_channel_input_closes_without_reading() -> None:
    """Closing a numeric entry session cannot start a scanner or another read."""
    inputs = MagicMock()
    inputs.read = AsyncMock()
    inputs.close = AsyncMock()
    api = MagicMock()
    asyncio.run(qc._read_leak_channel_input(api, inputs, close=True))
    inputs.close.assert_awaited_once_with()
    inputs.read.assert_not_awaited()
    assert api.mock_calls == []


@pytest.mark.parametrize("volume", [50, 1000])
def test_failed_rounds_record_independent_channels_without_changing_csv(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    monkeypatch: pytest.MonkeyPatch,
    volume: int,
) -> None:
    """P50M and P1000M retain FAIL before entry and save separate round evidence."""
    config.pipette_volume = volume
    api = MagicMock()
    api.is_simulator = False
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    leak_test = Mock(side_effect=_failed_round)
    monkeypatch.setattr(qc, "_test_for_leak", leak_test)
    answers: List[Tuple[str, List[int]]] = [("83118", [1, 3, 8]), ("2", [2])]
    serialized: List[str] = []

    def get_channels(context: Any, hardware: Any) -> Tuple[str, List[int]]:
        assert context is ctx and hardware is api
        line = report["LIQUID"][f"droplets-{30 * (len(serialized) + 1)}"]
        assert line.result is CSVResult.FAIL
        assert any(
            event["action"] == "liquid_leak_channel_input_required"
            and event["values"]["trial"] == len(serialized) + 1
            for event in trace.events
        )
        serialized.append(str(line))
        return answers[len(serialized) - 1]

    channel_input = Mock(side_effect=get_channels)
    monkeypatch.setattr(qc, "_get_leaking_channels", channel_input)

    qc.test_liquid(api, report, "LIQUID", ctx, config)

    assert channel_input.call_count == 2
    assert leak_test.call_count == 2
    assert [call.args[-1] for call in leak_test.call_args_list] == [30, 60]
    lines = report["LIQUID"].lines
    assert [line.tag for line in lines] == ["droplets-30", "droplets-60"]
    assert [line.data for line in lines] == [[CSVResult.FAIL], [CSVResult.FAIL]]
    assert [str(line) for line in lines] == serialized
    observations = [
        event for event in trace.events if event["action"] == "liquid_leak_channels"
    ]
    assert len(observations) == 2
    for index, event in enumerate(observations):
        raw, channels = answers[index]
        assert event["values"] == {
            "raw_input": raw,
            "channels": channels,
            "trial": index + 1,
            "wait_seconds": 30 * (index + 1),
            "mount": "LEFT",
            "tip_volume": volume,
            "section": "LIQUID",
            "tag": f"droplets-{30 * (index + 1)}",
            "source": "operator",
        }
        reasons = " ".join(lines[index].failure_reasons)
        for channel in channels:
            assert str(channel) in reasons
    rows = [
        row for row in qc._failure_report_rows(report) if row["section"] == "LIQUID"
    ]
    assert [row["failure_reasons"] for row in rows] == [
        line.failure_reasons for line in lines
    ]
    assert api.mock_calls == []


@pytest.mark.parametrize(
    "channels,simulate,passed", [(1, False, False), (8, False, True), (8, True, False)]
)
def test_no_channel_prompt_for_single_passed_or_simulated_tests(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    monkeypatch: pytest.MonkeyPatch,
    channels: int,
    simulate: bool,
    passed: bool,
) -> None:
    """The added operator step applies only to live failed eight-channel rounds."""
    config.pipette_channels = channels
    config.simulate = simulate
    ctx = MagicMock()
    ctx.is_simulating.return_value = simulate
    monkeypatch.setattr(
        qc,
        "_test_for_leak",
        Mock(return_value=True) if passed else Mock(side_effect=_failed_round),
    )
    channel_input = Mock()
    monkeypatch.setattr(qc, "_get_leaking_channels", channel_input)
    api = MagicMock()
    api.is_simulator = simulate
    qc.test_liquid(api, report, "LIQUID", ctx, config)
    channel_input.assert_not_called()
    expected = CSVResult.PASS if passed else CSVResult.FAIL
    assert [line.result for line in report["LIQUID"].lines] == [expected, expected]
    assert not any(event["action"] == "liquid_leak_channels" for event in trace.events)


def test_channel_input_cancellation_keeps_the_failed_measurement(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A cancel/read error cannot turn observed leakage into an unwritten row."""
    original = RuntimeError("operator cancelled input")
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    leak_test = Mock(side_effect=_failed_round)
    monkeypatch.setattr(qc, "_test_for_leak", leak_test)
    monkeypatch.setattr(qc, "_get_leaking_channels", Mock(side_effect=original))
    api = MagicMock()
    api.is_simulator = False
    with pytest.raises(RuntimeError) as raised:
        qc.test_liquid(api, report, "LIQUID", ctx, config)
    assert raised.value is original
    assert report["LIQUID"]["droplets-30"].result is CSVResult.FAIL
    assert report["LIQUID"]["droplets-30"].failure_reasons
    assert report["LIQUID"]["droplets-60"].result is None
    leak_test.assert_called_once()
    assert not any(event["action"] == "liquid_leak_channels" for event in trace.events)


@pytest.fixture
def liquid_hardware(
    config: qc.TestConfig, monkeypatch: pytest.MonkeyPatch
) -> Tuple[MagicMock, MagicMock, List[str]]:
    """Replace only hardware endpoints while retaining the full liquid-test chain."""
    actions: List[str] = []
    api = MagicMock()
    api.is_simulator = False
    api.hardware_pipettes = {
        config.mount.to_mount(): SimpleNamespace(working_volume=config.pipette_volume)
    }
    api.aspirate.side_effect = lambda *a, **kw: actions.append("aspirate")
    api.move_rel.side_effect = lambda mount, point: actions.append(
        "lower" if point.z < 0 else "hover"
    )
    api.dispense.side_effect = lambda *a, **kw: actions.append("dispense")
    api.blow_out.side_effect = lambda *a, **kw: actions.append("blowout")
    api.retract.side_effect = lambda *a, **kw: actions.append("retract")
    ctx = MagicMock()
    ctx.is_simulating.return_value = False
    monkeypatch.setattr(qc.helpers_ot3, "update_pick_up_current", Mock())
    monkeypatch.setattr(
        qc,
        "_pick_up_tip_for_tip_volume",
        Mock(side_effect=lambda *a, **kw: actions.append("pickup")),
    )
    monkeypatch.setattr(
        qc,
        "_move_safe",
        Mock(side_effect=lambda *a, **kw: actions.append("move-to-water")),
    )
    monkeypatch.setattr(
        qc,
        "_drop_tip_in_trash",
        Mock(side_effect=lambda *a, **kw: actions.append("drop")),
    )
    monkeypatch.setattr(qc.CALIBRATED_LABWARE_LOCATIONS, "reservoir", Point(1, 2, 3))
    return api, ctx, actions


@pytest.mark.parametrize("cancel_input", [False, True])
def test_no_records_channels_before_any_dispense_or_tip_disposal(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    liquid_hardware: Tuple[MagicMock, MagicMock, List[str]],
    monkeypatch: pytest.MonkeyPatch,
    cancel_input: bool,
) -> None:
    """No immediately opens entry with tips held; cancellation never drains them."""
    api, ctx, actions = liquid_hardware
    config.num_trials = 1
    original = RuntimeError("cancelled while identifying leaking tips")

    def answer(*args: Any, **kwargs: Any) -> bool:
        actions.append("no")
        return False

    def enter_channels(*args: Any) -> Tuple[str, List[int]]:
        assert actions[-1] == "no"
        assert report["LIQUID"]["droplets-30"].result is CSVResult.FAIL
        actions.append("input-channels")
        if cancel_input:
            raise original
        return "138", [1, 3, 8]

    monkeypatch.setattr(qc.helpers_ot3, "get_user_answer", Mock(side_effect=answer))
    monkeypatch.setattr(qc, "_get_leaking_channels", Mock(side_effect=enter_channels))
    expected = [
        "pickup",
        "retract",
        "move-to-water",
        "aspirate",
        "hover",
        "aspirate",
        "no",
        "input-channels",
    ]
    if cancel_input:
        with pytest.raises(RuntimeError) as raised:
            qc.test_liquid(api, report, "LIQUID", ctx, config)
        assert raised.value is original
        assert "dispensing" not in [call.args[0] for call in ctx.comment.call_args_list]
    else:
        qc.test_liquid(api, report, "LIQUID", ctx, config)
        expected += ["lower", "dispense", "blowout", "drop"]
        api.dispense.assert_called_once_with(config.mount, 1000, is_full_dispense=True)
    assert actions == expected
    assert report["LIQUID"]["droplets-30"].result is CSVResult.FAIL
    assert report["LIQUID"]["droplets-30"].failure_reasons
    assert report["LIQUID"]["droplets-60"].result is None
    assert len(qc.FINAL_TEST_FAIL_INFOR) == 1


@pytest.mark.parametrize(
    "channels,simulate,passed", [(1, False, False), (8, False, True), (8, True, True)]
)
def test_actual_liquid_chain_keeps_other_paths_without_channel_input(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    liquid_hardware: Tuple[MagicMock, MagicMock, List[str]],
    monkeypatch: pytest.MonkeyPatch,
    channels: int,
    simulate: bool,
    passed: bool,
) -> None:
    """Single-channel No, eight-channel Yes, and simulation keep their old cleanup."""
    api, ctx, actions = liquid_hardware
    config.num_trials = 1
    config.pipette_channels = channels
    config.simulate = simulate
    api.is_simulator = simulate
    ctx.is_simulating.return_value = simulate
    answer = Mock(return_value=passed)
    monkeypatch.setattr(qc.helpers_ot3, "get_user_answer", answer)
    channel_input = Mock()
    monkeypatch.setattr(qc, "_get_leaking_channels", channel_input)

    qc.test_liquid(api, report, "LIQUID", ctx, config)

    channel_input.assert_not_called()
    assert actions[-4:] == ["lower", "dispense", "blowout", "drop"]
    expected = CSVResult.PASS if passed else CSVResult.FAIL
    assert report["LIQUID"]["droplets-30"].result is expected
    assert answer.call_count == (0 if simulate else 1)


def test_pressure_fixture_failure_does_not_request_visual_leak_channels(
    config: qc.TestConfig,
    report: CSVReport,
    trace: qc._QCTrace,
    liquid_hardware: Tuple[MagicMock, MagicMock, List[str]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Fixture pressure failures retain their own path without a droplet prompt."""
    api, ctx, actions = liquid_hardware
    fixture = Mock()
    config.pressure_fixture = fixture
    pressure = Mock(return_value=False)
    monkeypatch.setattr(qc, "_fixture_check_pressure", pressure)
    channel_input = Mock()
    monkeypatch.setattr(qc, "_get_leaking_channels", channel_input)

    qc.test_fixture(api, report, "LIQUID", ctx, config)

    pressure.assert_called_once_with(
        ctx, api, config, fixture, report, "LIQUID", qc.PRESSURE_FIXTURE_TIP_VOLUME
    )
    channel_input.assert_not_called()
    assert actions == []


@pytest.mark.parametrize("connected", [False, True])
def test_keyboard_waits_for_valid_submission_and_cleans_up(
    monkeypatch: pytest.MonkeyPatch, connected: bool
) -> None:
    """Disconnected, empty, stale, or invalid input never supplies channel evidence."""
    ctx = MagicMock()
    api = MagicMock()
    keyboard_type = Mock()
    keyboard = Mock() if connected else None
    keyboard_type.open.return_value = keyboard
    monkeypatch.setattr(
        liquid_calibration_keyboard,
        "ChannelSelectionKeyboard",
        keyboard_type,
        raising=False,
    )
    inputs = Mock()
    input_factory = Mock(return_value=inputs)
    monkeypatch.setattr(qc, "LiquidCalibrationInput", input_factory)
    monkeypatch.setattr(qc, "monotonic", Mock(return_value=100.0))
    monkeypatch.setattr(qc.OT3API, "_qc_leak_channel_input", None, raising=False)
    submissions = [
        (None, 100.0),
        ("CHANNELS:", 100.0),
        ("CHANNELS:0", 100.0),
        ("CHANNELS:9", 100.0),
        ("CHANNELS:1a", 100.0),
        ("YES", 100.0),
        ("138", 100.0),
        ("CHANNELS:2", 90.0),
        ("CHANNELS:83118", 100.0),
    ]
    pending = iter(submissions)

    def read(session: Any, *, close: bool = False) -> Tuple[Any, float]:
        assert session is inputs
        return (None, 100.0) if close else next(pending)

    api._qc_leak_channel_input.side_effect = read
    assert qc._get_leaking_channels(ctx, api) == ("83118", [1, 3, 8])
    keyboard_type.open.assert_called_once_with(ctx.comment)
    input_factory.assert_called_once_with(keyboard, ctx.comment, keyboard_type)
    inputs.discard_pending.assert_called_once_with()
    inputs.close_keyboard.assert_called_once_with()
    assert api._qc_leak_channel_input.call_args.kwargs == {"close": True}
    assert api._qc_leak_channel_input.call_count == len(submissions) + 1
    assert api.delay.call_count >= len(submissions)
    assert all(call.args == (0.1,) for call in api.delay.call_args_list)


def test_waiting_for_channels_remains_cancellable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A long empty-input wait reaches hardware cancellation checks and frees keys."""
    original = RuntimeError("protocol cancelled")
    ctx = MagicMock()
    api = MagicMock()
    keyboard_type = Mock()
    monkeypatch.setattr(
        liquid_calibration_keyboard,
        "ChannelSelectionKeyboard",
        keyboard_type,
        raising=False,
    )
    inputs = Mock()
    monkeypatch.setattr(qc, "LiquidCalibrationInput", Mock(return_value=inputs))
    monkeypatch.setattr(qc.OT3API, "_qc_leak_channel_input", None, raising=False)
    api._qc_leak_channel_input.return_value = (None, 100.0)
    api.delay.side_effect = [None, None, None, None, original]
    with pytest.raises(RuntimeError) as raised:
        qc._get_leaking_channels(ctx, api)
    assert raised.value is original
    inputs.close_keyboard.assert_called_once_with()
    api._qc_leak_channel_input.assert_called_with(inputs, close=True)

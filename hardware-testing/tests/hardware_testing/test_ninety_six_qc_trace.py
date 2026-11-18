"""96-channel evidence records existing operations without extra hardware reads."""

from __future__ import annotations

import asyncio
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from opentrons.hardware_control.types import Axis, OT3Mount
from opentrons.types import Point

from hardware_testing.data.csv_report import CSVReport, CSVResult
from hardware_testing.production_qc_protocols import ninety_six_assembly_qc_ot3 as qc


@pytest.fixture
def trace(monkeypatch: pytest.MonkeyPatch) -> qc._QCTrace:
    """Each test receives an isolated in-memory execution trace."""
    result = qc._QCTrace()
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", result)
    return result


@pytest.fixture
def report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> CSVReport:
    """Real report builders are used with all storage confined to a temporary path."""
    monkeypatch.setattr(CSVReport, "parent", property(lambda self: tmp_path))
    result = qc.build_report("ninety-six-trace-test")
    result._dont_write_to_disk = True
    result.set_tag("trace-test")
    return result


def test_call_keeps_exact_result_and_single_hardware_operation(
    trace: qc._QCTrace,
) -> None:
    """Tracing must not retry an operation, change arguments or poll another sensor."""
    hardware = MagicMock()
    expected = {"pressure": 2.5, "position": Point(1, 2, 3)}
    hardware.read_pressure.return_value = expected

    def read_pressure(mount: OT3Mount, *, sensor: str) -> Any:
        assert trace.events[-1]["status"] == "running"
        return hardware.read_pressure(mount, sensor=sensor)

    actual = qc._qc_call(read_pressure, OT3Mount.LEFT, sensor="H12")
    assert actual is expected
    assert hardware.mock_calls == [
        ("read_pressure", (OT3Mount.LEFT,), {"sensor": "H12"})
    ]
    event = trace.events[0]
    assert event["status"] == "completed"
    assert event["arguments"] == {"args": ["LEFT"], "kwargs": {"sensor": "H12"}}
    assert event["result"]["position"] == {"x": 1, "y": 2, "z": 3}
    reading = next(iter(trace.latest_readings.values()))
    assert reading["source_event_id"] == event["id"]
    assert reading["kind"] == "last_observed_not_trigger_value"
    assert trace.snapshot()["trigger_pressure"]["status"] == "unknown"


def test_cleanup_does_not_replace_original_failure_readings(trace: qc._QCTrace) -> None:
    """The failed motion keeps its pre-cleanup pressure and enclosing section."""
    original = RuntimeError("pressure limit exceeded")
    qc._qc_observe("pressure", value=7.0, sensor="H12", mount=OT3Mount.LEFT)
    with pytest.raises(RuntimeError) as raised:
        with qc._qc_step("PRESSURE", trial=2):
            try:
                with qc._qc_step("home", mount=OT3Mount.LEFT):
                    raise original
            finally:
                with qc._qc_step("retract", mount=OT3Mount.LEFT):
                    qc._qc_observe("pressure", value=0.0, sensor="H12")
    assert raised.value is original
    assert trace.last_failure is not None
    assert trace.last_failure["action"] == "home"
    assert trace.last_failure["context"] == [
        {"action": "PRESSURE", "arguments": {"trial": 2}}
    ]
    assert trace.last_failure["latest_readings"]["pressure"]["value"]["value"] == 7.0
    assert trace.latest_readings["pressure"]["value"]["value"] == 0.0
    assert trace.context == []


def test_capture_identity_uses_only_cached_metadata(trace: qc._QCTrace) -> None:
    """Serial, firmware and source identities require no new hardware operation."""
    hardware = SimpleNamespace(
        fw_version="fw-96-test",
        hardware_pipettes={
            OT3Mount.LEFT: SimpleNamespace(
                pipette_id="P1K96-TEST",
                model="p1000_96_v3",
                name="flex_96channel_1000",
                channels=96,
            ),
            OT3Mount.RIGHT: None,
        },
    )
    qc._qc_capture_identity(hardware)
    assert trace.identity["actual_pipettes"]["LEFT"]["serial"] == "P1K96-TEST"
    assert trace.identity["firmware"] == "fw-96-test"
    assert len(trace.identity["protocol"]["sha256"]) == 64
    assert trace.events == []
    assert trace.logging_errors == []


def test_labware_geometry_and_offset_use_cached_engine_api(trace: qc._QCTrace) -> None:
    """The engine's offset vector and offset ID survive alongside well geometry."""
    view = SimpleNamespace(
        get_labware_offset_vector=MagicMock(return_value=Point(1.0, -2.0, 3.0)),
        get=MagicMock(return_value=SimpleNamespace(offsetId="offset-from-lpc")),
    )
    labware = MagicMock()
    labware.parent = "D1"
    labware.load_name = "opentrons_flex_96_tiprack_1000ul"
    labware._core = SimpleNamespace(
        labware_id="rack96",
        _engine_client=SimpleNamespace(state=SimpleNamespace(labware=view)),
    )
    well = labware.__getitem__.return_value
    well.top.return_value = SimpleNamespace(point=Point(100, 200, 90))
    well.bottom.return_value = SimpleNamespace(point=Point(100, 200, 10))
    qc._qc_record_labware(labware)
    geometry = trace.labware["D1/opentrons_flex_96_tiprack_1000ul"]
    assert geometry["offset_id"] == "offset-from-lpc"
    assert geometry["offset_mm"] == {"x": 1.0, "y": -2.0, "z": 3.0}
    assert geometry["a1_top_mm"] == {"x": 100, "y": 200, "z": 90}
    assert geometry["a1_bottom_mm"] == {"x": 100, "y": 200, "z": 10}
    view.get_labware_offset_vector.assert_called_once_with("rack96")
    view.get.assert_called_once_with("rack96")
    assert trace.logging_errors == []


@pytest.mark.parametrize("passed", [False, True])
def test_returned_section_keeps_result_and_records_original_grade(
    trace: qc._QCTrace, report: CSVReport, passed: bool
) -> None:
    """Normal function return and pass/fail measurement remain distinct concepts."""
    trace.tests = {"ENCODER": {"status": "not_started"}}
    state = qc._QCFailureContext(report=report)
    hardware = MagicMock()
    context = MagicMock()

    def run_test(
        api: Any, csv: CSVReport, section: str, ctx: Any, **options: Any
    ) -> bool:
        assert api is hardware and ctx is context
        assert options == {"pipette": 1000}
        assert trace.tests["ENCODER"]["status"] == "running"
        csv(
            section,
            "encoder-96-cycles",
            [5 if passed else 2, CSVResult.from_bool(passed)],
        )
        csv(section, "encoder-96-stall", [False, CSVResult.PASS])
        csv(section, "encoder-96-cumulative-error", [0.0, CSVResult.PASS])
        csv(section, "encoder-96-abs-avg-error", [0.0, CSVResult.PASS])
        return passed

    result = qc._run_qc_test(
        run_test, hardware, report, "ENCODER", context, pipette=1000, state=state
    )
    assert result is passed
    assert state.completed_sections == ["ENCODER"]
    assert trace.tests["ENCODER"]["status"] == ("passed" if passed else "failed")
    hardware.assert_not_called()


def test_incomplete_section_is_not_implicitly_passed(
    trace: qc._QCTrace, report: CSVReport
) -> None:
    """A normally returning test with unrecorded graded rows remains incomplete."""
    trace.tests = {"ENCODER": {"status": "not_started"}}

    def run_test(
        api: Any, csv: CSVReport, section: str, ctx: Any, **options: Any
    ) -> None:
        csv(section, "encoder-96-cycles", [5, CSVResult.PASS])

    qc._run_qc_test(run_test, MagicMock(), report, "ENCODER", MagicMock(), pipette=1000)
    assert trace.tests["ENCODER"]["status"] == "completed"


def test_selection_distinguishes_configured_skip_from_not_started(
    trace: qc._QCTrace,
) -> None:
    """Selecting a section and reaching it are independently observable states."""
    qc._qc_initialize_tests({"pip_size": "1000", "skip_encoder": True})
    assert trace.tests["ENCODER"]["status"] == "skipped_by_configuration"
    assert trace.tests["PRESSURE"]["status"] == "not_started"
    assert set(trace.tests) == {section.value for section in qc.TestSection}


def test_unhandled_section_error_is_not_completed_or_replaced(
    trace: qc._QCTrace, report: CSVReport
) -> None:
    """An interrupted section stops once and retains the original exception."""
    trace.tests = {
        "ENCODER": {"status": "not_started"},
        "PRESSURE": {"status": "not_started"},
    }
    state = qc._QCFailureContext(report=report)
    original = RuntimeError("sensor disconnected")
    test_run = MagicMock(side_effect=original)
    with pytest.raises(RuntimeError) as raised:
        qc._run_qc_test(
            test_run,
            MagicMock(),
            report,
            "ENCODER",
            MagicMock(),
            pipette=1000,
            state=state,
        )
    assert raised.value is original
    test_run.assert_called_once()
    assert trace.tests["ENCODER"]["status"] == "exception"
    assert "last_handled_exception" not in trace.tests["ENCODER"]
    assert trace.last_failure is not None
    assert "sensor disconnected" in trace.last_failure["error"]
    assert state.completed_sections == []
    assert any("sensor disconnected" in entry for entry in report._qc_exception_details)


def test_handled_exception_keeps_section_failure_without_fake_runtime_abort(
    trace: qc._QCTrace, report: CSVReport
) -> None:
    """A caught sensor fault belongs to its section, not a later unrelated abort."""
    trace.tests = {"ENCODER": {"status": "not_started"}}

    def run_test(
        api: Any, csv: CSVReport, section: str, ctx: Any, **options: Any
    ) -> None:
        try:
            with qc._qc_step("encoder-motion", cycle=1):
                raise RuntimeError("caught encoder stall")
        except RuntimeError as error:
            qc._log_qc_exception(csv, ctx, section, "cycle-1", error)
        csv(section, "encoder-96-stall", [True, CSVResult.FAIL])

    qc._run_qc_test(run_test, MagicMock(), report, "ENCODER", MagicMock(), pipette=1000)
    assert trace.tests["ENCODER"]["status"] == "failed"
    assert trace.tests["ENCODER"]["last_handled_exception"]
    assert trace.last_failure is None
    assert any(
        "caught encoder stall" in entry for entry in report._qc_exception_details
    )


def test_tip_sensor_logged_then_rethrown_error_remains_fatal(
    trace: qc._QCTrace, report: CSVReport
) -> None:
    """Logging a concrete sensor tag before rethrowing does not mark it handled."""
    trace.tests = {"TIP-SENSOR": {"status": "not_started"}}
    state = qc._QCFailureContext(report=report)
    original = RuntimeError("tip presence sensor disconnected")
    read_tip = MagicMock(side_effect=original)
    hardware = SimpleNamespace(_get_tip_status=read_tip)
    tag = "tip-sensor-with-tips"

    def run_test(
        api: Any, csv: CSVReport, section: str, ctx: Any, **options: Any
    ) -> None:
        qc._read_tip_status_for_qc(api, csv, section, ctx, tag, "detection-position")

    with pytest.raises(RuntimeError) as raised:
        qc._run_qc_test(
            run_test,
            hardware,
            report,
            "TIP-SENSOR",
            MagicMock(),
            pipette=1000,
            state=state,
        )
    assert raised.value is original
    read_tip.assert_called_once_with()
    assert report["TIP-SENSOR"][tag].result_passed is False
    assert trace.tests["TIP-SENSOR"]["status"] == "exception"
    assert "last_handled_exception" not in trace.tests["TIP-SENSOR"]
    assert trace.last_failure is not None
    assert "tip presence sensor disconnected" in trace.last_failure["error"]
    assert state.completed_sections == []
    assert len(report._qc_exception_details) == 1
    assert f"{tag}/detection-position" in report._qc_exception_details[0]


@pytest.mark.parametrize("value", [None, float("nan"), float("inf")])
def test_sensor_patch_keeps_rejection_and_exactly_one_backend_read(value: Any) -> None:
    """Invalid sensor samples remain errors; recording cannot trigger retries."""
    backend = SimpleNamespace(read_pressure_sensor=AsyncMock(return_value=value))
    with pytest.raises(RuntimeError):
        asyncio.run(
            qc._read_qc_sensor_patch(
                SimpleNamespace(_backend=backend), "pressure", False
            )
        )
    backend.read_pressure_sensor.assert_awaited_once_with(OT3Mount.LEFT, False)


def test_sensor_patch_preserves_real_zero_reading() -> None:
    """A recorded zero must never become a missing-sensor error."""
    backend = SimpleNamespace(read_pressure_sensor=AsyncMock(return_value=0.0))
    value = asyncio.run(
        qc._read_qc_sensor_patch(SimpleNamespace(_backend=backend), "pressure", True)
    )
    assert value == 0.0
    backend.read_pressure_sensor.assert_awaited_once_with(OT3Mount.LEFT, True)


@pytest.mark.parametrize("body_fails", [False, True])
def test_capacitance_restore_runs_once_and_preserves_original_error(
    trace: qc._QCTrace,
    report: CSVReport,
    monkeypatch: pytest.MonkeyPatch,
    body_fails: bool,
) -> None:
    """Offset-restoration errors remain secondary to the failed sensor operation."""
    body_error = RuntimeError("original capacitance read failure")
    restore_error = ValueError("restore calibration failed")
    hardware = MagicMock()
    hardware.reset_instrument_offset.side_effect = [None, restore_error]
    body = MagicMock(side_effect=body_error if body_fails else None)
    monkeypatch.setattr(qc, "_test_capacitance_with_default_offset", body)
    expected = body_error if body_fails else restore_error
    with pytest.raises(type(expected)) as raised:
        qc.test_capacitance(hardware, report, "CAPACITANCE", MagicMock(), 1000)
    assert raised.value is expected
    body.assert_called_once()
    assert hardware.mock_calls == [
        ("reset_instrument_offset", (OT3Mount.LEFT,), {}),
        ("reset_instrument_offset", (OT3Mount.LEFT,), {"to_default": False}),
    ]
    if body_fails:
        assert len(trace.snapshot()["cleanup_errors"]) == 1


def test_axis_restoration_attempts_both_settings_without_masking_body_error(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Both existing restoration attempts happen once even when each one fails."""
    hardware = MagicMock()
    original = RuntimeError("original motion failure")
    current = MagicMock(side_effect=[None, ValueError("restore current failed")])
    speed = MagicMock(side_effect=[None, ValueError("restore speed failed")])
    monkeypatch.setattr(
        qc.helpers_ot3,
        "get_gantry_load_per_axis_motion_settings_ot3",
        MagicMock(return_value=SimpleNamespace(run_current=0.5, max_speed=10.0)),
    )
    monkeypatch.setattr(
        qc.helpers_ot3, "set_gantry_load_per_axis_current_settings_ot3_sync", current
    )
    monkeypatch.setattr(
        qc.helpers_ot3, "set_gantry_load_per_axis_motion_settings_ot3_sync", speed
    )
    with pytest.raises(RuntimeError) as raised:
        with qc._temporary_axis_settings(hardware, Axis.P_L, 0.6, 5.0):
            raise original
    assert raised.value is original
    assert current.call_count == 2
    assert speed.call_count == 2
    current.assert_called_with(hardware, Axis.P_L, run_current=0.5)
    speed.assert_called_with(hardware, Axis.P_L, default_max_speed=10.0)
    assert len(trace.snapshot()["cleanup_errors"]) == 2
    hardware.assert_not_called()

"""QC evidence records existing operations without changing hardware behavior."""

import asyncio
import hashlib
import inspect
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Optional
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest

from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.hardware_control.types import (
    FailedTipStateCheck,
    InstrumentProbeType,
    OT3Mount,
)
from opentrons.protocols.execution.execute_python import exec_run
from opentrons.types import Point
from hardware_testing.data.csv_report import CSVLine, CSVReport, CSVResult, CSVSection
from hardware_testing.production_qc_protocols import pipette_assembly_qc_ot3 as qc


@pytest.fixture
def trace(monkeypatch: pytest.MonkeyPatch) -> qc._QCTrace:
    """Use isolated evidence for every test without accessing hardware."""
    result = qc._QCTrace()
    monkeypatch.setattr(qc, "_ACTIVE_QC_TRACE", result)
    return result


def test_call_records_exact_operation_and_original_result(trace: qc._QCTrace) -> None:
    """Logging neither retries an operation nor reads any other sensor."""
    hardware = MagicMock()
    result = {"pressure": 2.5, "position": Point(1, 2, 3)}
    hardware.read_pressure.return_value = result

    def read_pressure(mount: OT3Mount, *, sensor: str) -> Any:
        assert trace.events[-1]["status"] == "running"
        return hardware.read_pressure(mount, sensor=sensor)

    actual = qc._qc_call(read_pressure, OT3Mount.LEFT, sensor="S0")
    assert actual is result
    assert hardware.mock_calls == [
        ("read_pressure", (OT3Mount.LEFT,), {"sensor": "S0"})
    ]
    event = trace.events[0]
    assert event["arguments"] == {"args": ["LEFT"], "kwargs": {"sensor": "S0"}}
    assert event["result"] == {
        "pressure": 2.5,
        "position": {"x": 1, "y": 2, "z": 3},
    }
    assert event["status"] == "completed"
    reading = next(iter(trace.latest_readings.values()))
    assert reading["source_event_id"] == event["id"]
    assert reading["kind"] == "last_observed_not_trigger_value"
    assert reading["observed_at"]
    assert trace.snapshot()["trigger_pressure"]["status"] == "unknown"


def test_adapter_records_original_sensor_name_and_reads_once(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Real adapter partials retain the original method name in pressure evidence."""
    reader = Mock(return_value=12.5)

    async def read_stem_pressure(mount: OT3Mount, sensor: str) -> float:
        return reader(mount, sensor)

    def call_coroutine_sync(loop: Any, to_call: Any, *args: Any, **kwargs: Any) -> Any:
        return asyncio.run(to_call(*args, **kwargs))

    monkeypatch.setattr(
        SynchronousAdapter, "call_coroutine_sync", staticmethod(call_coroutine_sync)
    )
    adapter = SynchronousAdapter(
        SimpleNamespace(_loop=None, read_stem_pressure=read_stem_pressure)
    )
    result = qc._qc_call(adapter.read_stem_pressure, OT3Mount.LEFT, "S0")
    assert result == 12.5
    reader.assert_called_once_with(OT3Mount.LEFT, "S0")
    assert trace.events[0]["action"] == "read_stem_pressure"
    assert trace.events[0]["arguments"]["args"] == ["LEFT", "S0"]
    key, reading = next(iter(trace.latest_readings.items()))
    assert key.startswith("read_stem_pressure:")
    assert reading["value"] == 12.5
    assert reading["source_event_id"] == trace.events[0]["id"]


def test_leaf_failure_keeps_pre_cleanup_readings(trace: qc._QCTrace) -> None:
    """A successful retreat cannot replace the action or readings at failure."""
    error = RuntimeError("pressure limit")
    qc._qc_observe("pressure", value=7.0, sensor="S1", mount=OT3Mount.LEFT)
    with pytest.raises(RuntimeError) as raised:
        with qc._qc_step("diagnostics", trial=2):
            try:
                with qc._qc_step("calibration.home", mount=OT3Mount.LEFT):
                    raise error
            finally:
                with qc._qc_step("retract", mount=OT3Mount.LEFT):
                    qc._qc_observe("pressure", value=0.0, sensor="S1")
    assert raised.value is error
    assert trace.last_failure is not None
    assert trace.last_failure["action"] == "calibration.home"
    assert trace.last_failure["finished_at"]
    assert trace.last_failure["duration_seconds"] >= 0
    assert trace.last_failure["context"] == [
        {"action": "diagnostics", "arguments": {"trial": 2}}
    ]
    assert trace.last_failure["latest_readings"]["pressure"]["value"]["value"] == 7.0
    assert trace.latest_readings["pressure"]["value"]["value"] == 0.0
    assert trace.context == []


def test_cleanup_error_does_not_replace_initial_failure(trace: qc._QCTrace) -> None:
    """The original incident remains identifiable even if cleanup also fails."""
    with pytest.raises(RuntimeError, match="cleanup failed"):
        with qc._qc_step("diagnostics"):
            try:
                with qc._qc_step("home"):
                    raise ValueError("initial pressure fault")
            finally:
                with qc._qc_step("cleanup"):
                    raise RuntimeError("cleanup failed")
    assert trace.last_failure is not None
    assert trace.last_failure["action"] == "home"
    assert "initial pressure fault" in trace.last_failure["error"]
    cleanup = next(event for event in trace.events if event["action"] == "cleanup")
    assert cleanup["status"] == "execution_error"


def test_calibration_does_not_rehome_with_probe_attached(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Calibration must not home a plunger after the probe is attached."""
    hardware = SimpleNamespace(
        home=AsyncMock(), retract=AsyncMock(), is_simulator=False
    )
    offset = Point(1, 2, 3)
    calibrate = AsyncMock(return_value=offset)
    monkeypatch.setattr(qc, "calibrate_pipette", calibrate)
    qc._qc_observe("pressure", pressure_pa=8.0, sensor="S0")
    result = asyncio.run(
        qc._calibrate_pipette_patch(
            hardware, OT3Mount.LEFT, InstrumentProbeType.SECONDARY
        )
    )
    assert result == offset
    hardware.home.assert_not_awaited()
    hardware.retract.assert_awaited_once_with(OT3Mount.LEFT)
    calibrate.assert_awaited_once_with(
        hardware, OT3Mount.LEFT, slot=5, probe=InstrumentProbeType.SECONDARY
    )
    assert trace.last_failure is None
    assert [event["action"] for event in trace.events] == ["pressure", "calibration.probe"]


@pytest.mark.parametrize("as_bytes", [False, True])
def test_engine_hashes_executed_text_without_file(
    tmp_path: Path, as_bytes: bool
) -> None:
    """Robot exec_run has no __file__; disk replacement must not change its hash."""
    filename = tmp_path / "uploaded.py"
    filename.write_text("# A different version now exists on disk.\n")
    source = (
        "import hashlib\nimport inspect\nfrom typing import Any, Dict\n"
        "from hardware_testing.production_qc_protocols.pipette_assembly_qc_ot3 "
        "import _qc_file_identity\n\n"
        + inspect.getsource(qc._qc_protocol_identity)
        + "\ndef run(ctx):\n"
        "    ctx.had_file = '__file__' in globals()\n"
        "    ctx.identity = _qc_protocol_identity()\n"
    )
    text = source.encode("utf-8") if as_bytes else source
    protocol = SimpleNamespace(
        text=text, filename=str(filename), contents=compile(text, str(filename), "exec")
    )
    context = SimpleNamespace()
    exec_run(protocol, context)
    assert context.had_file is False
    assert context.identity["sha256"] == hashlib.sha256(source.encode()).hexdigest()
    assert context.identity["source"] == "executed_protocol.text"
    assert (
        context.identity["sha256"] != hashlib.sha256(filename.read_bytes()).hexdigest()
    )


def test_capture_identity_uses_cached_hardware_metadata(
    trace: qc._QCTrace,
) -> None:
    """Identity capture requires no extra hardware command or sensor read."""
    hardware = SimpleNamespace(
        fw_version="firmware-test",
        hardware_pipettes={
            OT3Mount.LEFT: SimpleNamespace(
                pipette_id="P1KM-test",
                model="p1000_multi_v3",
                name="flex_8channel_1000",
                channels=8,
            ),
            OT3Mount.RIGHT: None,
        },
    )
    qc._qc_capture_identity(hardware)
    assert trace.identity["firmware"] == "firmware-test"
    assert trace.identity["actual_pipettes"]["LEFT"]["serial"] == "P1KM-test"
    assert len(trace.identity["protocol"]["sha256"]) == 64
    assert len(trace.identity["helpers"]["sha256"]) == 64
    assert trace.events == []
    assert trace.logging_errors == []


def test_nested_test_context_preserves_sensor_tip_and_trial(trace: qc._QCTrace) -> None:
    """Readings retain the mount, selected tip, sensor, and repeat number."""
    cfg = SimpleNamespace(mount=OT3Mount.RIGHT)
    api = Mock()
    expected = object()

    @qc._qc_traced
    def probe(api: Any, cfg: Any, tip: str, sensor: str, trial: int) -> object:
        qc._qc_observe("pressure", value=1.0)
        return expected

    assert probe(api, cfg, "A12", "S0", 2) is expected
    api.assert_not_called()
    reading = next(event for event in trace.events if event["action"] == "pressure")
    assert reading["context"] == [
        {
            "action": "probe",
            "arguments": {
                "tip": "A12",
                "sensor": "S0",
                "trial": 2,
                "mount": "RIGHT",
            },
        }
    ]


def test_capture_labware_includes_applied_offset_and_existing_targets(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Evidence distinguishes selected offsets from already-computed coordinates."""
    view = SimpleNamespace(
        get_labware_offset_vector=Mock(return_value=Point(1.2, -3.4, 5.6)),
        get=Mock(return_value=SimpleNamespace(offsetId="offset-id")),
    )
    labware = SimpleNamespace(
        uri="opentrons/test/1",
        parent="D2",
        _core=SimpleNamespace(
            labware_id="cup-id",
            _engine_client=SimpleNamespace(state=SimpleNamespace(labware=view)),
        ),
    )
    monkeypatch.setattr(qc, "LABWARE", {"cup": labware})
    monkeypatch.setattr(
        qc.CALIBRATED_LABWARE_LOCATIONS, "plate_primary", Point(100, 200, 92.107)
    )
    qc._qc_capture_labware()
    assert trace.labware["cup"] == {
        "uri": "opentrons/test/1",
        "slot": "D2",
        "offset_id": "offset-id",
        "offset_mm": {"x": 1.2, "y": -3.4, "z": 5.6},
    }
    assert trace.labware["targets_mm"]["plate_primary"] == {
        "x": 100,
        "y": 200,
        "z": 92.107,
    }
    view.get_labware_offset_vector.assert_called_once_with("cup-id")
    assert trace.events == []


@pytest.mark.parametrize(
    "result,expected",
    [(CSVResult.PASS, "passed"), (CSVResult.FAIL, "failed"), (None, "unknown")],
)
def test_execution_status_uses_actual_report_judgment(
    trace: qc._QCTrace, result: Optional[CSVResult], expected: str
) -> None:
    """Unmeasured data never acquires a passing status from returning normally."""
    report = CSVReport(
        "trace-test",
        [CSVSection("DIAGNOSTICS", [CSVLine("pressure", [float, CSVResult])])],
        dont_write_to_disk=True,
    )

    def measure() -> None:
        if result is not None:
            report("DIAGNOSTICS", "pressure", [1.0, result])

    qc._qc_execute_test("DIAGNOSTICS", measure, report)
    assert trace.tests["DIAGNOSTICS"]["status"] == expected
    assert trace.tests["DIAGNOSTICS"]["finished_at"]


def test_exception_does_not_mark_unexecuted_or_skipped_tests_failed(
    trace: qc._QCTrace,
) -> None:
    """A runtime error is distinct from a numeric failure and a configured skip."""
    trace.tests = {
        "DIAGNOSTICS": {"status": "not_started"},
        "LIQUID": {"status": "not_started"},
        "LEAK": {"status": "skipped_by_configuration"},
    }
    operation = Mock(side_effect=RuntimeError("hardware disconnected"))
    with pytest.raises(RuntimeError, match="hardware disconnected"):
        qc._qc_execute_test("DIAGNOSTICS", operation, MagicMock())
    operation.assert_called_once_with()
    assert trace.tests["DIAGNOSTICS"]["status"] == "execution_error"
    assert trace.tests["LIQUID"]["status"] == "not_started"
    assert trace.tests["LEAK"]["status"] == "skipped_by_configuration"


@pytest.mark.parametrize("result", [CSVResult.PASS, CSVResult.FAIL])
def test_handled_tip_exception_is_evidence_not_runtime_abort(
    trace: qc._QCTrace, result: CSVResult
) -> None:
    """Handled checks retain their evidence while the report owns the final verdict."""
    report = CSVReport(
        "trace-test",
        [CSVSection("TIP-SENSOR", [CSVLine("tip-state", [CSVResult])])],
        dont_write_to_disk=True,
    )

    def check_tip() -> None:
        try:
            with qc._qc_step("check_tip_state", expected="absent"):
                raise FailedTipStateCheck("tip state disagrees")
        except FailedTipStateCheck:
            report("TIP-SENSOR", "tip-state", [result])

    qc._qc_execute_test("TIP-SENSOR", check_tip, report)
    status = trace.tests["TIP-SENSOR"]
    assert status["status"] == ("passed" if result == CSVResult.PASS else "failed")
    assert status["last_handled_exception"]["action"] == "check_tip_state"
    assert "FailedTipStateCheck" in status["last_handled_exception"]["error"]
    assert trace.last_failure is None
    assert trace.failure_exception is None
    assert any(
        event["action"] == "check_tip_state" and event["status"] == "execution_error"
        for event in trace.events
    )


def test_run_restores_trace_and_does_not_leak_previous_run(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Separate runs receive unique evidence even after the first run aborts."""
    traces = []
    context = MagicMock()
    context.is_simulating.return_value = False

    def execute(ctx: Any, state: Any) -> Any:
        current = qc._ACTIVE_QC_TRACE
        assert current is not None
        assert current is not trace
        assert not current.latest_readings
        traces.append(current)
        qc._qc_observe("pressure", value=len(traces))
        if len(traces) == 1:
            raise RuntimeError("first run failed")
        return [], False

    monkeypatch.setattr(qc, "_run_qc", execute)
    archive = Mock()
    monkeypatch.setattr(qc, "_archive_runtime_failure", archive)
    with pytest.raises(RuntimeError, match="first run failed"):
        qc.run(context)
    assert qc._ACTIVE_QC_TRACE is trace
    qc.run(context)
    assert qc._ACTIVE_QC_TRACE is trace
    assert traces[0].run_id != traces[1].run_id
    assert traces[0].last_failure is not None
    assert traces[1].last_failure is None
    assert trace.events == []
    archive.assert_called_once()


@pytest.mark.parametrize("fail", [False, True])
def test_analysis_does_not_write_into_an_existing_run_trace(
    trace: qc._QCTrace, monkeypatch: pytest.MonkeyPatch, fail: bool
) -> None:
    """Simulation disables evidence capture and restores its prior state on error."""
    context = MagicMock()
    context.is_simulating.return_value = True

    def analyze(ctx: Any, state: Any) -> Any:
        assert qc._ACTIVE_QC_TRACE is None
        qc._qc_observe("analysis", value="should not be persisted")
        if fail:
            raise RuntimeError("analysis failure")
        return [], False

    monkeypatch.setattr(qc, "_run_qc", analyze)
    if fail:
        with pytest.raises(RuntimeError, match="analysis failure"):
            qc.run(context)
    else:
        qc.run(context)
    assert qc._ACTIVE_QC_TRACE is trace
    assert not trace.events

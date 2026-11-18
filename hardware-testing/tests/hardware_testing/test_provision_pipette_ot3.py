"""Verify protocol guards and subprocess handling without a physical CAN bus."""

import asyncio
from itertools import count
import json
from pathlib import Path
import struct
import subprocess
import sys
from types import ModuleType, SimpleNamespace
from typing import Optional, cast
from unittest.mock import ANY, Mock

import pytest
from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_engine.clients.transports import RunStoppedBeforeCommandError
from opentrons.protocol_engine.errors import ProtocolCommandFailedError, RunStoppedError
from opentrons.hardware_control.peripherals.barcode_scanner import BarcodeScanner
from opentrons.util.pyro.pyro_client_async_adapter import _ACPO
from opentrons_shared_data.errors.exceptions import ExecutionCancelledError

from hardware_testing.production_qc_protocols import provision_pipette_ot3 as protocol


SERIAL = "P1KSV3120211129A08"
TARGET = struct.pack(">HH16s", 0, 31, b"20211129A08").hex()
NEW_SERIAL = "P1KSV3120220101B09"
NEW_TARGET = struct.pack(">HH16s", 0, 31, b"20220101B09").hex()
REPORTED_SERIAL = "P2HHV3120250401A03"
REPORTED_TARGET = struct.pack(">HH16s", 6, 31, b"20250401A03").hex()
UNKNOWN_IDENTITY = struct.pack(">HH16s", 65535, 65535, b"unknown").hex()
BLANK = "ff" * 20


def identity(raw_hex: str) -> dict:
    """Build real-layout identity reports for worker contract tests."""
    name, model, data = struct.unpack(">HH16s", bytes.fromhex(raw_hex))
    blank = raw_hex in ("00" * 20, "ff" * 20)
    return {
        "name": name,
        "model": model,
        "data_hex": data.hex(),
        "raw_hex": raw_hex,
        "blank": blank,
        "serial": None if blank else NEW_SERIAL if raw_hex == NEW_TARGET else SERIAL,
    }


def result(action: str = "inspect", before: str = BLANK, serial: str = SERIAL) -> dict:
    """Supply the single-run worker's documented result envelope."""
    after = (
        BLANK
        if action == "clear"
        else {
            SERIAL: TARGET,
            NEW_SERIAL: NEW_TARGET,
            REPORTED_SERIAL: REPORTED_TARGET,
        }.get(serial, TARGET)
    )
    changed = action in ("write", "clear") and before != after
    return {
        "schema_version": 1,
        "action": action,
        "which": "left",
        "requested_serial": serial,
        "success": True,
        "status": "ready" if action == "inspect" else "success",
        "before": identity(before),
        "after": identity(after) if action in ("write", "clear") else None,
        "firmware": {},
        "write_attempted": changed,
        "changed": changed,
        "error": None,
    }


@pytest.fixture
def context() -> SimpleNamespace:
    """Provide only public protocol operations, with no hardware API."""
    return SimpleNamespace(
        is_simulating=lambda: False,
        params=SimpleNamespace(operation="write", restart_service=True),
        comment=Mock(),
        pause=Mock(),
        delay=Mock(),
    )


@pytest.mark.parametrize("operation", ["inspect", "write", "clear_then_write", "clear"])
def test_simulation_has_no_scanner_file_or_child_access(
    operation: str,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Analysis of every mode works without a scanner, files or installed worker."""
    ctx = context
    ctx.is_simulating = lambda: True
    ctx.params.operation = operation
    spawn = Mock(side_effect=AssertionError("Analysis must not spawn"))
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    monkeypatch.setattr(protocol, "_worker_command", Mock(side_effect=AssertionError))
    restart = Mock(side_effect=AssertionError("Analysis must not restart services"))
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    prepare_restart = Mock(
        side_effect=AssertionError("Analysis must not inspect services")
    )
    monkeypatch.setattr(protocol, "_prepare_service_restart", prepare_restart)
    scanner = Mock(side_effect=AssertionError("Analysis must not scan"))
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    protocol.run(cast(ProtocolContext, ctx))
    spawn.assert_not_called()
    scanner.assert_not_called()
    restart.assert_not_called()
    prepare_restart.assert_not_called()
    ctx.comment.assert_called_once()


@pytest.mark.parametrize("simulating", [False, True])
@pytest.mark.parametrize("operation", ["", "unknown", "write+clear", None, True])
def test_invalid_operation_is_rejected_before_any_io(
    simulating: bool,
    operation: object,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Invalid modes fail in analysis as well as execution before external access."""
    context.is_simulating = lambda: simulating
    context.params.operation = operation
    forbidden = Mock(side_effect=AssertionError("Invalid modes must not perform I/O"))
    for name in (
        "_worker_command",
        "_scan_serial",
        "_prepare_service_restart",
        "_invoke_worker",
        "_schedule_service_restart",
    ):
        monkeypatch.setattr(protocol, name, forbidden)
    with pytest.raises(ValueError):
        protocol.run(cast(ProtocolContext, context))
    forbidden.assert_not_called()
    context.pause.assert_not_called()


@pytest.mark.parametrize(
    "serial",
    [
        "",
        "P1KSV31",
        "P1KSV31A_B",
        "P1KSV３１ABC",
        "PXXXV31ABC",
        "P1KSV31" + "A" * 13,
        "P1KSV31ABC\nOTHER",
    ],
)
def test_invalid_scanned_target_is_not_partially_parsed(serial: str) -> None:
    """Reject ambiguous or malformed barcode identities."""
    with pytest.raises(ValueError):
        protocol._target_hex(serial)


def test_serial_has_exact_expected_wire_encoding() -> None:
    """The barcode maps to the same full identity that the worker will write."""
    assert protocol._target_hex(SERIAL) == TARGET


def test_operation_is_a_single_choice_defaulting_to_write() -> None:
    """Operation and optional restart settings are explicit protocol parameters."""
    parameters = Mock()
    protocol.add_parameters(parameters)
    parameters.add_str.assert_called_once()
    config = parameters.add_str.call_args.kwargs
    assert config["variable_name"] == "operation"
    assert config["default"] == "write"
    assert [choice["value"] for choice in config["choices"]] == [
        "inspect",
        "write",
        "bootstrap",
        "clear_then_write",
    ]
    parameters.add_bool.assert_called_once_with(
        variable_name="restart_service",
        display_name="写入后重启服务",
        default=False,
        description=(
            "仅对直接写入、空白首次烧录和清除后写入生效。开启后，EEPROM 验证通过且协议成功结束时自动重启 robot-server；"
            "关闭时不重启，但 App 可能暂时保留旧的移液器身份缓存。"
        ),
    )
    assert [call[0] for call in parameters.mock_calls] == ["add_str", "add_bool"]


@pytest.fixture
def installed_drivers_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Path:
    """Expose a temporary installed package to the real finder without executing scripts."""
    drivers = tmp_path / "hardware_testing" / "drivers"
    drivers.mkdir(parents=True)
    for name, path in (
        ("hardware_testing", drivers.parent),
        ("hardware_testing.drivers", drivers),
    ):
        package = ModuleType(name)
        setattr(package, "__path__", [str(path)])
        monkeypatch.setitem(sys.modules, name, package)
    for name in (
        "hardware_testing.drivers.pressure_fixture",
        "hardware_testing.drivers.provision_pipette_protocol",
    ):
        monkeypatch.delitem(sys.modules, name, raising=False)
    (drivers / "pressure_fixture.py").write_text(
        "raise AssertionError('Pressure fixture must not be imported')\n"
    )
    return drivers


def test_worker_resolves_in_drivers_package_without_importing_it(
    installed_drivers_directory: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Locate the deployed driver without executing the worker or pressure fixture."""
    worker = installed_drivers_directory / "provision_pipette_protocol.py"
    worker.write_text("raise AssertionError('Worker must not be imported')\n")
    finder = Mock(wraps=protocol.importlib.util.find_spec)
    monkeypatch.setattr(protocol.importlib.util, "find_spec", finder)
    assert protocol._worker_command() == [
        sys.executable,
        "-m",
        "hardware_testing.drivers.provision_pipette_protocol",
    ]
    finder.assert_called_once_with(
        "hardware_testing.drivers.provision_pipette_protocol"
    )
    assert "hardware_testing.drivers.pressure_fixture" not in sys.modules
    assert "hardware_testing.drivers.provision_pipette_protocol" not in sys.modules


def test_missing_driver_worker_explains_package_deployment(
    installed_drivers_directory: Path,
) -> None:
    """A sibling driver cannot substitute for a worker missing from the installed package."""
    with pytest.raises(RuntimeError) as caught:
        protocol._worker_command()
    message = str(caught.value)
    assert "hardware_testing.drivers.provision_pipette_protocol" in message
    assert "make -C hardware-testing setup push-ot3 host=" in message
    assert "重新上传" in message
    assert "hardware_testing.drivers.pressure_fixture" not in sys.modules


@pytest.mark.parametrize(
    "lookup_failure", [ImportError("no package"), ValueError("no spec")]
)
def test_worker_module_lookup_errors_fail_with_deployment_guidance(
    lookup_failure: Exception, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A broken Python installation produces a clear failure instead of a fallback command."""
    finder = Mock(side_effect=lookup_failure)
    monkeypatch.setattr(protocol.importlib.util, "find_spec", finder)
    with pytest.raises(RuntimeError) as caught:
        protocol._worker_command()
    assert "hardware_testing.drivers.provision_pipette_protocol" in str(caught.value)
    assert "Python" in str(caught.value)
    finder.assert_called_once_with(
        "hardware_testing.drivers.provision_pipette_protocol"
    )


@pytest.mark.parametrize(
    "spec", [None, SimpleNamespace(origin=None), SimpleNamespace(origin="built-in")]
)
def test_worker_module_must_have_a_source_file_origin(
    spec: object, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Missing or non-filesystem module origins cannot be selected as a deployed worker."""
    monkeypatch.setattr(protocol.importlib.util, "find_spec", Mock(return_value=spec))
    with pytest.raises(RuntimeError, match="provision_pipette|烧录驱动"):
        protocol._worker_command()


def test_stale_worker_module_source_does_not_select_another_driver(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A cached module spec is insufficient when its actual worker source is missing."""
    missing_worker = tmp_path / "provision_pipette_protocol.py"
    (tmp_path / "pressure_fixture.py").write_text("raise AssertionError\n")
    monkeypatch.setattr(
        protocol.importlib.util,
        "find_spec",
        Mock(return_value=SimpleNamespace(origin=str(missing_worker))),
    )
    with pytest.raises(RuntimeError) as caught:
        protocol._worker_command()
    assert "provision_pipette_protocol" in str(caught.value)


@pytest.mark.parametrize(
    "devices", [[], [SimpleNamespace()], [SimpleNamespace(scan_barcode="not callable")]]
)
def test_scanner_reader_rejects_absent_or_non_scanner_peripherals(
    devices: list, context: SimpleNamespace
) -> None:
    """An arbitrary connected peripheral cannot stand in for the barcode scanner."""
    context._core = SimpleNamespace(
        get_hardware=lambda: SimpleNamespace(attached_peripherals=devices)
    )
    with pytest.raises(RuntimeError, match="未检测到扫码枪"):
        protocol._scanner_reader(cast(ProtocolContext, context))


def test_scanner_reader_rejects_multiple_scanners(context: SimpleNamespace) -> None:
    """Do not choose an arbitrary scanner when multiple inputs are available."""
    devices = [Mock(spec=BarcodeScanner), Mock(spec=BarcodeScanner)]
    context._core = SimpleNamespace(
        get_hardware=lambda: SimpleNamespace(attached_peripherals=devices)
    )
    with pytest.raises(RuntimeError, match="多支扫码枪"):
        protocol._scanner_reader(cast(ProtocolContext, context))


def test_scanner_reader_rejects_unknown_interface(context: SimpleNamespace) -> None:
    """A same-named method alone does not authorize an unsafe event-loop bridge."""
    device = SimpleNamespace(scan_barcode=Mock())
    context._core = SimpleNamespace(
        get_hardware=lambda: SimpleNamespace(attached_peripherals=[device])
    )
    with pytest.raises(RuntimeError, match="硬件接口不受支持"):
        protocol._scanner_reader(cast(ProtocolContext, context))
    device.scan_barcode.assert_not_called()


def test_local_scanner_uses_existing_synchronous_adapter(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Local scanner I/O stays on its existing hardware loop."""
    device = Mock(spec=BarcodeScanner)
    read = Mock(return_value=SERIAL)
    adapter = Mock(return_value=SimpleNamespace(scan_barcode=read))
    context._core = SimpleNamespace(
        get_hardware=lambda: SimpleNamespace(attached_peripherals=[device])
    )
    monkeypatch.setattr("opentrons.hardware_control.SynchronousAdapter", adapter)
    reader = protocol._scanner_reader(cast(ProtocolContext, context))
    assert reader() == SERIAL
    adapter.assert_called_once_with(device)
    read.assert_called_once_with()
    device.scan_barcode.assert_not_called()


def test_remote_scanner_coroutine_uses_an_independent_event_loop(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Remote proxy reads run without assuming access to the hardware process loop."""
    loops = []

    class RemoteScanner(_ACPO):
        async def scan_barcode(self) -> Optional[str]:
            """Simulate a remote read, with no hardware or network access."""
            loops.append(asyncio.get_running_loop())
            return SERIAL

    device = RemoteScanner()
    context._core = SimpleNamespace(
        get_hardware=lambda: SimpleNamespace(attached_peripherals=[device])
    )
    adapter = Mock(
        side_effect=AssertionError("Remote proxy must not use local adapter")
    )
    monkeypatch.setattr("opentrons.hardware_control.SynchronousAdapter", adapter)
    reader = protocol._scanner_reader(cast(ProtocolContext, context))
    assert reader() == SERIAL
    assert reader() == SERIAL
    assert len(loops) == 2 and loops[0] is not loops[1]
    assert all(loop.is_closed() for loop in loops)
    adapter.assert_not_called()


def test_scanner_retries_invalid_input_and_trims_only_transport_whitespace(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """No-data polls and bad barcodes cannot replace the first valid scanned serial."""
    read = Mock(
        side_effect=[None, "", "not-a-pipette", "P1KSV31A_B", f" \t{SERIAL}\r\n"]
    )
    reader_factory = Mock(return_value=read)
    monkeypatch.setattr(protocol, "_scanner_reader", reader_factory)
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    serial = protocol._scan_serial(cast(ProtocolContext, context))
    assert serial == SERIAL
    reader_factory.assert_called_once_with(context)
    assert read.call_count == 5
    assert context.delay.call_count >= 4


@pytest.mark.parametrize("role", ["原条码", "新条码"])
def test_scanner_displays_its_role_immediately_before_every_blocking_read(
    role: str, context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Empty and invalid scans retain the correct App prompt while waiting for input."""
    prompt = f"请扫描左侧移液器的{role}。"
    engine = Mock()
    engine.attach_mock(context.delay, "delay")
    engine.attach_mock(context.comment, "comment")
    pending = iter([None, "", "invalid", SERIAL])
    shown = []

    def read() -> Optional[str]:
        latest = engine.mock_calls[-1]
        assert latest[0] == "comment"
        shown.append(latest.args[0])
        assert prompt in latest.args[0]
        assert "等待扫码" in latest.args[0]
        assert "自动继续" in latest.args[0]
        checkpoint = engine.mock_calls[-2]
        assert checkpoint[0] == "delay"
        assert checkpoint.kwargs == {"seconds": 0.1, "msg": latest.args[0]}
        return next(pending)

    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    assert (
        protocol._scan_serial(cast(ProtocolContext, context), prompt=prompt) == SERIAL
    )
    assert len(shown) == 4 and len(set(shown)) == 1
    messages = [call.args[0] for call in context.comment.call_args_list]
    assert sum("尚未读到条码" in message and prompt in message for message in messages) == 2
    assert any("不是有效" in message and prompt in message for message in messages)
    assert all(
        call.kwargs["msg"] == "正在核对扫码内容。" for call in context.delay.call_args_list[1::2]
    )
    context.pause.assert_not_called()


@pytest.mark.parametrize(
    "invalid",
    [
        "\ufeff" + SERIAL,
        SERIAL + "\v",
        SERIAL + "\x00",
        "P1KSV31ABC\nOTHER",
        "P1KSV３１ABC",
        "PXXXV31ABC",
        "P1KSV31" + "A" * 13,
    ],
)
def test_scanner_does_not_silently_clean_non_transport_characters(
    invalid: str,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Only space, tab and CR/LF framing may be trimmed from a scanned barcode."""
    read = Mock(side_effect=[invalid, SERIAL])
    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    assert protocol._scan_serial(cast(ProtocolContext, context)) == SERIAL
    assert read.call_count == 2


def test_scanner_has_one_overall_ten_minute_timeout(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Invalid scans do not reset the overall deadline indefinitely."""
    read = Mock(return_value="invalid")
    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(
        protocol, "monotonic", Mock(side_effect=[0.0, 599.0, 599.0, 599.0, 601.0])
    )
    assert protocol.SCAN_TIMEOUT_SECONDS == 600.0
    with pytest.raises(TimeoutError):
        protocol._scan_serial(cast(ProtocolContext, context))
    assert read.call_count == 1


def test_scanner_polling_remains_cancellable(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Protocol delay propagates cancellation while waiting for the scanner."""
    read = Mock(return_value=None)
    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    context.delay.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        protocol._scan_serial(cast(ProtocolContext, context))
    context.delay.assert_called_once()


def test_cancellation_after_read_does_not_accept_a_valid_barcode(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A stop during the scanner read is checked before accepting its result."""
    read = Mock(return_value=SERIAL)
    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    context.delay.side_effect = [None, asyncio.CancelledError()]
    with pytest.raises(asyncio.CancelledError):
        protocol._scan_serial(cast(ProtocolContext, context))
    read.assert_called_once_with()
    assert context.delay.call_count == 2


@pytest.mark.parametrize("raw", [123, SERIAL.encode("ascii")])
def test_non_text_scanner_data_is_rejected(
    raw: object,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Malformed scanner responses cannot be coerced into an identity."""
    monkeypatch.setattr(
        protocol, "_scanner_reader", Mock(return_value=Mock(return_value=raw))
    )
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    with pytest.raises(RuntimeError, match="非文本"):
        protocol._scan_serial(cast(ProtocolContext, context))


@pytest.mark.parametrize(
    "failure", [TimeoutError("scan timeout"), asyncio.CancelledError()]
)
def test_scan_failure_starts_neither_worker_nor_restart(
    failure: BaseException,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A scan failure or cancellation cannot reach CAN or service control."""
    worker = Mock(side_effect=AssertionError("No worker may run without a valid scan"))
    scan = Mock(side_effect=failure)
    monkeypatch.setattr(protocol, "_scan_serial", scan)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    monkeypatch.setattr(protocol, "_worker_command", Mock(return_value=["worker"]))
    restart = Mock()
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    monkeypatch.setattr(protocol, "_prepare_service_restart", Mock())
    context.params.operation = "write"
    with pytest.raises(type(failure)):
        protocol.run(cast(ProtocolContext, context))
    scan.assert_called_once()
    worker.assert_not_called()
    restart.assert_not_called()


@pytest.mark.parametrize(
    "field,value",
    [
        ("schema_version", 2),
        ("schema_version", True),
        ("action", "write"),
        ("which", "right"),
        ("requested_serial", "P1KSV31OTHER"),
        ("success", False),
        ("success", 1),
        ("status", "success"),
        ("write_attempted", True),
        ("write_attempted", 0),
        ("changed", True),
        ("changed", None),
        ("error", "EEPROM error"),
    ],
)
def test_result_rejects_wrong_transaction_and_false_success(
    field: str, value: object
) -> None:
    """A successful exit alone cannot authorize a write."""
    payload = result()
    payload[field] = value
    with pytest.raises(RuntimeError):
        protocol._validate_result(json.dumps(payload), 0, "inspect", "left", SERIAL)


def test_result_rejects_nonzero_exit_even_with_success_json() -> None:
    """The exit status and JSON must agree."""
    with pytest.raises(RuntimeError):
        protocol._validate_result(json.dumps(result()), 1, "inspect", "left", SERIAL)


@pytest.mark.parametrize("action", ["inspect", "write"])
def test_legacy_overwrite_refusal_exposes_identity_and_explains_worker_upgrade(
    action: str,
) -> None:
    """An old worker's mismatch error remains a failure with actionable identity details."""
    scanned = "P2HHV3120250401A03"
    payload = result(action, before=TARGET, serial=scanned)
    payload.update(
        success=False,
        status="failure",
        error=(
            "Existing identity is nonblank and differs from the requested serial. "
            "Overwrite is not supported."
        ),
    )
    payload["before"]["serial"] = scanned
    with pytest.raises(RuntimeError) as caught:
        protocol._validate_result(json.dumps(payload), 1, action, "left", scanned)
    message = str(caught.value)
    assert SERIAL in message and scanned in message and TARGET in message
    assert "旧版" in message and "重新部署 hardware-testing" in message


def test_result_checks_readback_not_just_success_flag() -> None:
    """Reject a claimed write success with unchanged blank EEPROM bytes."""
    payload = result("write")
    payload["after"] = identity(BLANK)
    with pytest.raises(RuntimeError, match="读回"):
        protocol._validate_result(json.dumps(payload), 0, "write", "left", SERIAL)


def test_result_rejects_inconsistent_identity_fields() -> None:
    """Raw bytes and decoded identity must describe the same instrument."""
    payload = result()
    payload["before"]["model"] = 31
    with pytest.raises(RuntimeError, match="矛盾"):
        protocol._validate_result(json.dumps(payload), 0, "inspect", "left", SERIAL)


@pytest.mark.parametrize("before", [BLANK, TARGET, NEW_TARGET, UNKNOWN_IDENTITY])
@pytest.mark.parametrize("field", ["write_attempted", "changed"])
def test_write_rejects_inconsistent_state_flags(before: str, field: str) -> None:
    """Do not report a changed blank identity as an idempotent operation."""
    payload = result("write", before)
    payload[field] = not payload[field]
    with pytest.raises(RuntimeError, match="写入标记"):
        protocol._validate_result(json.dumps(payload), 0, "write", "left", SERIAL)


def test_write_accepts_already_matching_identity() -> None:
    """An idempotent write command must report no change or write attempt."""
    payload = result("write", TARGET)
    assert (
        protocol._validate_result(json.dumps(payload), 0, "write", "left", SERIAL)
        == payload
    )


@pytest.mark.parametrize("before", [BLANK, "00" * 20, TARGET])
def test_clear_accepts_only_exact_erased_identity_with_consistent_flags(
    before: str,
) -> None:
    """Clear is idempotent for FF bytes and actively replaces zero or matching identities."""
    payload = result("clear", before)
    assert (
        protocol._validate_result(json.dumps(payload), 0, "clear", "left", SERIAL)
        == payload
    )
    assert payload["after"]["raw_hex"] == BLANK
    assert payload["changed"] is (before != BLANK)


@pytest.mark.parametrize("after", ["00" * 20, TARGET])
def test_clear_cannot_report_success_without_twenty_ff_bytes(after: str) -> None:
    """A zero-filled or still-programmed identity is not the canonical clear result."""
    payload = result("clear", TARGET)
    payload["after"] = identity(after)
    with pytest.raises(RuntimeError, match="读回"):
        protocol._validate_result(json.dumps(payload), 0, "clear", "left", SERIAL)


@pytest.mark.parametrize("before", [BLANK, "00" * 20, TARGET])
@pytest.mark.parametrize("field", ["write_attempted", "changed"])
def test_clear_rejects_inconsistent_change_flags(before: str, field: str) -> None:
    """A clear result must distinguish an erased identity from a write that changed it."""
    payload = result("clear", before)
    payload[field] = not payload[field]
    with pytest.raises(RuntimeError):
        protocol._validate_result(json.dumps(payload), 0, "clear", "left", SERIAL)


def test_clear_result_rejects_an_identity_different_from_the_scan() -> None:
    """Clearing still requires a matching original barcode even though direct writes can overwrite."""
    payload = result("clear", struct.pack(">HH16s", 0, 31, b"OTHER").hex())
    with pytest.raises(RuntimeError):
        protocol._validate_result(json.dumps(payload), 0, "clear", "left", SERIAL)


@pytest.mark.parametrize("before", [NEW_TARGET, UNKNOWN_IDENTITY])
def test_combined_clear_result_allows_other_identity_only_with_explicit_permission(
    before: str,
) -> None:
    """The explicit clear permission preserves the standalone clear's original-code guard."""
    payload = result("clear", before)
    with pytest.raises(RuntimeError):
        protocol._validate_result(json.dumps(payload), 0, "clear", "left", SERIAL)
    assert (
        protocol._validate_result(
            json.dumps(payload),
            0,
            "clear",
            "left",
            SERIAL,
            allow_clear_without_original=True,
        )
        == payload
    )


@pytest.mark.parametrize("after", [TARGET, "00" * 20])
def test_combined_clear_permission_still_requires_exact_ff_readback(after: str) -> None:
    """Skipping original-code matching cannot skip verification of the cleared bytes."""
    payload = result("clear", UNKNOWN_IDENTITY)
    payload["after"] = identity(after)
    with pytest.raises(RuntimeError, match="读回"):
        protocol._validate_result(
            json.dumps(payload),
            0,
            "clear",
            "left",
            SERIAL,
            allow_clear_without_original=True,
        )


@pytest.mark.parametrize("field", ["changed", "write_attempted"])
def test_combined_clear_permission_still_requires_consistent_state_flags(
    field: str,
) -> None:
    """Clearing an unrelated nonblank identity must accurately report its write attempt."""
    payload = result("clear", UNKNOWN_IDENTITY)
    payload[field] = False
    with pytest.raises(RuntimeError, match="写入标记"):
        protocol._validate_result(
            json.dumps(payload),
            0,
            "clear",
            "left",
            SERIAL,
            allow_clear_without_original=True,
        )


@pytest.mark.parametrize("action", ["inspect", "write"])
def test_clear_permission_is_invalid_for_other_actions(
    action: str, context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The clear-only option cannot leak to read or write commands or reach a worker."""
    spawn = Mock(
        side_effect=AssertionError("Invalid permission must fail before Popen")
    )
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    with pytest.raises(ValueError):
        protocol._validate_result(
            json.dumps(result(action)),
            0,
            action,
            "left",
            SERIAL,
            allow_clear_without_original=True,
        )
    with pytest.raises(ValueError):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            action,
            "left",
            SERIAL,
            allow_clear_without_original=True,
        )
    spawn.assert_not_called()


def test_combined_clear_permission_does_not_relax_the_confirmed_snapshot(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A clear result for different pre-write bytes still invalidates the confirmed operation."""
    process = Mock()
    process.communicate.return_value = (
        json.dumps(result("clear", UNKNOWN_IDENTITY)),
        "",
    )
    process.returncode = 0
    process.poll.return_value = 0
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    with pytest.raises(RuntimeError, match="原身份"):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            "clear",
            "left",
            SERIAL,
            NEW_TARGET,
            allow_clear_without_original=True,
        )


def test_old_worker_rejecting_combined_clear_option_requires_redeployment() -> None:
    """An older parser's incomplete error JSON must fail with actionable upgrade guidance."""
    stdout = json.dumps(
        {
            "error": "unrecognized arguments: --allow-clear-without-original",
            "success": False,
        }
    )
    with pytest.raises(RuntimeError) as caught:
        protocol._validate_result(
            stdout,
            2,
            "clear",
            "left",
            NEW_SERIAL,
            allow_clear_without_original=True,
        )
    assert "不支持免核对原码" in str(caught.value)
    assert "重新部署 hardware-testing" in str(caught.value)


@pytest.mark.parametrize("before", [NEW_TARGET, UNKNOWN_IDENTITY])
def test_write_result_accepts_overwrite_of_consistent_nonblank_identity(
    before: str,
) -> None:
    """A successful direct overwrite remains bound to complete before and after identities."""
    payload = result("write", before)
    assert (
        protocol._validate_result(json.dumps(payload), 0, "write", "left", SERIAL)
        == payload
    )


@pytest.mark.parametrize("before", [NEW_TARGET, UNKNOWN_IDENTITY])
def test_overwrite_result_cannot_claim_success_with_unchanged_identity(
    before: str,
) -> None:
    """Permission to overwrite never relaxes the exact target readback requirement."""
    payload = result("write", before)
    payload["after"] = identity(before)
    with pytest.raises(RuntimeError, match="读回"):
        protocol._validate_result(json.dumps(payload), 0, "write", "left", SERIAL)


@pytest.mark.parametrize(
    "raw_hex", [NEW_TARGET, struct.pack(">HH16s", 65535, 65535, b"unknown").hex()]
)
def test_inspect_accepts_a_complete_consistent_identity_different_from_the_scan(
    raw_hex: str,
) -> None:
    """Read-only inspection must expose the actual bytes even when they are unexpected."""
    payload = result(before=raw_hex)
    assert (
        protocol._validate_result(json.dumps(payload), 0, "inspect", "left", SERIAL)
        == payload
    )


@pytest.mark.parametrize("raw_hex,serial", [(TARGET, SERIAL), (NEW_TARGET, NEW_SERIAL)])
def test_identity_label_decodes_the_actual_raw_identity(
    raw_hex: str, serial: str
) -> None:
    """Displayed identity is derived from the wire bytes rather than a worker serial field."""
    assert protocol._identity_label(raw_hex) == serial


@pytest.mark.parametrize("raw_hex", [BLANK, "00" * 20])
def test_only_fully_erased_or_zeroed_identity_is_labeled_blank(raw_hex: str) -> None:
    """Both recognized blank layouts are explicitly identified as blank."""
    label = protocol._identity_label(raw_hex)
    assert "空白" in label
    assert "非空白" not in label


@pytest.mark.parametrize(
    "raw_hex",
    [
        struct.pack(">HH16s", 65535, 65535, b"unknown").hex(),
        struct.pack(">HH16s", 0, 31, b"\xff").hex(),
        "00" * 19 + "01",
    ],
)
def test_unparseable_nonblank_identity_is_not_labeled_blank(raw_hex: str) -> None:
    """Missing valid serial text does not imply an EEPROM is empty or safe to overwrite."""
    assert "非空白身份" in protocol._identity_label(raw_hex)


@pytest.mark.parametrize("blank_flag", [False, 1, None])
def test_result_rejects_inconsistent_blank_flag(blank_flag: object) -> None:
    """Blank status must be a boolean matching the actual identity bytes."""
    payload = result()
    payload["before"]["blank"] = blank_flag
    with pytest.raises(RuntimeError, match="矛盾"):
        protocol._validate_result(json.dumps(payload), 0, "inspect", "left", SERIAL)


@pytest.fixture
def prepared_run(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, context: SimpleNamespace
) -> tuple:
    """Capture hardware and restart scheduling without touching devices or services."""
    monkeypatch.setattr(protocol, "_worker_command", lambda: [sys.executable, "worker"])
    monkeypatch.setattr(
        protocol,
        "_scan_serial",
        Mock(
            side_effect=lambda ctx, **kwargs: NEW_SERIAL
            if ctx.params.operation == "clear_then_write"
            else SERIAL
        ),
    )
    events = []
    inspection_count = 0

    def invoke(
        ctx: object,
        command: list,
        action: str,
        which: str,
        serial: str,
        expected_before: Optional[str] = None,
        *,
        allow_clear_without_original: bool = False,
    ) -> dict:
        nonlocal inspection_count
        assert which == "left"
        assert serial in (SERIAL, NEW_SERIAL)
        assert allow_clear_without_original is (
            context.params.operation == "clear_then_write" and action == "clear"
        )
        events.append((action, expected_before))
        if action == "inspect":
            inspection_count += 1
            if context.params.operation == "clear_then_write":
                return result(
                    before={1: TARGET, 2: BLANK, 3: NEW_TARGET}[inspection_count],
                    serial=serial,
                )
            if context.params.operation == "clear":
                return result(before=TARGET if inspection_count == 1 else BLANK)
            return result(before=BLANK if inspection_count == 1 else TARGET)
        return result(action, TARGET if action == "clear" else BLANK, serial)

    monkeypatch.setattr(protocol, "_invoke_worker", invoke)
    context.restart_plan = object()
    context.prepare_restart = Mock(return_value=context.restart_plan)
    monkeypatch.setattr(protocol, "_prepare_service_restart", context.prepare_restart)
    context.restart = Mock(
        side_effect=lambda ctx, plan: events.append(("restart", None))
    )
    monkeypatch.setattr(protocol, "_schedule_service_restart", context.restart)
    context.pause.side_effect = lambda msg: events.append(("pause", msg))
    return context, events, tmp_path


def test_default_is_direct_write(prepared_run: tuple) -> None:
    """The default parameter follows the direct-write path without a pause."""
    ctx, events, _ = prepared_run
    protocol.run(ctx)
    assert [event[0] for event in events] == ["write", "restart"]
    ctx.pause.assert_not_called()
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)
    ctx.prepare_restart.assert_called_once_with()


@pytest.mark.parametrize("operation", ["inspect", "clear"])
def test_reported_p2hh_scan_exposes_actual_identity_and_guards_mutation(
    operation: str,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An unexpected identity stays inspectable, while clearing still requires the actual old code."""
    scanned = "P2HHV3120250401A03"
    context.params.operation = operation
    monkeypatch.setattr(protocol, "_worker_command", lambda: ["worker"])
    scanner = Mock(return_value=scanned)
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    prepare = Mock()
    restart = Mock()
    monkeypatch.setattr(protocol, "_prepare_service_restart", prepare)
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    payload = result(before=TARGET, serial=scanned)
    payload["before"][
        "serial"
    ] = scanned  # This misleading field must not hide the raw identity.
    process = Mock()
    process.communicate.return_value = (json.dumps(payload), "")
    process.returncode = 0
    process.poll.return_value = 0
    spawn = Mock(return_value=process)
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    if operation == "inspect":
        protocol.run(cast(ProtocolContext, context))
        prepare.assert_not_called()
    else:
        with pytest.raises(RuntimeError, match="不同身份") as caught:
            protocol.run(cast(ProtocolContext, context))
        message = str(caught.value)
        assert SERIAL in message and scanned in message
        assert "原码" in message
    comments = "\n".join(call.args[0] for call in context.comment.call_args_list)
    assert SERIAL in comments and scanned in comments and TARGET in comments
    if operation == "inspect":
        assert "不同" in comments
        assert "直接写入" in comments and any(word in comments for word in ("覆盖", "替换"))
    scanner.assert_called_once_with(context, prompt=ANY)
    expected_prompt = {
        "inspect": "实物标签",
        "write": "写入",
        "clear": "原条码",
    }[operation]
    assert expected_prompt in scanner.call_args.kwargs["prompt"]
    spawn.assert_called_once()
    assert (
        spawn.call_args.args[0][spawn.call_args.args[0].index("--action") + 1]
        == "inspect"
    )
    context.pause.assert_not_called()
    restart.assert_not_called()


@pytest.mark.parametrize("operation", ["inspect", "clear"])
def test_unknown_nonblank_identity_is_visible_and_never_authorizes_clearing(
    operation: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A null decoded serial is reported as unknown nonblank data, never as an empty EEPROM."""
    ctx, _, _ = prepared_run
    ctx.params.operation = operation
    raw_hex = struct.pack(">HH16s", 65535, 65535, b"unknown").hex()
    payload = result(before=raw_hex)
    payload["before"]["serial"] = None
    worker = Mock(return_value=payload)
    scanner = Mock(return_value=SERIAL)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    if operation == "inspect":
        protocol.run(ctx)
        ctx.prepare_restart.assert_not_called()
    else:
        with pytest.raises(RuntimeError, match="非空白身份"):
            protocol.run(ctx)
    comments = "\n".join(call.args[0] for call in ctx.comment.call_args_list)
    assert "非空白身份" in comments and raw_hex in comments
    scanner.assert_called_once_with(ctx, prompt=ANY)
    worker.assert_called_once()
    ctx.pause.assert_not_called()
    ctx.restart.assert_not_called()


@pytest.mark.parametrize(
    "before,scanned",
    [
        (NEW_TARGET, SERIAL),
        (UNKNOWN_IDENTITY, SERIAL),
        (TARGET, REPORTED_SERIAL),
    ],
)
def test_direct_write_starts_immediately_and_reuses_worker_readback(
    before: str,
    scanned: str,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Direct write skips the pause and uses the worker's verified readback."""
    context.params.operation = "write"
    monkeypatch.setattr(protocol, "_worker_command", lambda: ["worker"])
    scanner = Mock(return_value=scanned)
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    plan = object()
    prepare = Mock(return_value=plan)
    restart = Mock()
    monkeypatch.setattr(protocol, "_prepare_service_restart", prepare)
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    responses = [result("write", before, scanned)]
    processes = []
    for payload in responses:
        process = Mock()
        process.communicate.return_value = (json.dumps(payload), "")
        process.returncode = 0
        process.poll.return_value = 0
        processes.append(process)
    spawn = Mock(side_effect=processes)
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    order = Mock()
    order.attach_mock(prepare, "prepare")
    order.attach_mock(scanner, "scan")
    order.attach_mock(spawn, "worker")
    order.attach_mock(context.pause, "pause")
    order.attach_mock(restart, "restart")
    protocol.run(cast(ProtocolContext, context))
    assert [call[0] for call in order.mock_calls] == [
        "prepare",
        "scan",
        "worker",
        "restart",
    ]
    commands = [call.args[0] for call in spawn.call_args_list]
    assert [command[command.index("--action") + 1] for command in commands] == [
        "write",
    ]
    assert all(
        command[command.index("--serial") + 1] == scanned for command in commands
    )
    assert "--expected-before-hex" not in commands[0]
    scanner.assert_called_once_with(context, prompt=ANY)
    context.pause.assert_not_called()
    restart.assert_called_once_with(context, plan)


def test_direct_write_does_not_pause_for_unknown_identity(
    prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An unknown current identity does not reintroduce a confirmation dialog."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "write"
    target_serial = NEW_SERIAL
    monkeypatch.setattr(protocol, "_scan_serial", Mock(return_value=target_serial))
    worker = Mock(return_value=result("write", UNKNOWN_IDENTITY, serial=target_serial))
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    ctx.pause.side_effect = RuntimeError("Stop before overwrite")
    protocol.run(ctx)
    worker.assert_called_once()
    ctx.pause.assert_not_called()
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


def test_bootstrap_pauses_to_install_blank_pipette_before_can_write(
    prepared_run: tuple,
) -> None:
    """The App bootstrap mode starts without a pipette, then writes after installation."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "bootstrap"
    protocol.run(ctx)
    assert [event[0] for event in events] == ["pause", "write", "restart"]
    assert "未连接" in events[0][1]
    assert events[1] == ("write", None)
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


@pytest.mark.parametrize("operation", ["inspect", "write", "clear_then_write", "clear"])
def test_run_creates_no_provisioning_files(
    operation: str,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Every operation mode keeps results in memory without creating a report directory."""
    ctx, _, directory = prepared_run
    ctx.params.operation = operation
    monkeypatch.chdir(directory)
    file_access = Mock(
        side_effect=AssertionError("No provisioning files may be opened")
    )
    mkdir = Mock(side_effect=AssertionError("No report directory may be created"))
    with monkeypatch.context() as guard:
        guard.setattr("builtins.open", file_access)
        guard.setattr("io.open", file_access)
        guard.setattr(Path, "mkdir", mkdir)
        protocol.run(ctx)
    file_access.assert_not_called()
    mkdir.assert_not_called()
    assert list(directory.iterdir()) == []


def test_write_uses_one_worker_readback_without_pause(
    prepared_run: tuple,
) -> None:
    """The direct write path uses one worker transaction without a pause."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "write"
    protocol.run(ctx)
    assert [event[0] for event in events] == [
        "write",
        "restart",
    ]
    assert events[0] == ("write", None)
    ctx.pause.assert_not_called()
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


@pytest.mark.parametrize("operation", ["write", "clear_then_write"])
def test_write_modes_can_skip_service_restart(
    operation: str, prepared_run: tuple
) -> None:
    """EEPROM verification succeeds without a systemd preflight or restart job."""
    ctx, events, _ = prepared_run
    ctx.params.operation = operation
    ctx.params.restart_service = False
    protocol.run(ctx)
    assert "restart" not in [event[0] for event in events]
    ctx.prepare_restart.assert_not_called()
    ctx.restart.assert_not_called()


def test_clear_requires_confirmation_and_independent_readback_without_restart(
    prepared_run: tuple,
) -> None:
    """Clearing preserves the active hardware session and never schedules service control."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "clear"
    protocol.run(ctx)
    assert [event[0] for event in events] == ["inspect", "pause", "clear", "inspect"]
    assert events[2] == ("clear", TARGET)
    confirmation = events[1][1]
    assert "left" in confirmation and SERIAL in confirmation
    assert "20" in confirmation and "FF" in confirmation
    assert "识别" in confirmation
    ctx.prepare_restart.assert_not_called()
    ctx.restart.assert_not_called()


def test_clear_scans_once_and_uses_the_confirmed_identity_on_the_left(
    prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """One old serial and its exact snapshot are bound to confirmation and clear."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear"
    ctx.params.which = "right"
    scanner = Mock(return_value=SERIAL)
    worker = Mock(
        side_effect=[result(before=TARGET), result("clear", TARGET), result()]
    )
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    protocol.run(ctx)
    scanner.assert_called_once_with(ctx, prompt=ANY)
    assert [call.args[2] for call in worker.call_args_list] == [
        "inspect",
        "clear",
        "inspect",
    ]
    assert all(call.args[3:5] == ("left", SERIAL) for call in worker.call_args_list)
    assert worker.call_args_list[1].args[5] == TARGET
    ctx.prepare_restart.assert_not_called()
    ctx.restart.assert_not_called()


def test_clear_of_a_different_scanned_identity_stops_before_confirmation(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A mismatched preflight result cannot reach confirmation or a clear command."""
    context.params.operation = "clear"
    monkeypatch.setattr(protocol, "_worker_command", lambda: ["worker"])
    monkeypatch.setattr(protocol, "_scan_serial", Mock(return_value=SERIAL))
    restart = Mock(side_effect=AssertionError("Clear must not access service control"))
    monkeypatch.setattr(protocol, "_prepare_service_restart", restart)
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    wrong_identity = struct.pack(">HH16s", 0, 31, b"OTHER").hex()
    process = Mock()
    process.communicate.return_value = (json.dumps(result(before=wrong_identity)), "")
    process.returncode = 0
    process.poll.return_value = 0
    spawn = Mock(return_value=process)
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    with pytest.raises(RuntimeError, match="不同身份"):
        protocol.run(cast(ProtocolContext, context))
    context.pause.assert_not_called()
    spawn.assert_called_once()
    argv = spawn.call_args.args[0]
    assert argv[argv.index("--action") + 1] == "inspect"
    restart.assert_not_called()


@pytest.mark.parametrize("observed", [TARGET, "00" * 20])
def test_clear_fresh_inspection_requires_exact_erased_bytes(
    observed: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A claimed clear result cannot replace independent verification of twenty FF bytes."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear"
    monkeypatch.setattr(
        protocol,
        "_invoke_worker",
        Mock(
            side_effect=[
                result(before=TARGET),
                result("clear", TARGET),
                result(before=observed),
            ]
        ),
    )
    with pytest.raises(RuntimeError, match="独立复查"):
        protocol.run(ctx)
    ctx.prepare_restart.assert_not_called()
    ctx.restart.assert_not_called()


def test_cancel_clear_confirmation_never_launches_clear_or_restart(
    prepared_run: tuple,
) -> None:
    """Cancellation at the destructive-operation confirmation leaves EEPROM untouched."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "clear"
    ctx.pause.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        protocol.run(ctx)
    assert events == [("inspect", None)]
    ctx.prepare_restart.assert_not_called()
    ctx.restart.assert_not_called()


def test_write_scans_once_and_always_uses_left(
    prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """One barcode remains the target through the single-worker write path."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "write"
    ctx.params.which = "right"

    scanner = Mock(return_value=SERIAL)
    worker = Mock(return_value=result("write"))
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    protocol.run(ctx)
    scanner.assert_called_once()
    assert protocol.TARGET_MOUNT == "left"
    assert worker.call_count == 1
    assert [call.args[2] for call in worker.call_args_list] == ["write"]
    assert all(call.args[3] == "left" for call in worker.call_args_list)
    assert all(call.args[4] == SERIAL for call in worker.call_args_list)
    ctx.pause.assert_not_called()
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


@pytest.mark.parametrize("operation", ["write", "clear_then_write"])
def test_restart_preflight_precedes_scan_and_cannot_create_a_restart_job(
    operation: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An unavailable restart path stops the run before scanning or changing EEPROM."""
    ctx, events, _ = prepared_run
    ctx.params.operation = operation
    ctx.prepare_restart.side_effect = RuntimeError("Restart preflight failed")
    scan = Mock(side_effect=AssertionError("A failed preflight must not scan"))
    monkeypatch.setattr(protocol, "_scan_serial", scan)
    with pytest.raises(RuntimeError, match="preflight"):
        protocol.run(ctx)
    assert events == []
    scan.assert_not_called()
    ctx.restart.assert_not_called()


def test_direct_write_does_not_wait_for_confirmation(prepared_run: tuple) -> None:
    """A confirmation cancellation hook cannot block direct write."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "write"
    ctx.pause.side_effect = asyncio.CancelledError
    protocol.run(ctx)
    assert [event[0] for event in events] == ["write", "restart"]
    ctx.pause.assert_not_called()
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


@pytest.mark.parametrize("before", [BLANK, NEW_TARGET, UNKNOWN_IDENTITY])
def test_direct_write_rejects_worker_readback_mismatch(
    before: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A worker write success is insufficient if its readback disagrees."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "write"
    write_result = result("write", before)
    write_result["after"] = identity(NEW_TARGET)
    write_result["changed"] = before != NEW_TARGET
    write_result["write_attempted"] = before != NEW_TARGET
    monkeypatch.setattr(
        protocol,
        "_invoke_worker",
        Mock(return_value=write_result),
    )
    with pytest.raises(RuntimeError, match="读回值"):
        protocol.run(ctx)
    ctx.restart.assert_not_called()


@pytest.mark.parametrize(
    "action,failed_phase",
    [("write", 0), ("clear", 0), ("clear", 1), ("clear", 2)],
)
@pytest.mark.parametrize(
    "failure", [RuntimeError("worker failed"), asyncio.CancelledError()]
)
def test_any_worker_failure_prevents_service_restart(
    failed_phase: int,
    action: str,
    failure: BaseException,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Only completion of every worker phase may schedule a service restart."""
    ctx, _, _ = prepared_run
    ctx.params.operation = action
    before, after = (BLANK, TARGET) if action == "write" else (TARGET, BLANK)
    responses = [result(action, before)]
    if action == "clear":
        responses.append(result(before=after))
    worker = Mock(side_effect=[*responses[:failed_phase], failure])
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(type(failure)):
        protocol.run(ctx)
    assert worker.call_count == failed_phase + 1
    ctx.restart.assert_not_called()
    if action == "clear":
        ctx.prepare_restart.assert_not_called()


def rewrite_responses(new_serial: str = NEW_SERIAL, before: str = TARGET) -> list:
    """Model old identity, verified erase, new write, then independent new readback."""
    new_target = NEW_TARGET if new_serial == NEW_SERIAL else TARGET
    return [
        result(before=before, serial=new_serial),
        result("clear", before, new_serial),
        result(serial=new_serial),
        result("write", BLANK, new_serial),
        result(before=new_target, serial=new_serial),
    ]


@pytest.mark.parametrize("new_serial", [NEW_SERIAL, SERIAL])
def test_clear_then_write_scans_only_target_and_uses_separate_snapshots(
    new_serial: str,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """One target scan precedes confirmation; clear and write use their own verified snapshots."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    ctx.params.which = "right"
    scanner = Mock(return_value=new_serial)
    worker = Mock(side_effect=rewrite_responses(new_serial))
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    order = Mock()
    order.attach_mock(ctx.prepare_restart, "prepare")
    order.attach_mock(scanner, "scan")
    order.attach_mock(worker, "worker")
    order.attach_mock(ctx.pause, "pause")
    order.attach_mock(ctx.restart, "restart")
    protocol.run(ctx)
    assert [call[0] for call in order.mock_calls] == [
        "prepare",
        "scan",
        "worker",
        "pause",
        "worker",
        "worker",
        "worker",
        "worker",
        "restart",
    ]
    ctx.pause.assert_called_once()
    scanner.assert_called_once_with(ctx, prompt=ANY)
    assert "新条码" in scanner.call_args.kwargs["prompt"]
    assert SERIAL in ctx.pause.call_args.args[0]
    assert new_serial in ctx.pause.call_args.args[0]
    assert [call.args[2:] for call in worker.call_args_list] == [
        ("inspect", "left", new_serial),
        ("clear", "left", new_serial, TARGET),
        ("inspect", "left", new_serial),
        ("write", "left", new_serial, BLANK),
        ("inspect", "left", new_serial),
    ]
    assert [call.kwargs for call in worker.call_args_list] == [
        {},
        {"allow_clear_without_original": True},
        {},
        {},
        {},
    ]
    ctx.restart.assert_called_once_with(ctx, ctx.restart_plan)


def test_combined_target_scan_prompt_remains_visible_without_changing_mutation_order(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The actual scanner helper keeps the target prompt visible until one barcode is read."""
    context.params.operation = "clear_then_write"
    events = []
    engine = Mock()
    engine.attach_mock(context.delay, "delay")
    engine.attach_mock(context.comment, "comment")
    scans = iter([None, "invalid new", NEW_SERIAL])

    def read() -> Optional[str]:
        message = engine.mock_calls[-1]
        assert message[0] == "comment"
        assert "新条码" in message.args[0]
        events.append("scan")
        return next(scans)

    responses = iter(rewrite_responses())

    def invoke(*args: object, **kwargs: object) -> dict:
        events.append(str(args[2]))
        return next(responses)

    plan = object()

    def prepare_restart() -> object:
        events.append("prepare")
        return plan

    monkeypatch.setattr(protocol, "_worker_command", lambda: ["worker"])
    monkeypatch.setattr(protocol, "_scanner_reader", Mock(return_value=read))
    monkeypatch.setattr(protocol, "monotonic", Mock(return_value=0.0))
    monkeypatch.setattr(protocol, "_invoke_worker", invoke)
    monkeypatch.setattr(protocol, "_prepare_service_restart", prepare_restart)
    restart = Mock(side_effect=lambda *args: events.append("restart"))
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    context.pause.side_effect = lambda message: events.append("pause")
    protocol.run(cast(ProtocolContext, context))
    assert events == [
        "prepare",
        "scan",
        "scan",
        "scan",
        "inspect",
        "pause",
        "clear",
        "inspect",
        "write",
        "inspect",
        "restart",
    ]
    context.pause.assert_called_once()
    restart.assert_called_once_with(context, plan)


@pytest.mark.parametrize("failed_phase", range(5))
@pytest.mark.parametrize(
    "failure", [RuntimeError("worker failed"), asyncio.CancelledError()]
)
def test_clear_then_write_stops_at_every_failed_or_cancelled_worker_phase(
    failed_phase: int,
    failure: BaseException,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Any failed phase prevents later work, blind recovery writes and service restart."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    responses = rewrite_responses()
    worker = Mock(side_effect=[*responses[:failed_phase], failure])
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(type(failure)) as caught:
        protocol.run(ctx)
    assert caught.value is failure
    assert worker.call_count == failed_phase + 1
    ctx.restart.assert_not_called()


@pytest.mark.parametrize(
    "failure",
    [
        RunStoppedBeforeCommandError(Mock(commandType="comment", id="cancelled")),
        RunStoppedError(),
        ExecutionCancelledError(),
        ProtocolCommandFailedError(wrapping=[ExecutionCancelledError()]),
    ],
)
def test_engine_stop_errors_after_clear_propagate_unchanged(
    failure: Exception,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Real engine cancellation exceptions keep their type and identity after erase."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    worker = Mock(side_effect=[*rewrite_responses()[:3], failure])
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(type(failure)) as caught:
        protocol.run(ctx)
    assert caught.value is failure
    assert [call.args[2] for call in worker.call_args_list] == [
        "inspect",
        "clear",
        "inspect",
        "write",
    ]
    ctx.restart.assert_not_called()


def test_combined_confirmation_fits_app_limit_with_maximum_length_barcodes(
    prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The current identity and 19-character target leave all confirmation warnings visible."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    old_serial = "P1KSV31" + "A" * 12
    new_serial = "P1KSV31" + "B" * 12
    assert len(old_serial) == len(new_serial) == 19
    old_raw = struct.pack(">HH16s", 0, 31, b"A" * 12).hex()
    worker = Mock(return_value=result(before=old_raw, serial=new_serial))
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    monkeypatch.setattr(protocol, "_scan_serial", Mock(return_value=new_serial))
    ctx.pause.side_effect = RuntimeError("Stop before mutation")
    with pytest.raises(RuntimeError, match="Stop before mutation"):
        protocol.run(ctx)
    ctx.pause.assert_called_once()
    prompt = ctx.pause.call_args.args[0]
    assert len(prompt) <= 217
    assert old_serial in prompt and new_serial in prompt
    assert any(warning in prompt for warning in ("不会自动回滚", "不自动回滚"))
    assert "重启服务" in prompt
    assert prompt.endswith("App 短暂断连。")
    worker.assert_called_once()
    ctx.restart.assert_not_called()


@pytest.mark.parametrize(
    "failure", [TimeoutError("scanner timed out"), asyncio.CancelledError()]
)
def test_combined_target_scan_failure_leaves_the_old_identity_untouched(
    failure: BaseException,
    prepared_run: tuple,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The new barcode must be acquired before confirmation or any EEPROM mutation."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    scanner = Mock(side_effect=failure)
    worker = Mock(return_value=result(before=TARGET))
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(type(failure)) as caught:
        protocol.run(ctx)
    if isinstance(failure, asyncio.CancelledError):
        assert caught.value is failure
    scanner.assert_called_once_with(ctx, prompt=ANY)
    worker.assert_not_called()
    ctx.pause.assert_not_called()
    ctx.restart.assert_not_called()


@pytest.mark.parametrize("new_serial", ["", "P1KSV31A_B"])
def test_new_barcode_is_validated_before_clearing(
    new_serial: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A malformed replacement identity cannot leave the pipette erased."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    worker = Mock(return_value=result(before=TARGET))
    monkeypatch.setattr(protocol, "_scan_serial", Mock(return_value=new_serial))
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(ValueError):
        protocol.run(ctx)
    worker.assert_called_once()
    assert worker.call_args.args[2:] == ("inspect", "left", new_serial)
    ctx.pause.assert_not_called()
    ctx.restart.assert_not_called()


@pytest.mark.parametrize("before", [TARGET, UNKNOWN_IDENTITY])
def test_combined_replaces_different_or_unknown_identity_with_one_target_scan(
    before: str, context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Only the combined clear receives permission to skip matching the original barcode."""
    context.params.operation = "clear_then_write"
    monkeypatch.setattr(protocol, "_worker_command", lambda: ["worker"])
    monkeypatch.setattr(protocol, "_prepare_service_restart", Mock())
    scanner = Mock(return_value=NEW_SERIAL)
    monkeypatch.setattr(protocol, "_scan_serial", scanner)
    restart = Mock()
    monkeypatch.setattr(protocol, "_schedule_service_restart", restart)
    processes = []
    for payload in rewrite_responses(before=before):
        process = Mock()
        process.communicate.return_value = (json.dumps(payload), "")
        process.returncode = 0
        process.poll.return_value = 0
        processes.append(process)
    spawn = Mock(side_effect=processes)
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    protocol.run(cast(ProtocolContext, context))
    scanner.assert_called_once_with(context, prompt=ANY)
    commands = [call.args[0] for call in spawn.call_args_list]
    assert [command[command.index("--action") + 1] for command in commands] == [
        "inspect",
        "clear",
        "inspect",
        "write",
        "inspect",
    ]
    assert all(
        command[command.index("--serial") + 1] == NEW_SERIAL for command in commands
    )
    assert ["--allow-clear-without-original" in command for command in commands] == [
        False,
        True,
        False,
        False,
        False,
    ]
    assert commands[1][commands[1].index("--expected-before-hex") + 1] == before
    assert commands[3][commands[3].index("--expected-before-hex") + 1] == BLANK
    context.pause.assert_called_once()
    confirmation = context.pause.call_args.args[0]
    assert (
        protocol._identity_label(before) in confirmation and NEW_SERIAL in confirmation
    )
    restart.assert_called_once()


def test_cancel_combined_confirmation_never_clears(prepared_run: tuple) -> None:
    """After the target scan, cancelling the single confirmation preserves old EEPROM."""
    ctx, events, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    failure = asyncio.CancelledError()
    ctx.pause.side_effect = failure
    with pytest.raises(asyncio.CancelledError) as caught:
        protocol.run(ctx)
    assert caught.value is failure
    assert events == [("inspect", None)]
    ctx.restart.assert_not_called()


@pytest.mark.parametrize("observed", [TARGET, "00" * 20])
def test_clear_then_write_never_writes_after_unverified_erase(
    observed: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Zero-filled or unchanged bytes stop the combined operation before writing a new serial."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    worker = Mock(
        side_effect=[
            result(before=TARGET, serial=NEW_SERIAL),
            result("clear", TARGET, NEW_SERIAL),
            result(before=observed, serial=NEW_SERIAL),
        ]
    )
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(RuntimeError, match="独立复查"):
        protocol.run(ctx)
    assert [call.args[2] for call in worker.call_args_list] == [
        "inspect",
        "clear",
        "inspect",
    ]
    ctx.restart.assert_not_called()


@pytest.mark.parametrize("observed", [BLANK, TARGET])
def test_clear_then_write_never_restarts_without_independent_new_identity(
    observed: str, prepared_run: tuple, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A successful write response is insufficient when the final inspection disagrees."""
    ctx, _, _ = prepared_run
    ctx.params.operation = "clear_then_write"
    responses = rewrite_responses()
    responses[-1] = result(before=observed, serial=NEW_SERIAL)
    worker = Mock(side_effect=responses)
    monkeypatch.setattr(protocol, "_invoke_worker", worker)
    with pytest.raises(RuntimeError, match="独立复查"):
        protocol.run(ctx)
    assert worker.call_count == 5
    ctx.restart.assert_not_called()


def test_real_child_contract_keeps_results_in_memory(
    context: SimpleNamespace, tmp_path: Path
) -> None:
    """Exercise real child launch/JSON capture with a harmless fixture program."""
    child = tmp_path / "child.py"
    child.write_text(f"print({json.dumps(result())!r})\n")
    response = protocol._invoke_worker(
        cast(ProtocolContext, context),
        [sys.executable, str(child)],
        "inspect",
        "left",
        SERIAL,
    )
    assert response["before"]["raw_hex"] == BLANK
    assert list(tmp_path.iterdir()) == [child]


@pytest.mark.parametrize("action", ["write", "clear"])
def test_worker_output_uses_pipes_without_a_log_file(
    action: str, context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Worker stdout and stderr are captured rather than redirected to persistent files."""
    process = Mock()
    before, after = (BLANK, TARGET) if action == "write" else (TARGET, BLANK)
    process.communicate.return_value = (
        json.dumps(result(action, before)),
        "worker diagnostic",
    )
    process.returncode = 0
    process.poll.return_value = 0
    spawn = Mock(return_value=process)
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    response = protocol._invoke_worker(
        cast(ProtocolContext, context), ["worker"], action, "left", SERIAL, before
    )
    assert response["after"]["raw_hex"] == after
    argv = spawn.call_args.args[0]
    assert argv[argv.index("--action") + 1] == action
    assert argv[argv.index("--serial") + 1] == SERIAL
    assert argv[argv.index("--expected-before-hex") + 1] == before
    assert "--log-file" not in argv
    assert "--allow-clear-without-original" not in argv
    assert spawn.call_args.kwargs == {
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.PIPE,
        "stderr": subprocess.PIPE,
        "text": True,
    }


@pytest.mark.parametrize("action", ["inspect", "write", "clear"])
def test_worker_rejects_right_mount_before_starting_a_process(
    action: str,
    context: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An internal caller cannot override the protocol's fixed left target."""
    spawn = Mock(side_effect=AssertionError("The right mount must never reach CAN"))
    monkeypatch.setattr(protocol.subprocess, "Popen", spawn)
    with pytest.raises(ValueError, match="左侧"):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            action,
            "right",
            SERIAL,
            BLANK if action in ("write", "clear") else None,
        )
    spawn.assert_not_called()


def test_bad_child_output_cannot_be_success(
    context: SimpleNamespace, tmp_path: Path
) -> None:
    """Noisy output or a bare success message fails closed."""
    child = tmp_path / "child.py"
    child.write_text("print('SUCCESS')\n")
    with pytest.raises(RuntimeError, match="JSON"):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            [sys.executable, str(child)],
            "inspect",
            "left",
            SERIAL,
        )


def test_worker_is_terminated_on_cancel(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Cancellation during polling still terminates and reaps the worker."""
    process = Mock()
    process.poll.return_value = None
    process.communicate.side_effect = [
        subprocess.TimeoutExpired("worker", 0.2),
        ("", ""),
    ]
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    context.delay.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            "write",
            "left",
            SERIAL,
            BLANK,
        )
    process.terminate.assert_called_once()


def test_worker_deadline_is_enforced(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A worker stuck before returning a result cannot run indefinitely."""
    process = Mock()
    process.poll.return_value = None
    process.communicate.return_value = ("", "")
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    monkeypatch.setattr(protocol, "monotonic", Mock(side_effect=[0.0, 31.0]))
    with pytest.raises(TimeoutError):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            "inspect",
            "left",
            SERIAL,
        )
    process.terminate.assert_called_once()


def test_cleanup_failure_preserves_original_cancellation(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Keep cancellation as the primary error if worker cleanup also fails."""
    process = Mock()
    process.communicate.side_effect = subprocess.TimeoutExpired("worker", 0.2)
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    monkeypatch.setattr(
        protocol, "_stop_worker", Mock(side_effect=OSError("cannot reap worker"))
    )
    context.delay.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            "write",
            "left",
            SERIAL,
            BLANK,
        )


def test_cleanup_failure_cannot_report_success(
    context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A clean worker response does not hide failure to clean up the process."""
    process = Mock()
    process.communicate.return_value = (json.dumps(result()), "")
    process.returncode = 0
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    monkeypatch.setattr(
        protocol, "_stop_worker", Mock(side_effect=OSError("cannot reap worker"))
    )
    with pytest.raises(OSError, match="cannot reap"):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            "inspect",
            "left",
            SERIAL,
        )


@pytest.mark.parametrize("action", ["write", "clear"])
def test_writer_result_must_match_confirmed_before(
    action: str, context: SimpleNamespace, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Reject a worker response describing a different pre-write snapshot."""
    process = Mock()
    process.communicate.return_value = (json.dumps(result(action, TARGET)), "")
    process.returncode = 0
    process.poll.return_value = 0
    monkeypatch.setattr(protocol.subprocess, "Popen", Mock(return_value=process))
    with pytest.raises(RuntimeError, match="原身份"):
        protocol._invoke_worker(
            cast(ProtocolContext, context),
            ["worker"],
            action,
            "left",
            SERIAL,
            BLANK,
        )


@pytest.fixture
def restart_environment(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    """Supply a running server and run without contacting systemd or an HTTP socket."""
    command = Mock(
        return_value=SimpleNamespace(stdout="LoadState=loaded\nActiveState=active\n")
    )
    get = Mock(
        side_effect=[
            {"links": {"current": {"href": "/runs/provision-123"}}},
            {"data": {"id": "provision-123", "current": True, "status": "running"}},
        ]
    )
    monkeypatch.setattr(protocol.shutil, "which", lambda name: f"/usr/bin/{name}")
    monkeypatch.setattr(protocol.subprocess, "run", command)
    monkeypatch.setattr(protocol, "_robot_server_get", get)
    return SimpleNamespace(command=command, get=get)


def test_restart_preflight_only_inspects_service_and_current_run(
    restart_environment: SimpleNamespace,
) -> None:
    """Preflight binds to the active run without scheduling or restarting anything."""
    plan = protocol._prepare_service_restart()
    assert plan == protocol._RestartPlan(
        "/runs/provision-123", "/usr/bin/systemd-run", "/usr/bin/systemctl"
    )
    restart_environment.command.assert_called_once()
    argv = restart_environment.command.call_args.args[0]
    assert argv == [
        "/usr/bin/systemctl",
        "--no-ask-password",
        "show",
        "--property=LoadState",
        "--property=ActiveState",
        "opentrons-robot-server.service",
    ]
    assert [call.args[0] for call in restart_environment.get.call_args_list] == [
        "/runs?pageLength=1",
        "/runs/provision-123",
    ]


@pytest.mark.parametrize("missing", ["systemd-run", "systemctl"])
def test_restart_preflight_requires_both_commands(
    missing: str,
    restart_environment: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The run cannot enter write mode when a required service command is absent."""
    monkeypatch.setattr(
        protocol.shutil,
        "which",
        lambda name: None if name == missing else f"/bin/{name}",
    )
    with pytest.raises(RuntimeError, match="未开始烧录"):
        protocol._prepare_service_restart()
    restart_environment.command.assert_not_called()
    restart_environment.get.assert_not_called()


@pytest.mark.parametrize(
    "properties",
    [
        "",
        "LoadState=not-found\nActiveState=active",
        "LoadState=loaded\nActiveState=failed",
    ],
)
def test_restart_preflight_rejects_unavailable_service(
    properties: str, restart_environment: SimpleNamespace
) -> None:
    """A missing or inactive robot server cannot be accepted as a restart target."""
    restart_environment.command.return_value.stdout = properties
    with pytest.raises(RuntimeError, match="未开始烧录"):
        protocol._prepare_service_restart()
    restart_environment.get.assert_not_called()


@pytest.mark.parametrize(
    "failure",
    [
        OSError("missing"),
        subprocess.CalledProcessError(1, "systemctl"),
        subprocess.TimeoutExpired("systemctl", 5),
    ],
)
def test_restart_preflight_service_check_failures_are_explicit(
    failure: BaseException, restart_environment: SimpleNamespace
) -> None:
    """Service query failures stop provisioning before a restart plan is accepted."""
    restart_environment.command.side_effect = failure
    with pytest.raises(RuntimeError, match="未开始烧录"):
        protocol._prepare_service_restart()
    restart_environment.get.assert_not_called()


@pytest.mark.parametrize(
    "current",
    [None, {}, {"href": "/runs/../other"}, {"href": "/runs/123?other=1"}],
)
def test_current_run_must_have_an_unambiguous_local_run_path(
    current: object, restart_environment: SimpleNamespace
) -> None:
    """A latest run or malformed link cannot substitute for the server's current run."""
    restart_environment.get.side_effect = [{"links": {"current": current}}]
    with pytest.raises(RuntimeError):
        protocol._current_run_path()


@pytest.mark.parametrize(
    "run",
    [
        {"id": "other", "current": True, "status": "running"},
        {"id": "provision-123", "current": False, "status": "running"},
        {"id": "provision-123", "current": 1, "status": "running"},
        {"id": "provision-123", "current": True, "status": "succeeded"},
    ],
)
def test_current_run_must_still_be_the_matching_running_run(
    run: dict, restart_environment: SimpleNamespace
) -> None:
    """Only the selected, currently running provisioning run may request a restart."""
    restart_environment.get.side_effect = [
        {"links": {"current": {"href": "/runs/provision-123"}}},
        {"data": run},
    ]
    with pytest.raises(RuntimeError):
        protocol._current_run_path()


def test_restart_job_is_a_separate_silent_service_with_no_script_file(
    context: SimpleNamespace, restart_environment: SimpleNamespace
) -> None:
    """The protocol submits an in-memory helper to an independent systemd service."""
    plan = protocol._RestartPlan(
        "/runs/provision-123", "/usr/bin/systemd-run", "/usr/bin/systemctl"
    )
    protocol._schedule_service_restart(cast(ProtocolContext, context), plan)
    restart_environment.command.assert_called_once()
    argv = restart_environment.command.call_args.args[0]
    assert argv == [
        "/usr/bin/systemd-run",
        "--no-ask-password",
        "--unit=opentrons-pipette-provision-restart",
        "--collect",
        "--quiet",
        "--property=Type=exec",
        "--property=StandardOutput=null",
        "--property=StandardError=null",
        "--property=RuntimeMaxSec=240",
        sys.executable,
        "-c",
        protocol.RESTART_PROGRAM,
        plan.run_path,
        plan.systemctl,
        protocol.RESTART_CONFIRMATION,
    ]
    assert restart_environment.command.call_args.kwargs == {
        "stdin": subprocess.DEVNULL,
        "capture_output": True,
        "text": True,
        "check": True,
        "timeout": 10,
    }


def test_changed_current_run_prevents_job_creation(
    context: SimpleNamespace,
    restart_environment: SimpleNamespace,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A stale plan must never schedule a restart against another active run."""
    monkeypatch.setattr(protocol, "_current_run_path", lambda: "/runs/new-run")
    plan = protocol._RestartPlan("/runs/old-run", "/bin/systemd-run", "/bin/systemctl")
    with pytest.raises(RuntimeError, match="当前运行已改变"):
        protocol._schedule_service_restart(cast(ProtocolContext, context), plan)
    restart_environment.command.assert_not_called()


def test_cancellation_at_restart_checkpoint_creates_no_job(
    context: SimpleNamespace, restart_environment: SimpleNamespace
) -> None:
    """An already cancelled protocol must exit before submitting its restart helper."""
    context.comment.side_effect = asyncio.CancelledError
    plan = protocol._RestartPlan(
        "/runs/provision-123", "/bin/systemd-run", "/bin/systemctl"
    )
    with pytest.raises(asyncio.CancelledError):
        protocol._schedule_service_restart(cast(ProtocolContext, context), plan)
    restart_environment.command.assert_not_called()
    restart_environment.get.assert_not_called()


@pytest.mark.parametrize(
    "failure", [OSError("denied"), subprocess.CalledProcessError(1, "systemd-run")]
)
def test_restart_job_failure_does_not_claim_eeprom_write_failed(
    failure: BaseException,
    context: SimpleNamespace,
    restart_environment: SimpleNamespace,
) -> None:
    """A scheduling failure preserves the distinction between verified EEPROM and restart."""
    restart_environment.command.side_effect = failure
    plan = protocol._RestartPlan(
        "/runs/provision-123", "/bin/systemd-run", "/bin/systemctl"
    )
    with pytest.raises(RuntimeError, match="EEPROM 已写入并验证"):
        protocol._schedule_service_restart(cast(ProtocolContext, context), plan)
    assert not any("已安排服务重启" in call.args[0] for call in context.comment.call_args_list)


@pytest.fixture
def restart_helper() -> dict:
    """Load the exact deployed program with all I/O replaced by test doubles."""
    namespace: dict = {"__name__": "test_restart_helper"}
    exec(protocol.RESTART_PROGRAM, namespace)
    namespace["get"] = Mock()
    namespace["time"] = SimpleNamespace(
        monotonic=Mock(side_effect=count(0.0, 1.0)), sleep=Mock()
    )
    namespace["subprocess"] = SimpleNamespace(
        run=Mock(),
        DEVNULL=subprocess.DEVNULL,
        SubprocessError=subprocess.SubprocessError,
    )
    return namespace


def helper_run(status: str) -> dict:
    """Build a target-run response for the detached restart helper."""
    return {"data": {"id": "provision-123", "status": status}}


def helper_current(path: Optional[str] = "/runs/provision-123") -> dict:
    """Represent the server's currently selected run, including none selected."""
    return {"links": {"current": {"href": path} if path is not None else None}}


def helper_saved() -> dict:
    """Return the server's serialized successful confirmation comment."""
    return {
        "data": [
            json.dumps(
                {
                    "commandType": "comment",
                    "status": "succeeded",
                    "params": {"message": protocol.RESTART_CONFIRMATION},
                }
            )
        ]
    }


@pytest.mark.parametrize("current_path", ["/runs/provision-123", None])
def test_helper_waits_for_success_and_persistence_before_service_restart(
    current_path: Optional[str], restart_helper: dict
) -> None:
    """The detached task cannot interrupt engine finishing or completed-run persistence."""
    current = helper_current(current_path)
    restart_helper["get"].side_effect = [
        helper_run("running"),
        current,
        helper_run("finishing"),
        current,
        helper_run("succeeded"),
        current,
        None,
        helper_run("succeeded"),
        current,
        {"data": []},
        helper_run("succeeded"),
        current,
        helper_saved(),
        current,
        404,
    ]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        == 0
    )
    assert restart_helper["time"].sleep.call_count == 4
    assert restart_helper["get"].call_args.args == (
        "/maintenance_runs/current_run",
        True,
    )
    restart_helper["subprocess"].run.assert_called_once_with(
        [
            "/bin/systemctl",
            "--no-ask-password",
            "--no-block",
            "restart",
            "opentrons-robot-server.service",
        ],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
        timeout=10,
    )


@pytest.mark.parametrize("state", ["failed", "stopped", "stop-requested", "unknown"])
def test_helper_never_restarts_for_unsuccessful_or_unknown_run_state(
    state: str, restart_helper: dict
) -> None:
    """Cancellation or failure after job submission still prevents a service restart."""
    restart_helper["get"].side_effect = [helper_run(state), helper_current()]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize("after_persistence", [False, True])
def test_helper_does_not_restart_a_new_current_run(
    after_persistence: bool, restart_helper: dict
) -> None:
    """Recheck current selection after persistence to avoid stopping a newly started run."""
    responses: list = [helper_run("succeeded")]
    if after_persistence:
        responses.extend([helper_current(), helper_saved()])
    responses.append(helper_current("/runs/new-run"))
    restart_helper["get"].side_effect = responses
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize("saved", [None, {"data": []}])
def test_helper_does_not_restart_on_missing_or_empty_persisted_commands(
    saved: object, restart_helper: dict
) -> None:
    """Neither HTTP 503 nor HTTP 200 with an empty command list proves persistence."""
    restart_helper["get"].side_effect = [
        helper_run("succeeded"),
        helper_current(),
        saved,
    ]
    restart_helper["time"].monotonic.side_effect = [0.0, 0.0, 181.0]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize("field", ["commandType", "status", "message"])
def test_helper_requires_the_successful_exact_confirmation_comment(
    field: str, restart_helper: dict
) -> None:
    """Other comments, failed commands and different command types cannot authorize restart."""
    command = json.loads(helper_saved()["data"][0])
    if field == "message":
        command["params"]["message"] = "other message"
    else:
        command[field] = "other value"
    restart_helper["get"].side_effect = [
        helper_run("succeeded"),
        helper_current(),
        {"data": [json.dumps(command)]},
    ]
    restart_helper["time"].monotonic.side_effect = [0.0, 0.0, 181.0]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize("data", ["not a list", [{}], ["not JSON"], ["null"]])
def test_helper_rejects_malformed_persisted_commands(
    data: object, restart_helper: dict
) -> None:
    """Persisted commands must be a list of JSON-encoded command objects."""
    restart_helper["get"].side_effect = [
        helper_run("succeeded"),
        helper_current(),
        {"data": data},
    ]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize("maintenance_status", [200, 503, 500])
def test_helper_never_interrupts_a_maintenance_run(
    maintenance_status: int, restart_helper: dict
) -> None:
    """Only an explicit absence of a maintenance run allows the service restart."""
    restart_helper["get"].side_effect = [
        helper_run("succeeded"),
        helper_current(),
        helper_saved(),
        helper_current(),
        maintenance_status,
    ]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize(
    "paused_state",
    [
        "paused",
        "blocked-by-open-door",
        "awaiting-recovery",
        "awaiting-recovery-paused",
        "awaiting-recovery-blocked-by-open-door",
    ],
)
def test_helper_allows_a_paused_or_recovering_run_to_finish_successfully(
    paused_state: str, restart_helper: dict
) -> None:
    """Temporary waiting states may recover within the bounded restart deadline."""
    restart_helper["get"].side_effect = [
        helper_run(paused_state),
        helper_current(),
        helper_run("running"),
        helper_current(),
        helper_run("succeeded"),
        helper_current(),
        helper_saved(),
        helper_current(),
        404,
    ]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        == 0
    )
    assert restart_helper["time"].sleep.call_count == 2
    restart_helper["subprocess"].run.assert_called_once()


def test_helper_paused_run_cannot_wait_beyond_deadline(restart_helper: dict) -> None:
    """A pause cannot extend the detached helper's lifetime or permit a restart."""
    restart_helper["get"].side_effect = [helper_run("paused"), helper_current()]
    restart_helper["time"].monotonic.side_effect = [0.0, 0.0, 181.0]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize(
    "failure", [OSError("socket gone"), ValueError("bad response")]
)
def test_helper_server_errors_do_not_restart(
    failure: BaseException, restart_helper: dict
) -> None:
    """Loss of trustworthy server state never becomes permission to restart."""
    restart_helper["get"].side_effect = failure
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


def test_helper_timeout_exits_without_restarting(restart_helper: dict) -> None:
    """A run that never completes cannot leave a restart task waiting indefinitely."""
    restart_helper["get"].side_effect = [helper_run("running"), helper_current()]
    restart_helper["time"].monotonic.side_effect = [0.0, 0.0, 181.0]
    assert (
        restart_helper["main"](
            "/runs/provision-123", "/bin/systemctl", protocol.RESTART_CONFIRMATION
        )
        != 0
    )
    restart_helper["subprocess"].run.assert_not_called()


@pytest.mark.parametrize(
    "path,command",
    [("/runs/../other", "/bin/systemctl"), ("/runs/provision-123", "systemctl")],
)
def test_helper_rejects_ambiguous_arguments_before_any_io(
    path: str, command: str, restart_helper: dict
) -> None:
    """Only a fixed run endpoint and an absolute service-command path are accepted."""
    assert restart_helper["main"](path, command, protocol.RESTART_CONFIRMATION) != 0
    restart_helper["get"].assert_not_called()
    restart_helper["subprocess"].run.assert_not_called()

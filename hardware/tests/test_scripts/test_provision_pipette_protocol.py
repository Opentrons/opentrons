"""Test the QC-distributed worker's CAN layer in the hardware test environment."""

import argparse
import asyncio
import importlib.util
import json
import struct
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from types import ModuleType
from typing import Any, AsyncIterator, Callable, Optional, cast
from unittest.mock import Mock

import pytest

from opentrons_hardware.drivers.can_bus import CanMessenger
from opentrons_hardware.drivers.can_bus.can_messenger import (
    MessageListenerCallback,
    MessageListenerCallbackFilter,
)
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts
from opentrons_hardware.firmware_bindings.constants import ErrorCode, NodeId
from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
    fields,
    payloads,
)
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as messages,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt16Field,
    UInt32Field,
)
from opentrons_hardware.instruments.pipettes import serials


def _load_worker() -> ModuleType:
    """Load the distributed source without importing unrelated QC driver parents."""
    path = (
        Path(__file__).resolve().parents[3]
        / "hardware-testing"
        / "hardware_testing"
        / "drivers"
        / "provision_pipette_protocol.py"
    )
    spec = importlib.util.spec_from_file_location(
        "_pipette_provision_worker_under_test", path
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


subject = _load_worker()

SERIAL = "P1KSV3120211129A08"
TARGET = serials.serial_val_from_parts(*serials.info_from_serial_string(SERIAL))
OTHER = serials.serial_val_from_parts(
    *serials.info_from_serial_string("P1KSV3120211129A09")
)
ZERO = bytes(20)
ERASED = b"\xff" * 20


def _identity(raw: bytes, request: MessageDefinition) -> messages.PipetteInfoResponse:
    name, model, code = struct.unpack(">HH16s", raw)
    response = messages.PipetteInfoResponse(
        payload=payloads.PipetteInfoResponsePayload(
            name=fields.PipetteNameField(name),
            model=UInt16Field(model),
            serial=fields.SerialDataCodeField(code),
        )
    )
    response.payload.message_index = request.payload.message_index
    return response


def _firmware(request: MessageDefinition) -> messages.DeviceInfoResponse:
    response = messages.DeviceInfoResponse(
        payload=payloads.DeviceInfoResponsePayload(
            version=UInt32Field(1),
            flags=fields.VersionFlagsField(0),
            shortsha=fields.FirmwareShortSHADataField(b"abcdef0"),
            revision=fields.OptionalRevisionField.build(b""),
            subidentifier=UInt8Field(0),
        )
    )
    response.payload.message_index = request.payload.message_index
    return response


def _error(request: MessageDefinition) -> messages.ErrorMessage:
    response = messages.ErrorMessage(
        payload=payloads.ErrorMessagePayload(
            severity=fields.ErrorSeverityField(2),
            error_code=fields.ErrorCodeField(ErrorCode.hardware.value),
        )
    )
    response.payload.message_index = request.payload.message_index
    return response


class FakeMessenger:
    """Deliver responses synchronously inside send, without constructing a bus."""

    def __init__(self, raw: bytes = ZERO) -> None:
        self.raw = raw
        self.sent: list[tuple[NodeId, MessageDefinition]] = []
        self.listeners: dict[
            MessageListenerCallback, Optional[MessageListenerCallbackFilter]
        ] = {}
        self.pending: Optional[bytes] = None
        self.stale_reads = 0
        self.silent = False
        self.silent_after_write = False
        self.bootloader_only = False
        self.error_on: Optional[type[Any]] = None
        self.transform: Optional[
            Callable[
                [NodeId, MessageDefinition], list[tuple[NodeId, MessageDefinition]]
            ]
        ] = None

    def add_listener(
        self,
        listener: MessageListenerCallback,
        filter: Optional[MessageListenerCallbackFilter] = None,
    ) -> None:
        """Register a response listener."""
        self.listeners[listener] = filter

    def remove_listener(self, listener: MessageListenerCallback) -> None:
        """Remove a response listener."""
        self.listeners.pop(listener, None)

    def emit(self, node: NodeId, message: MessageDefinition) -> None:
        """Dispatch to the current listeners, just as CanMessenger does."""
        arbitration_id = ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message.message_id,
                node_id=NodeId.host,
                originating_node_id=node,
                function_code=0,
            )
        )
        for listener, message_filter in list(self.listeners.items()):
            if message_filter is None or message_filter(arbitration_id):
                listener(message, arbitration_id)

    async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
        """Respond before send returns, exposing late-listener races."""
        self.sent.append((node_id, message))
        if self.silent:
            return
        if self.error_on is not None and isinstance(message, self.error_on):
            self.emit(node_id, _error(message))
            return
        if self.bootloader_only and not node_id.is_bootloader():
            return
        response = self._response_for(message)
        if response is not None:
            replies = (
                self.transform(node_id, response)
                if self.transform is not None
                else [(node_id, response)]
            )
            for origin, reply in replies:
                self.emit(origin, reply)

    def _response_for(self, message: MessageDefinition) -> Optional[MessageDefinition]:
        if isinstance(message, messages.DeviceInfoRequest):
            return _firmware(message)
        elif isinstance(message, messages.InstrumentInfoRequest):
            if self.pending is not None:
                if self.silent_after_write:
                    return None
                if self.stale_reads:
                    self.stale_reads -= 1
                else:
                    self.raw = self.pending
            return _identity(self.raw, message)
        elif isinstance(message, messages.SetSerialNumber):
            self.pending = message.payload.serial.value
        return None

    @property
    def writes(self) -> list[messages.SetSerialNumber]:
        """Return the actual serial-write messages sent by the worker."""
        return [
            message
            for _, message in self.sent
            if isinstance(message, messages.SetSerialNumber)
        ]


async def _provision(
    messenger: FakeMessenger, action: str = "write", **kwargs: Any
) -> dict[str, Any]:
    options: dict[str, Any] = {
        "action": action,
        "which": "left",
        "requested_serial": SERIAL,
        "attempts": 3,
        "timeout": 0.01,
    }
    if action in {"write", "clear"}:
        options["expected_before_hex"] = messenger.raw.hex()
    options.update(kwargs)
    result: dict[str, Any] = await subject.provision(
        cast(CanMessenger, messenger), **options
    )
    assert messenger.listeners == {}, "Listeners must be cleaned up on every outcome."
    assert result["schema_version"] == 1
    assert result["action"] == action
    assert result["which"] == options["which"]
    assert result["requested_serial"] == options["requested_serial"]
    return result


@pytest.mark.parametrize("raw", [ZERO, ERASED])
async def test_inspect_blank_never_writes(raw: bytes) -> None:
    """Both common blank representations can be inspected without mutation."""
    messenger = FakeMessenger(raw)
    result = await _provision(messenger, action="inspect")
    assert result["success"] is True
    assert result["status"] == "ready"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["before"]["blank"] is True
    assert result["write_attempted"] is False
    assert result["changed"] is False
    assert messenger.writes == []


@pytest.mark.parametrize("raw", [ZERO, ERASED])
@pytest.mark.parametrize(
    "which,node", [("left", NodeId.pipette_left), ("right", NodeId.pipette_right)]
)
async def test_write_blank_and_verify(raw: bytes, which: str, node: NodeId) -> None:
    """Write one complete identity and verify it with immediate responses."""
    messenger = FakeMessenger(raw)
    result = await _provision(messenger, which=which)
    assert result["success"] is True
    assert result["status"] == "success"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert result["write_attempted"] is True
    assert result["changed"] is True
    assert result["error"] is None
    assert [message.payload.serial.value for message in messenger.writes] == [TARGET]
    assert all(destination == node for destination, _ in messenger.sent)


@pytest.mark.parametrize(
    "raw",
    [
        OTHER,
        ZERO[:5] + b"\xff" + ZERO[6:],
        struct.pack(">HH16s", 0x1234, 0xFFFF, b"\xff" * 16),
    ],
)
@pytest.mark.parametrize("requested_serial", [SERIAL, "P2HHV3120250401A03"])
async def test_write_replaces_inspected_nonblank_identity(
    raw: bytes, requested_serial: str
) -> None:
    """A valid target may replace different or invalid data after a matching inspection."""
    messenger = FakeMessenger(raw)
    inspected = await _provision(
        messenger, action="inspect", requested_serial=requested_serial
    )
    assert inspected["success"] is True
    result = await _provision(
        messenger,
        requested_serial=requested_serial,
        expected_before_hex=inspected["before"]["raw_hex"],
    )
    target = serials.serial_val_from_parts(
        *serials.info_from_serial_string(requested_serial)
    )
    assert result["success"] is True
    assert result["status"] == "success"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["after"]["raw_hex"] == target.hex()
    assert result["write_attempted"] is True
    assert result["changed"] is True
    assert result["error"] is None
    assert [message.payload.serial.value for message in messenger.writes] == [target]
    assert {type(message) for _, message in messenger.sent} == {
        messages.DeviceInfoRequest,
        messages.InstrumentInfoRequest,
        messages.SetSerialNumber,
    }, "Direct replacement must not clear EEPROM or restart firmware."


async def test_matching_identity_is_idempotent() -> None:
    """An already provisioned matching pipette must not incur another EEPROM write."""
    messenger = FakeMessenger(TARGET)
    result = await _provision(messenger)
    assert result["success"] is True
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert result["write_attempted"] is False
    assert result["changed"] is False
    assert messenger.writes == []


@pytest.mark.parametrize("raw", [TARGET, ZERO])
@pytest.mark.parametrize("which", ["left", "right"])
async def test_clear_writes_only_the_twenty_byte_identity(
    raw: bytes, which: str
) -> None:
    """Clear the matching serial or zero blank using exactly one identity command."""
    messenger = FakeMessenger(raw)
    result = await _provision(messenger, action="clear", which=which)
    assert result["success"] is True
    assert result["status"] == "success"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["after"]["raw_hex"] == ERASED.hex()
    assert result["after"]["blank"] is True
    assert result["after"]["serial"] is None
    assert result["write_attempted"] is True
    assert result["changed"] is True
    assert result["error"] is None
    assert [message.payload.serial.value for message in messenger.writes] == [ERASED]
    node = NodeId.pipette_left if which == "left" else NodeId.pipette_right
    assert all(destination == node for destination, _ in messenger.sent)
    assert {type(message) for _, message in messenger.sent} == {
        messages.DeviceInfoRequest,
        messages.InstrumentInfoRequest,
        messages.SetSerialNumber,
    }, "Clearing must not write arbitrary EEPROM addresses or restart firmware."


async def test_clear_erased_identity_is_idempotent() -> None:
    """The exact FF blank is already clear and does not need another write."""
    messenger = FakeMessenger(ERASED)
    result = await _provision(messenger, action="clear")
    assert result["success"] is True
    assert result["status"] == "success"
    assert result["before"]["raw_hex"] == ERASED.hex()
    assert result["after"]["raw_hex"] == ERASED.hex()
    assert result["write_attempted"] is False
    assert result["changed"] is False
    assert messenger.writes == []


async def test_clear_mismatched_readback_fails_without_rewriting() -> None:
    """Clear is not successful until all twenty readback bytes are FF."""
    messenger = FakeMessenger(TARGET)
    messenger.stale_reads = 3
    result = await _provision(messenger, action="clear")
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert result["write_attempted"] is True
    assert result["changed"] is False
    assert "does not match" in result["error"]
    assert [message.payload.serial.value for message in messenger.writes] == [ERASED]
    assert (
        sum(
            isinstance(message, messages.InstrumentInfoRequest)
            for _, message in messenger.sent
        )
        == 4
    )


async def test_clear_allows_subsequent_inspection_and_provisioning() -> None:
    """A verified clear restores a blank state that can subsequently be provisioned."""
    messenger = FakeMessenger(TARGET)
    cleared = await _provision(messenger, action="clear")
    assert cleared["success"] is True
    serial = "P1KSV3120211129A09"
    inspected = await _provision(messenger, action="inspect", requested_serial=serial)
    assert inspected["success"] is True
    assert inspected["before"]["raw_hex"] == ERASED.hex()
    written = await _provision(
        messenger,
        requested_serial=serial,
        expected_before_hex=inspected["before"]["raw_hex"],
    )
    assert written["success"] is True
    assert written["after"]["raw_hex"] == OTHER.hex()
    assert [message.payload.serial.value for message in messenger.writes] == [
        ERASED,
        OTHER,
    ]


@pytest.mark.parametrize(
    "raw",
    [
        OTHER,
        ZERO[:5] + b"\xff" + ZERO[6:],
        struct.pack(">HH16s", 0x1234, 0xFFFF, b"\xff" * 16),
    ],
)
@pytest.mark.parametrize("requested_serial", [SERIAL, "P2HHV3120250401A03"])
async def test_inspect_different_nonblank_identity_reports_raw_bytes_without_writing(
    raw: bytes, requested_serial: str
) -> None:
    """Inspection preserves different or invalid identities without authorizing mutation."""
    messenger = FakeMessenger(raw)
    result = await _provision(
        messenger, action="inspect", requested_serial=requested_serial
    )
    assert result["success"] is True
    assert result["status"] == "ready"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["before"]["data_hex"] == raw[4:].hex()
    assert result["before"]["blank"] is False
    assert result["after"] is None
    assert result["write_attempted"] is False
    assert result["changed"] is False
    assert result["error"] is None
    assert messenger.raw == raw
    assert messenger.writes == []
    assert [type(message) for _, message in messenger.sent] == [
        messages.DeviceInfoRequest,
        messages.InstrumentInfoRequest,
    ]


@pytest.mark.parametrize(
    "raw",
    [
        OTHER,
        ZERO[:5] + b"\xff" + ZERO[6:],
        struct.pack(">HH16s", 0x1234, 0xFFFF, b"\xff" * 16),
    ],
)
async def test_clear_nonblank_different_identity_is_refused(raw: bytes) -> None:
    """Clear still requires the scanned original to match every nonblank identity."""
    messenger = FakeMessenger(raw)
    result = await _provision(messenger, action="clear")
    assert result["success"] is False
    assert result["status"] == "failure"
    assert "differs from the requested serial" in result["error"]
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["write_attempted"] is False
    assert messenger.writes == []


@pytest.mark.parametrize(
    "raw",
    [
        OTHER,
        ZERO[:5] + b"\xff" + ZERO[6:],
        struct.pack(">HH16s", 0x1234, 0xFFFF, b"\xff" * 16),
        ZERO,
        ERASED,
    ],
)
async def test_explicit_clear_without_original_accepts_exact_snapshot(
    raw: bytes,
) -> None:
    """The combined flow may clear any complete identity once its snapshot matches."""
    messenger = FakeMessenger(raw)
    result = await _provision(
        messenger, action="clear", allow_clear_without_original=True
    )
    assert result["success"] is True
    assert result["status"] == "success"
    assert result["before"]["raw_hex"] == raw.hex()
    assert result["after"]["raw_hex"] == ERASED.hex()
    assert result["after"]["blank"] is True
    assert result["write_attempted"] is (raw != ERASED)
    assert result["changed"] is (raw != ERASED)
    assert [message.payload.serial.value for message in messenger.writes] == (
        [] if raw == ERASED else [ERASED]
    )


@pytest.mark.parametrize("expected", [None, TARGET.hex(), ERASED.hex()])
async def test_explicit_clear_without_original_requires_unchanged_snapshot(
    expected: Optional[str],
) -> None:
    """Skipping the barcode match never allows missing or stale inspection bytes."""
    messenger = FakeMessenger(OTHER)
    result = await _provision(
        messenger,
        action="clear",
        allow_clear_without_original=True,
        expected_before_hex=expected,
    )
    assert result["success"] is False
    assert result["status"] == "failure"
    assert "expected-before-hex" in result["error"]
    assert result["write_attempted"] is False
    assert messenger.writes == []


@pytest.mark.parametrize(
    "raw,expected",
    [
        (ZERO, ERASED),
        (TARGET, ZERO),
        (OTHER, ZERO),
        (ERASED, TARGET),
        (struct.pack(">HH16s", 0x1234, 0xFFFF, b"\xff" * 16), OTHER),
    ],
)
@pytest.mark.parametrize("action", ["write", "clear"])
async def test_expected_before_mismatch_is_refused(
    raw: bytes, expected: bytes, action: str
) -> None:
    """A snapshot from another state cannot authorize a write or an idempotent success."""
    messenger = FakeMessenger(raw)
    result = await _provision(
        messenger, action=action, expected_before_hex=expected.hex()
    )
    assert result["success"] is False
    assert result["error"]
    assert result["write_attempted"] is False
    assert messenger.writes == []


async def test_unrelated_then_matching_response_in_one_burst() -> None:
    """A correct queued response survives an earlier unrelated message."""
    messenger = FakeMessenger()

    def burst(
        node: NodeId, response: MessageDefinition
    ) -> list[tuple[NodeId, MessageDefinition]]:
        return [(node, messages.HeartbeatResponse()), (node, response)]

    messenger.transform = burst
    result = await _provision(messenger)
    assert result["success"] is True
    assert len(messenger.writes) == 1


@pytest.mark.parametrize("mismatch", ["origin", "index"])
async def test_wrong_origin_or_request_index_is_not_accepted(mismatch: str) -> None:
    """A response for another mount or another request must never authorize a write."""
    messenger = FakeMessenger()

    def change(
        node: NodeId, response: MessageDefinition
    ) -> list[tuple[NodeId, MessageDefinition]]:
        if not isinstance(response, messages.PipetteInfoResponse):
            return [(node, response)]
        if mismatch == "origin":
            return [(NodeId.pipette_right, response)]
        response.payload.message_index = UInt32Field(
            response.payload.message_index.value + 100
        )
        return [(node, response)]

    messenger.transform = change
    result = await _provision(messenger)
    assert result["success"] is False
    assert result["status"] == "failure"
    assert messenger.writes == []


@pytest.mark.parametrize(
    "request_type",
    [
        messages.DeviceInfoRequest,
        messages.InstrumentInfoRequest,
        messages.SetSerialNumber,
    ],
)
async def test_matching_hardware_error_fails(request_type: type[Any]) -> None:
    """Explicit firmware failures cannot become successful provisioning results."""
    messenger = FakeMessenger()
    messenger.error_on = request_type
    result = await _provision(messenger)
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["error"]


async def test_no_response_exhausts_attempts_without_success() -> None:
    """Silence is an explicit failure, never the original script's false SUCCESS."""
    messenger = FakeMessenger()
    messenger.silent = True
    result = await _provision(messenger)
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["error"]
    assert messenger.writes == []


@pytest.mark.parametrize("action", ["write", "clear"])
async def test_missing_verification_does_not_resend_write(action: str) -> None:
    """After an uncertain write, retry reads instead of writing repeatedly."""
    messenger = FakeMessenger()
    messenger.silent_after_write = True
    result = await _provision(messenger, action=action)
    assert result["success"] is False
    assert result["write_attempted"] is True
    assert result["error"]
    assert len(messenger.writes) == 1


async def test_old_readbacks_are_retried_until_new_identity_arrives() -> None:
    """EEPROM completion delay needs repeated readback, not repeated writes."""
    messenger = FakeMessenger()
    messenger.stale_reads = 2
    result = await _provision(messenger)
    assert result["success"] is True
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert len(messenger.writes) == 1


async def test_bootloader_only_is_explicit_failure() -> None:
    """An unbootable firmware must be identified before any EEPROM write."""
    messenger = FakeMessenger()
    messenger.bootloader_only = True
    result = await _provision(messenger)
    assert result["success"] is False
    assert "bootloader" in json.dumps(result["error"]).lower()
    assert messenger.writes == []


@pytest.mark.parametrize("stage", ["send", "readback"])
async def test_cancellation_after_write_preserves_uncertain_write_state(
    stage: str,
) -> None:
    """Interrupted sends and verification retain the evidence that writing began."""

    class CancelledMessenger(FakeMessenger):
        async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
            if stage == "readback" and self.pending is not None:
                raise asyncio.CancelledError()
            await super().send(node_id, message)
            if stage == "send" and isinstance(message, messages.SetSerialNumber):
                raise asyncio.CancelledError()

    messenger = CancelledMessenger()
    result = await _provision(messenger)
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["before"]["raw_hex"] == ZERO.hex()
    assert result["write_attempted"] is True
    assert result["error"]
    assert len(messenger.writes) == 1


async def test_delayed_eeprom_commit_gets_time_to_complete() -> None:
    """Read retries yield enough time for an asynchronous EEPROM commit."""

    class DelayedMessenger(FakeMessenger):
        def __init__(self) -> None:
            super().__init__()
            self.readbacks: list[bytes] = []
            self.commit_task: Optional[asyncio.Task[None]] = None

        async def send(self, node_id: NodeId, message: MessageDefinition) -> None:
            if isinstance(message, messages.SetSerialNumber):
                self.sent.append((node_id, message))

                async def commit() -> None:
                    await asyncio.sleep(0.015)
                    self.raw = message.payload.serial.value

                self.commit_task = asyncio.create_task(commit())
                return
            if isinstance(message, messages.InstrumentInfoRequest) and self.commit_task:
                self.readbacks.append(self.raw)
            await super().send(node_id, message)

    messenger = DelayedMessenger()
    try:
        result = await _provision(messenger)
    finally:
        if messenger.commit_task is not None:
            await messenger.commit_task
    assert result["success"] is True
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert messenger.readbacks[0] == ZERO
    assert messenger.readbacks[-1] == TARGET
    assert len(messenger.writes) == 1


async def test_driver_cleanup_failure_keeps_verified_write_evidence(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Resource teardown failure must retain the completed write and readback."""
    messenger = FakeMessenger()

    @asynccontextmanager
    async def fake_driver(settings: Any) -> AsyncIterator[object]:
        yield object()

    @asynccontextmanager
    async def fake_messenger(driver: object) -> AsyncIterator[FakeMessenger]:
        yield messenger
        raise RuntimeError("cleanup failed")

    monkeypatch.setattr(
        subject.build,
        "driver",
        fake_driver,
    )
    monkeypatch.setattr(subject, "CanMessenger", fake_messenger)
    args = subject.build_parser().parse_args(
        [
            "--action",
            "write",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--expected-before-hex",
            ZERO.hex(),
        ]
    )
    result = await subject.run(args)
    assert result["success"] is False
    assert result["write_attempted"] is True
    assert result["changed"] is True
    assert result["after"]["raw_hex"] == TARGET.hex()
    assert "cleanup failed" in result["error"]
    assert len(messenger.writes) == 1
    assert messenger.listeners == {}


@pytest.mark.parametrize(
    "serial",
    [
        "",
        "P1KSV31",
        SERIAL + "\n",
        " " + SERIAL,
        "P1KSV31中文",
        "P1KSV31A_B",
        "P1KSV31" + "1" * 13,
        "P1ksV3120211129A08",
        "P1KSV3A20211129A08",
    ],
)
def test_strict_serial_rejects_ambiguous_inputs(serial: str) -> None:
    """Reject silent trimming, invalid names, missing codes and invalid code bytes."""
    with pytest.raises(ValueError):
        subject.parse_target(serial)


def test_strict_serial_preserves_exact_wire_encoding() -> None:
    """The human serial produces the protocol's big-endian twenty-byte identity."""
    assert subject.parse_target(SERIAL) == TARGET


@pytest.mark.parametrize("action", ["inspect", "write", "clear"])
@pytest.mark.parametrize("hardware_failure", [False, True])
def test_cli_reports_one_json_object_and_correct_exit_status(
    action: str,
    hardware_failure: bool,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """The CLI returns only JSON on stdout without saving provisioning reports."""
    monkeypatch.chdir(tmp_path)
    messenger = FakeMessenger()
    if hardware_failure:
        messenger.error_on = messages.InstrumentInfoRequest

    async def fake_run(args: argparse.Namespace) -> dict[str, Any]:
        sys.stdout.write("driver diagnostic\n")
        return await _provision(messenger, action=args.action)

    monkeypatch.setattr(subject, "run", fake_run)
    argv = ["--action", action, "--which", "left", "--serial", SERIAL]
    if action in {"write", "clear"}:
        argv.extend(["--expected-before-hex", ZERO.hex()])
    return_code = subject.main(argv)
    captured = capsys.readouterr()
    result = json.loads(captured.out)
    assert len(captured.out.splitlines()) == 1
    assert "driver diagnostic" in captured.err
    assert return_code == (1 if hardware_failure else 0)
    assert result["success"] is not hardware_failure
    assert result["schema_version"] == 1
    assert result["action"] == action
    assert result["which"] == "left"
    assert result["requested_serial"] == SERIAL
    assert list(tmp_path.iterdir()) == []
    assert set(result) >= {
        "status",
        "before",
        "after",
        "firmware",
        "write_attempted",
        "changed",
        "error",
    }


@pytest.mark.parametrize(
    "argv",
    [
        [],
        ["--action", "write", "--which", "left", "--serial", SERIAL],
        ["--action", "inspect", "--which", "middle", "--serial", SERIAL],
        ["--action", "inspect", "--which", "left", "--serial", "bad-serial"],
        [
            "--action",
            "write",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--expected-before-hex",
            "ff",
        ],
        [
            "--action",
            "write",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--expected-before-hex",
            "gg" * 20,
        ],
        [
            "--action",
            "inspect",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--attempts",
            "0",
        ],
        [
            "--action",
            "inspect",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--timeout",
            "nan",
        ],
    ],
)
def test_invalid_cli_requests_fail_before_opening_can(
    argv: list[str],
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Argument errors have structured output and never reach the bus factory."""
    driver_factory = Mock(side_effect=AssertionError("Must not open CAN"))
    monkeypatch.setattr(
        subject.build,
        "driver",
        driver_factory,
    )
    assert subject.main(argv) != 0
    result = json.loads(capsys.readouterr().out)
    assert result["schema_version"] == 1
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["error"]
    assert result["write_attempted"] is False
    driver_factory.assert_not_called()


@pytest.mark.parametrize("action", ["inspect", "write"])
def test_clear_without_original_flag_rejects_other_actions_before_opening_can(
    action: str,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """The bypass option cannot silently apply to inspection or direct writing."""
    driver_factory = Mock(side_effect=AssertionError("Must not open CAN"))
    monkeypatch.setattr(subject.build, "driver", driver_factory)
    argv = [
        "--action",
        action,
        "--which",
        "left",
        "--serial",
        SERIAL,
        "--expected-before-hex",
        OTHER.hex(),
        "--allow-clear-without-original",
    ]
    assert subject.main(argv) != 0
    result = json.loads(capsys.readouterr().out)
    assert result["success"] is False
    assert result["write_attempted"] is False
    assert "requires --action clear" in result["error"]
    driver_factory.assert_not_called()


def test_cli_passes_clear_without_original_to_real_worker_flow(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Exercise CLI parsing and run forwarding without opening an actual CAN bus."""
    messenger = FakeMessenger(OTHER)

    @asynccontextmanager
    async def fake_driver(settings: Any) -> AsyncIterator[object]:
        yield object()

    @asynccontextmanager
    async def fake_messenger(driver: object) -> AsyncIterator[FakeMessenger]:
        yield messenger

    monkeypatch.setattr(subject.build, "driver", fake_driver)
    monkeypatch.setattr(subject, "CanMessenger", fake_messenger)
    assert (
        subject.main(
            [
                "--action",
                "clear",
                "--which",
                "left",
                "--serial",
                SERIAL,
                "--expected-before-hex",
                OTHER.hex(),
                "--allow-clear-without-original",
            ]
        )
        == 0
    )
    captured = capsys.readouterr()
    result = json.loads(captured.out)
    assert len(captured.out.splitlines()) == 1
    assert result["success"] is True
    assert result["action"] == "clear"
    assert result["before"]["raw_hex"] == OTHER.hex()
    assert result["after"]["raw_hex"] == ERASED.hex()
    assert [message.payload.serial.value for message in messenger.writes] == [ERASED]
    assert messenger.listeners == {}


@pytest.mark.parametrize(
    "serial,expected",
    [
        (SERIAL, None),
        (SERIAL, "ff"),
        (SERIAL, "gg" * 20),
        ("", TARGET.hex()),
        ("bad-serial", TARGET.hex()),
    ],
)
@pytest.mark.parametrize("allow_clear_without_original", [False, True])
def test_invalid_clear_cli_requests_fail_before_opening_can(
    serial: str,
    expected: Optional[str],
    allow_clear_without_original: bool,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Clearing requires a valid scanned serial and an exact inspection snapshot."""
    driver_factory = Mock(side_effect=AssertionError("Must not open CAN"))
    monkeypatch.setattr(
        subject.build,
        "driver",
        driver_factory,
    )
    argv = ["--action", "clear", "--which", "left", "--serial", serial]
    if allow_clear_without_original:
        argv.append("--allow-clear-without-original")
    if expected is not None:
        argv.extend(["--expected-before-hex", expected])
    assert subject.main(argv) != 0
    captured = capsys.readouterr()
    result = json.loads(captured.out)
    assert len(captured.out.splitlines()) == 1
    assert result["action"] == "clear"
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["error"]
    assert result["write_attempted"] is False
    driver_factory.assert_not_called()


def test_cli_rejects_removed_log_file_option_before_opening_can(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """A stale logging argument is rejected without touching the bus or file."""
    driver_factory = Mock(side_effect=AssertionError("Must not open CAN"))
    monkeypatch.setattr(
        subject.build,
        "driver",
        driver_factory,
    )
    audit_path = tmp_path / "audit.jsonl"
    result_code = subject.main(
        [
            "--action",
            "write",
            "--which",
            "left",
            "--serial",
            SERIAL,
            "--expected-before-hex",
            ZERO.hex(),
            "--log-file",
            str(audit_path),
        ]
    )
    captured = capsys.readouterr()
    result = json.loads(captured.out)
    assert len(captured.out.splitlines()) == 1
    assert result_code != 0
    assert result["success"] is False
    assert result["status"] == "failure"
    assert result["write_attempted"] is False
    assert result["changed"] is False
    assert "--log-file" in result["error"]
    assert not audit_path.exists()
    driver_factory.assert_not_called()

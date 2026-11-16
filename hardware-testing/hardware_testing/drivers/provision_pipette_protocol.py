#!/usr/bin/env python3
"""Inspect, provision, or clear one pipette identity with a JSON-reporting worker.

Adapted from provision_pipette.py; the original production script is unchanged.
Inspect must precede write or clear, using its identity as the expected state.
Write replaces the inspected identity with the scanned target serial.
Clear normally checks the original serial; an explicit option skips that check
for clear-then-write, while always requiring the exact inspected snapshot.
This worker does not move motors, restart firmware, or refresh server caches.
Results are emitted on stdout; no provisioning report is saved to disk.
"""

import argparse
import asyncio
import contextlib
import json
import math
import re
import secrets
import struct
import sys
from typing import Any, Dict, NoReturn, Optional, Sequence, Set, Type, TypeVar

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback, build
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages import (
    fields,
    payloads,
)
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions as messages,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.utils import UInt32Field
from opentrons_hardware.instruments.pipettes import serials
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

Result = Dict[str, Any]
Response = TypeVar("Response", bound=messages.BaseMessage)
_SERIAL_PATTERN = re.compile(r"P[A-Z0-9]{3}V[0-9]{2}[A-Za-z0-9]{1,12}")


class ProvisionError(RuntimeError):
    """An operation could not safely be completed or verified."""


def _validate_options(
    action: str,
    which: str,
    attempts: int,
    timeout: float,
    allow_clear_without_original: bool = False,
) -> None:
    if action not in {"inspect", "write", "clear"}:
        raise ValueError("Action must be inspect, write, or clear.")
    if which not in {"left", "right"}:
        raise ValueError("Which must be left or right.")
    if allow_clear_without_original and action != "clear":
        raise ValueError("--allow-clear-without-original requires --action clear.")
    if attempts < 1 or not math.isfinite(timeout) or timeout <= 0:
        raise ValueError(
            "Attempts must be positive and timeout must be finite and positive."
        )


def parse_target(serial: str) -> bytes:
    """Validate an ASCII barcode, without trimming or truncating its contents."""
    if not _SERIAL_PATTERN.fullmatch(serial):
        raise ValueError(
            "Serial must contain a known four-character pipette prefix, V, two "
            "ASCII version digits, and 1-12 ASCII letters/digits; no whitespace."
        )
    if serial[:4] not in serials.NAME_LOOKUP:
        raise ValueError(f"Unknown pipette serial prefix: {serial[:4]}.")
    return serials.serial_val_from_parts(*serials.info_from_serial_string(serial))


def _parse_expected(value: Optional[str]) -> bytes:
    if value is None or re.fullmatch(r"[0-9a-fA-F]{40}", value) is None:
        raise ValueError(
            "Write or clear requires --expected-before-hex with exactly 40 hex digits."
        )
    return bytes.fromhex(value)


def identity_from_response(response: messages.PipetteInfoResponse) -> Result:
    """Preserve all 20 identity bytes, including invalid or blank identities."""
    name = response.payload.name.value
    model = response.payload.model.value
    data = response.payload.serial.value
    if len(data) != 16:
        raise ProvisionError(f"Pipette returned {len(data)} data bytes; expected 16.")
    raw = struct.pack(">HH16s", name, model, data)
    blank = raw in (b"\xff" * 20, b"\x00" * 20)
    readable: Optional[str] = None
    prefixes = {value.value: key for key, value in serials.NAME_LOOKUP.items()}
    if not blank and name in prefixes and model <= 99:
        try:
            tail = data.rstrip(b"\x00").decode("ascii")
        except UnicodeDecodeError:
            pass
        else:
            if tail and all(32 <= ord(char) <= 126 for char in tail):
                readable = f"{prefixes[name]}V{model:02d}{tail}"
    return {
        "name": name,
        "model": model,
        "data_hex": data.hex(),
        "raw_hex": raw.hex(),
        "serial": readable,
        "blank": blank,
    }


def _new_request_id(request: MessageDefinition) -> int:
    request_id = secrets.randbelow(0xFFFFFFFF) + 1
    request.payload.message_index = UInt32Field(request_id)
    return request_id


async def _query_with_callback(
    messenger: CanMessenger,
    callback: WaitableCallback,
    node: NodeId,
    request: MessageDefinition,
    response_type: Type[Response],
    timeout: float,
    extra_error_ids: Optional[Set[int]] = None,
) -> Response:
    request_id = _new_request_id(request)
    error_ids = {request_id} | (extra_error_ids or set())
    try:
        await asyncio.wait_for(messenger.send(node, request), timeout=timeout)
    except asyncio.TimeoutError as exc:
        raise ProvisionError(f"CAN send timed out to {node.name}.") from exc
    deadline = asyncio.get_running_loop().time() + timeout
    while True:
        remaining = deadline - asyncio.get_running_loop().time()
        if remaining <= 0:
            raise asyncio.TimeoutError(f"No {response_type.__name__} from {node.name}.")
        response, arbitration_id = await asyncio.wait_for(callback.read(), remaining)
        if (
            arbitration_id.parts.originating_node_id != node
            or arbitration_id.parts.node_id != NodeId.host
        ):
            continue
        response_id = response.payload.message_index.value
        if isinstance(response, messages.ErrorMessage) and response_id in error_ids:
            raise ProvisionError(
                f"Firmware ErrorMessage from {node.name}: "
                f"code={response.payload.error_code.value}, "
                f"severity={response.payload.severity.value}, "
                f"message_index={response_id}."
            )
        if isinstance(response, response_type) and response_id == request_id:
            return response


async def query(
    messenger: CanMessenger,
    node: NodeId,
    request: MessageDefinition,
    response_type: Type[Response],
    timeout: float,
) -> Response:
    """Register before sending, and retain one listener until the response arrives."""
    with WaitableCallback(messenger) as callback:
        return await _query_with_callback(
            messenger, callback, node, request, response_type, timeout
        )


def _firmware(response: messages.DeviceInfoResponse, node: NodeId) -> Result:
    payload = response.payload
    return {
        "node_id": node.value,
        "version": payload.version.value,
        "flags": payload.flags.value,
        "shortsha": payload.shortsha.value.rstrip(b"\x00").decode("ascii", "replace"),
        "revision": payload.revision.value.rstrip(b"\x00").decode("ascii", "replace"),
        "subidentifier": payload.subidentifier.value,
    }


def _result(action: str, which: str, requested_serial: str) -> Result:
    return {
        "schema_version": 1,
        "action": action,
        "which": which,
        "requested_serial": requested_serial,
        "success": False,
        "status": "failure",
        "before": None,
        "after": None,
        "firmware": None,
        "write_attempted": False,
        "changed": False,
        "error": None,
    }


def _fail(result: Result, error: BaseException) -> Result:
    if result["write_attempted"] and not str(error):
        error = ProvisionError(
            f"{type(error).__name__} after write was attempted; inspect before retrying."
        )
    result.update(
        success=False, status="failure", error=str(error) or type(error).__name__
    )
    return result


async def _bootloader_diagnostic(
    messenger: CanMessenger, node: NodeId, timeout: float, result: Result
) -> None:
    bootloader = node.bootloader_for()
    try:
        response = await query(
            messenger,
            bootloader,
            messages.DeviceInfoRequest(),
            messages.DeviceInfoResponse,
            timeout,
        )
    except asyncio.TimeoutError:
        raise ProvisionError(
            f"Application {node.name} did not respond; bootloader also did not "
            "respond. No identity write was sent."
        ) from None
    result["firmware"] = _firmware(response, bootloader)
    raise ProvisionError(
        f"Application {node.name} did not respond; bootloader {bootloader.name} "
        "is responding. Provisioning requires application firmware; no write "
        "or firmware restart was sent."
    )


async def _write_and_verify(
    messenger: CanMessenger,
    node: NodeId,
    target: bytes,
    before: Result,
    attempts: int,
    timeout: float,
    result: Result,
) -> Result:
    """Send one write and retain its error listener through readback retries."""
    set_message = messages.SetSerialNumber(
        payload=payloads.SerialNumberPayload(serial=fields.SerialField(target))
    )
    write_id = _new_request_id(set_message)
    with WaitableCallback(messenger) as callback:
        # Mark before awaiting send: even a timeout may occur after transmission.
        result["write_attempted"] = True
        try:
            await asyncio.wait_for(messenger.send(node, set_message), timeout)
        except asyncio.TimeoutError as exc:
            raise ProvisionError(
                "Identity write send timed out; it may have taken effect. Inspect before retrying."
            ) from exc
        last_error = "No readback response."
        for attempt in range(attempts):
            if attempt:
                # EEPROM writes may finish after the first readback arrives.
                await asyncio.sleep(min(timeout, 0.05))
            try:
                response = await _query_with_callback(
                    messenger,
                    callback,
                    node,
                    messages.InstrumentInfoRequest(),
                    messages.PipetteInfoResponse,
                    timeout,
                    {write_id},
                )
            except asyncio.TimeoutError:
                last_error = "Readback timed out."
                continue
            after = identity_from_response(response)
            result["after"] = after
            result["changed"] = after["raw_hex"] != before["raw_hex"]
            if after["raw_hex"] == target.hex():
                result.update(success=True, status="success")
                return result
            last_error = f"Readback identity does not match target: {after['raw_hex']}."
        raise ProvisionError(
            f"{last_error} Could not verify after {attempts} read attempts. "
            "The single write may have taken effect; inspect before retrying."
        )


async def provision(
    messenger: CanMessenger,
    *,
    action: str,
    which: str,
    requested_serial: str,
    expected_before_hex: Optional[str] = None,
    attempts: int = 3,
    timeout: float = 1.0,
    allow_clear_without_original: bool = False,
) -> Result:
    """Inspect, write, or clear an identity without losing attempted-write state."""
    result = _result(action, which, requested_serial)
    try:
        _validate_options(
            action, which, attempts, timeout, allow_clear_without_original
        )
        target = parse_target(requested_serial)
        expected = _parse_expected(expected_before_hex) if action != "inspect" else None
        node = NodeId.pipette_left if which == "left" else NodeId.pipette_right
        try:
            device = await query(
                messenger,
                node,
                messages.DeviceInfoRequest(),
                messages.DeviceInfoResponse,
                timeout,
            )
            result["firmware"] = _firmware(device, node)
            before_response = await query(
                messenger,
                node,
                messages.InstrumentInfoRequest(),
                messages.PipetteInfoResponse,
                timeout,
            )
        except asyncio.TimeoutError:
            await _bootloader_diagnostic(messenger, node, timeout, result)
            raise AssertionError("Bootloader diagnostic always raises")
        before = identity_from_response(before_response)
        result["before"] = before
        if action == "inspect":
            # Inspection reports the actual bytes, including invalid identities.
            result.update(success=True, status="ready")
            return result
        before_raw = bytes.fromhex(before["raw_hex"])
        if expected is not None and before_raw != expected:
            raise ProvisionError(
                "Identity changed since inspection; expected-before-hex does not match. No write sent."
            )
        if (
            action == "clear"
            and not allow_clear_without_original
            and not before["blank"]
            and before_raw != target
        ):
            raise ProvisionError(
                "Existing identity is nonblank and differs from the requested serial. Clear requires the matching original serial. No write sent."
            )
        # Clear writes only this fixed 20-byte blank value after checking the
        # snapshot above. It never resets the EEPROM filesystem.
        target = {"write": target, "clear": b"\xff" * 20}[action]
        if before_raw == target:
            result.update(success=True, status="success", after=before)
            return result

        return await _write_and_verify(
            messenger, node, target, before, attempts, timeout, result
        )
    except (Exception, asyncio.CancelledError, KeyboardInterrupt) as error:
        return _fail(result, error)


async def run(args: argparse.Namespace) -> Result:
    """Own the driver lifetime while preserving a result if cleanup fails."""
    result = _result(args.action, args.which, args.serial)
    try:
        # Validate before even opening the CAN interface.
        _validate_options(
            args.action,
            args.which,
            args.attempts,
            args.timeout,
            args.allow_clear_without_original,
        )
        parse_target(args.serial)
        if args.action != "inspect":
            _parse_expected(args.expected_before_hex)
        async with (
            build.driver(build_settings(args)) as driver,
            CanMessenger(driver) as messenger,
        ):
            result = await provision(
                messenger,
                action=args.action,
                which=args.which,
                requested_serial=args.serial,
                expected_before_hex=args.expected_before_hex,
                attempts=args.attempts,
                timeout=args.timeout,
                allow_clear_without_original=args.allow_clear_without_original,
            )
    except (Exception, asyncio.CancelledError, KeyboardInterrupt) as error:
        _fail(result, error)
    return result


class _JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> NoReturn:
        raise ValueError(message)


def build_parser() -> argparse.ArgumentParser:
    """Build the one-shot command line interface."""
    parser = _JsonArgumentParser(description=__doc__)
    parser.add_argument(
        "--action", choices=["inspect", "write", "clear"], required=True
    )
    parser.add_argument("--which", choices=["left", "right"], required=True)
    parser.add_argument("--serial", required=True)
    parser.add_argument("--expected-before-hex")
    parser.add_argument(
        "--allow-clear-without-original",
        action="store_true",
        default=False,
        help="For clear only: skip original serial matching, retaining the exact snapshot check.",
    )
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=1.0)
    add_can_args(parser)
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Print exactly one JSON result and return zero only for verified success."""
    result = _result("", "", "")
    try:
        args = build_parser().parse_args(argv)
        result = _result(args.action, args.which, args.serial)
        # Third-party drivers may print diagnostics; reserve stdout for JSON.
        with contextlib.redirect_stdout(sys.stderr):
            result = asyncio.run(run(args))
    except (Exception, KeyboardInterrupt) as error:
        _fail(result, error)
    print(json.dumps(result, sort_keys=True))
    return 0 if result["success"] else 1


if __name__ == "__main__":
    sys.exit(main())

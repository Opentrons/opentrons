"""Read Flex pipette sensors for fault diagnosis.

This tool performs read-only, one-shot CAN requests. It intentionally uses the
low-level sensor driver instead of ``OT3API.read_*`` so that a real zero value
can be distinguished from a sensor that did not respond.

Only run this while the robot is idle. A ``CanMessenger`` must be the sole CAN
controller, so stop robot-server first or pass ``--manage-robot-server``.

A PASS verifies firmware/EEPROM identity and repeated, correctly formatted CAN
responses. It does not validate measurement accuracy, drift, sensitivity, or
response to an applied pressure/capacitance stimulus.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import shutil
import subprocess
import sys
from contextlib import contextmanager
from dataclasses import asdict, dataclass, fields, replace
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Dict, Iterator, List, Optional, Sequence, Set, TextIO, Tuple

from opentrons_hardware.drivers.can_bus import build
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    ErrorCode,
    ErrorSeverity,
    FirmwareTarget,
    MessageId,
    NodeId,
    PipetteName,
    PipetteType,
    SensorId,
    SensorType,
)
from opentrons_hardware.firmware_bindings.messages import message_definitions
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorIdField,
    SensorTypeField,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    ReadFromSensorRequestPayload,
    SensorPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from opentrons_hardware.hardware_control.network import NetworkInfo
from opentrons_hardware.instruments.serial_utils import model_versionstring_from_int
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.sensors.sensor_types import (
    BaseSensorType,
    CapacitiveSensor,
    EnvironmentSensor,
    PressureSensor,
)
from opentrons_hardware.sensors.types import (
    EnvironmentSensorDataType,
    SensorDataType,
    SensorReturnType,
)

ROBOT_SERVER_SERVICE = "opentrons-robot-server"
SUPPORTED_SENSOR_NAMES = ("pressure", "capacitive", "environment")
SENSOR_UNITS = {"pressure": "Pa", "capacitive": "pF"}
MOUNT_TO_NODE = {
    "left": NodeId.pipette_left,
    "right": NodeId.pipette_right,
}
SENSOR_ID_BY_NAME = {
    "s0": SensorId.S0,
    "s1": SensorId.S1,
}
PIPETTE_TYPE_CHANNELS = {
    PipetteType.pipette_single: 1,
    PipetteType.pipette_multi: 8,
    PipetteType.pipette_96: 96,
}
PIPETTE_NAME_CHANNELS = {
    PipetteName.p1000_single: 1,
    PipetteName.p50_single: 1,
    PipetteName.p1000_multi: 8,
    PipetteName.p50_multi: 8,
    PipetteName.p1000_multi_em: 8,
    PipetteName.p1000_96: 96,
    PipetteName.p50_96: 96,
    PipetteName.p200_96: 96,
}


@dataclass(frozen=True)
class DiagnosticResult:
    """One sensor request and its diagnostic metadata."""

    timestamp_utc: str
    sample: int
    mount: str
    node: str
    sensor: str
    sensor_id: str
    offset_applied: bool
    status: str
    latency_ms: float
    peripheral_ok: Optional[bool] = None
    peripheral_error: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    raw_q16_16: Optional[int] = None
    temperature_c: Optional[float] = None
    temperature_raw_q16_16: Optional[int] = None
    humidity_percent: Optional[float] = None
    humidity_raw_q16_16: Optional[int] = None
    error: Optional[str] = None


@dataclass(frozen=True)
class PipetteIdentity:
    """Independent firmware and EEPROM identities reported by the pipette."""

    expected_channels: int
    firmware_status: str
    firmware_type: Optional[str] = None
    firmware_channels: Optional[int] = None
    firmware_version: Optional[int] = None
    firmware_shortsha: Optional[str] = None
    pcba_revision: Optional[str] = None
    firmware_error: Optional[str] = None
    eeprom_status: str = "not_checked"
    eeprom_name: Optional[str] = None
    eeprom_channels: Optional[int] = None
    pipette_model: Optional[str] = None
    pipette_serial: Optional[str] = None
    eeprom_error: Optional[str] = None


@dataclass(frozen=True)
class Diagnosis:
    """Final fault diagnosis based on firmware identity and sensor responses."""

    verdict: str
    code: str
    reason: str
    expected_channels: int
    firmware_channels: Optional[int]
    eeprom_channels: Optional[int]
    s0_state: str
    s1_state: str
    details: str
    capacitive_s0_state: str = "not_tested"
    capacitive_s1_state: str = "not_tested"


@dataclass(frozen=True)
class _PairHealth:
    sensor: str
    sensor_id: str
    total: int
    successful: int
    no_response: int
    state: str

    @property
    def success_rate(self) -> float:
        return self.successful / self.total if self.total else 0.0


@dataclass(frozen=True)
class _EepromIdentity:
    status: str
    name: Optional[str] = None
    channels: Optional[int] = None
    model: Optional[str] = None
    serial: Optional[str] = None
    error: Optional[str] = None


class ResultWriter:
    """Write diagnostic results to stdout and optionally CSV."""

    def __init__(self, json_output: bool, csv_path: Optional[Path]) -> None:
        self._json_output = json_output
        self._csv_path = csv_path
        self._csv_file: Optional[TextIO] = None
        self._csv_writer: Optional[csv.DictWriter[str]] = None

    def __enter__(self) -> "ResultWriter":
        if self._csv_path is not None:
            self._csv_path.parent.mkdir(parents=True, exist_ok=True)
            self._csv_file = self._csv_path.open("w", newline="", encoding="utf-8")
            field_names = [field.name for field in fields(DiagnosticResult)]
            self._csv_writer = csv.DictWriter(self._csv_file, fieldnames=field_names)
            self._csv_writer.writeheader()
        return self

    def __exit__(self, *_args: object) -> None:
        if self._csv_file is not None:
            self._csv_file.close()

    def write(self, result: DiagnosticResult) -> None:
        """Write one result."""
        row = asdict(result)
        if self._json_output:
            print(
                json.dumps(
                    {"record_type": "sensor_read", **row},
                    ensure_ascii=False,
                    sort_keys=True,
                )
            )
        else:
            print(_format_human(result))

        if self._csv_writer is not None:
            self._csv_writer.writerow(row)
            assert self._csv_file is not None
            self._csv_file.flush()

    def write_pipette_identity(self, identity: PipetteIdentity) -> None:
        """Write the detected firmware and EEPROM identities."""
        if self._json_output:
            print(
                json.dumps(
                    {"record_type": "pipette_identity", **asdict(identity)},
                    ensure_ascii=False,
                    sort_keys=True,
                )
            )
            return
        print(
            "IDENTITY "
            f"expected_channels={identity.expected_channels} "
            f"firmware_status={identity.firmware_status} "
            f"firmware_type={identity.firmware_type} "
            f"firmware_channels={identity.firmware_channels} "
            f"firmware_version={identity.firmware_version} "
            f"firmware_shortsha={identity.firmware_shortsha} "
            f"pcba_revision={identity.pcba_revision} "
            f"eeprom_status={identity.eeprom_status} "
            f"eeprom_name={identity.eeprom_name} "
            f"eeprom_channels={identity.eeprom_channels} "
            f"model={identity.pipette_model} serial={identity.pipette_serial} "
            f"firmware_error={identity.firmware_error} "
            f"eeprom_error={identity.eeprom_error}"
        )

    def write_diagnosis(self, diagnosis: Diagnosis) -> None:
        """Write the final diagnosis."""
        if self._json_output:
            print(
                json.dumps(
                    {"record_type": "diagnosis", **asdict(diagnosis)},
                    ensure_ascii=False,
                    sort_keys=True,
                )
            )
            return
        print("=" * 72)
        print(
            f"DIAGNOSIS verdict={diagnosis.verdict} code={diagnosis.code}\n"
            f"原因: {diagnosis.reason}\n"
            f"expected_channels={diagnosis.expected_channels} "
            f"firmware_channels={diagnosis.firmware_channels} "
            f"eeprom_channels={diagnosis.eeprom_channels} "
            f"pressure.S0={diagnosis.s0_state} "
            f"pressure.S1={diagnosis.s1_state} "
            f"capacitive.S0={diagnosis.capacitive_s0_state} "
            f"capacitive.S1={diagnosis.capacitive_s1_state}\n"
            f"details: {diagnosis.details}"
        )


def _format_human(result: DiagnosticResult) -> str:
    prefix = (
        f"[{result.timestamp_utc}] sample={result.sample} mount={result.mount} "
        f"{result.sensor}.{result.sensor_id} status={result.status} "
        f"latency_ms={result.latency_ms:.3f}"
    )
    peripheral = ""
    if result.peripheral_ok is not None:
        peripheral = f" peripheral_ok={result.peripheral_ok}"
    elif result.peripheral_error:
        peripheral = f" peripheral_error={result.peripheral_error}"

    if result.status != "ok":
        return f"{prefix}{peripheral} error={result.error}"

    if result.sensor == "environment":
        values = (
            f" temperature_c={result.temperature_c}"
            f" temperature_raw_q16_16={result.temperature_raw_q16_16}"
            f" humidity_percent={result.humidity_percent}"
            f" humidity_raw_q16_16={result.humidity_raw_q16_16}"
        )
    else:
        values = (
            f" value={result.value} unit={result.unit} raw_q16_16={result.raw_q16_16}"
        )
    return f"{prefix}{peripheral}{values}"


def _build_sensor(
    sensor_name: str, sensor_id: SensorId, node: NodeId
) -> BaseSensorType:
    if sensor_name == "pressure":
        return PressureSensor.build(sensor_id=sensor_id, node_id=node)
    if sensor_name == "capacitive":
        return CapacitiveSensor.build(sensor_id=sensor_id, node_id=node)
    if sensor_name == "environment":
        return EnvironmentSensor.build(sensor_id=sensor_id, node_id=node)
    raise ValueError(f"Unsupported sensor: {sensor_name}")


def _error_text(error: BaseException) -> str:
    return f"{type(error).__name__}: {error}"


def _peripheral_status_filter(node: NodeId, arbitration_id: ArbitrationId) -> bool:
    return bool(
        arbitration_id.parts.originating_node_id == node.value
        and arbitration_id.parts.message_id
        in (MessageId.peripheral_status_response, MessageId.error_message)
    )


def _firmware_error(response: message_definitions.ErrorMessage) -> RuntimeError:
    error_code = response.payload.error_code.value
    severity = response.payload.severity.value
    try:
        error_name = ErrorCode(error_code).name
    except ValueError:
        error_name = "unknown"
    try:
        severity_name = ErrorSeverity(severity).name
    except ValueError:
        severity_name = "unknown"
    return RuntimeError(
        "Firmware ErrorMessage: "
        f"error_code={error_code}({error_name}), "
        f"severity={severity}({severity_name}), "
        f"message_index={response.payload.message_index.value}"
    )


async def _wait_for_peripheral_status(
    reader: WaitableCallback,
    sensor: BaseSensorType,
    request_message_index: int,
) -> bool:
    expected = sensor.sensor
    while True:
        response, _ = await reader.read()
        if isinstance(response, message_definitions.ErrorMessage):
            if response.payload.message_index.value == request_message_index:
                raise _firmware_error(response)
            continue
        if not isinstance(response, message_definitions.PeripheralStatusResponse):
            continue
        if (
            response.payload.sensor.value == expected.sensor_type.value
            and response.payload.sensor_id.value == expected.sensor_id.value
        ):
            # Do not use bool(response.payload.status): field wrapper objects are
            # truthy even when their numeric value is zero.
            return response.payload.status.value != 0


async def _read_peripheral_status(
    messenger: CanMessenger,
    sensor: BaseSensorType,
    timeout: int,
) -> bool:
    sensor_info = sensor.sensor
    request = message_definitions.PeripheralStatusRequest(
        payload=SensorPayload(
            sensor=SensorTypeField(sensor_info.sensor_type),
            sensor_id=SensorIdField(sensor_info.sensor_id),
        )
    )
    with WaitableCallback(
        messenger,
        lambda arbitration_id: _peripheral_status_filter(
            sensor_info.node_id, arbitration_id
        ),
    ) as reader:
        await messenger.send(node_id=sensor_info.node_id, message=request)
        try:
            return await asyncio.wait_for(
                _wait_for_peripheral_status(
                    reader, sensor, request.payload.message_index.value
                ),
                timeout,
            )
        except asyncio.TimeoutError as error:
            raise TimeoutError(
                "No matching PeripheralStatusResponse for "
                f"{sensor_info.sensor_type.name}.{sensor_info.sensor_id.name} "
                f"within {timeout} second(s)"
            ) from error


def _sensor_read_filter(node: NodeId, arbitration_id: ArbitrationId) -> bool:
    return bool(
        arbitration_id.parts.originating_node_id == node.value
        and arbitration_id.parts.message_id
        in (MessageId.read_sensor_response, MessageId.error_message)
    )


def _expected_response_types(sensor: BaseSensorType) -> Set[SensorType]:
    if sensor.sensor.sensor_type == SensorType.environment:
        return {SensorType.temperature, SensorType.humidity}
    return {sensor.sensor.sensor_type}


async def _wait_for_sensor_read(
    reader: WaitableCallback,
    sensor: BaseSensorType,
    request_message_index: int,
) -> SensorReturnType:
    expected = sensor.sensor
    expected_types = _expected_response_types(sensor)
    data_by_type: Dict[SensorType, SensorDataType] = {}
    while expected_types.difference(data_by_type):
        response, _ = await reader.read()
        if isinstance(response, message_definitions.ErrorMessage):
            if response.payload.message_index.value == request_message_index:
                raise _firmware_error(response)
            continue
        if not isinstance(response, message_definitions.ReadFromSensorResponse):
            continue
        if response.payload.sensor_id.value != expected.sensor_id.value:
            continue
        try:
            response_type = SensorType(response.payload.sensor.value)
        except ValueError:
            continue
        if response_type not in expected_types:
            continue
        data_by_type[response_type] = SensorDataType.build(
            response.payload.sensor_data, response.payload.sensor
        )
    return sensor.set_sensor_data(list(data_by_type.values()))


async def _read_sensor(
    messenger: CanMessenger,
    sensor: BaseSensorType,
    offset: bool,
    timeout: int,
) -> Optional[SensorReturnType]:
    sensor_info = sensor.sensor
    request = message_definitions.ReadFromSensorRequest(
        payload=ReadFromSensorRequestPayload(
            sensor=SensorTypeField(sensor_info.sensor_type),
            sensor_id=SensorIdField(sensor_info.sensor_id),
            offset_reading=UInt8Field(int(offset)),
        )
    )
    with WaitableCallback(
        messenger,
        lambda arbitration_id: _sensor_read_filter(sensor_info.node_id, arbitration_id),
    ) as reader:
        await messenger.send(node_id=sensor_info.node_id, message=request)
        try:
            return await asyncio.wait_for(
                _wait_for_sensor_read(
                    reader, sensor, request.payload.message_index.value
                ),
                timeout,
            )
        except asyncio.TimeoutError:
            return None


def _base_result(
    *,
    sample: int,
    mount: str,
    node: NodeId,
    sensor_name: str,
    sensor_id: SensorId,
    offset: bool,
    status: str,
    latency_ms: float,
    peripheral_ok: Optional[bool],
    peripheral_error: Optional[str],
    error: Optional[str] = None,
) -> DiagnosticResult:
    return DiagnosticResult(
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        sample=sample,
        mount=mount,
        node=node.name,
        sensor=sensor_name,
        sensor_id=sensor_id.name,
        offset_applied=offset,
        status=status,
        latency_ms=latency_ms,
        peripheral_ok=peripheral_ok,
        peripheral_error=peripheral_error,
        error=error,
    )


def _result_from_data(
    *,
    data: SensorReturnType,
    sample: int,
    mount: str,
    node: NodeId,
    sensor_name: str,
    sensor_id: SensorId,
    offset: bool,
    latency_ms: float,
    peripheral_ok: Optional[bool],
    peripheral_error: Optional[str],
) -> DiagnosticResult:
    common = _base_result(
        sample=sample,
        mount=mount,
        node=node,
        sensor_name=sensor_name,
        sensor_id=sensor_id,
        offset=offset,
        status="ok",
        latency_ms=latency_ms,
        peripheral_ok=peripheral_ok,
        peripheral_error=peripheral_error,
    )

    if sensor_name == "environment":
        if not isinstance(data, EnvironmentSensorDataType):
            return replace(
                common,
                status="response_mismatch",
                error=f"Expected environment data, got {type(data).__name__}",
            )
        if (
            data.temperature.sensor_type != SensorType.temperature
            or data.humidity.sensor_type != SensorType.humidity
        ):
            return replace(
                common,
                status="response_mismatch",
                error=(
                    "Environment response contained unexpected sensor types: "
                    f"temperature={data.temperature.sensor_type.name}, "
                    f"humidity={data.humidity.sensor_type.name}"
                ),
            )
        return replace(
            common,
            temperature_c=data.temperature.to_float(),
            temperature_raw_q16_16=data.temperature.to_int,
            humidity_percent=data.humidity.to_float(),
            humidity_raw_q16_16=data.humidity.to_int,
        )

    expected_type = (
        SensorType.pressure if sensor_name == "pressure" else SensorType.capacitive
    )
    if not isinstance(data, SensorDataType) or data.sensor_type != expected_type:
        actual_type = (
            data.sensor_type.name
            if isinstance(data, SensorDataType)
            else type(data).__name__
        )
        return replace(
            common,
            status="response_mismatch",
            error=f"Expected {expected_type.name} data, got {actual_type}",
        )
    return replace(
        common,
        value=data.to_float(),
        unit=SENSOR_UNITS[sensor_name],
        raw_q16_16=data.to_int,
    )


async def _read_one(
    *,
    messenger: CanMessenger,
    sample: int,
    mount: str,
    node: NodeId,
    sensor_name: str,
    sensor_id: SensorId,
    offset: bool,
    timeout: int,
    check_status: bool,
) -> DiagnosticResult:
    sensor = _build_sensor(sensor_name, sensor_id, node)
    peripheral_ok: Optional[bool] = None
    peripheral_error: Optional[str] = None
    if check_status:
        try:
            peripheral_ok = await _read_peripheral_status(
                messenger=messenger,
                sensor=sensor,
                timeout=timeout,
            )
        except Exception as error:
            peripheral_error = _error_text(error)

    start = perf_counter()
    try:
        data = await _read_sensor(
            messenger=messenger,
            sensor=sensor,
            offset=offset,
            timeout=timeout,
        )
    except Exception as error:
        latency_ms = (perf_counter() - start) * 1000
        return _base_result(
            sample=sample,
            mount=mount,
            node=node,
            sensor_name=sensor_name,
            sensor_id=sensor_id,
            offset=offset,
            status="error",
            latency_ms=latency_ms,
            peripheral_ok=peripheral_ok,
            peripheral_error=peripheral_error,
            error=_error_text(error),
        )

    latency_ms = (perf_counter() - start) * 1000
    if data is None:
        return _base_result(
            sample=sample,
            mount=mount,
            node=node,
            sensor_name=sensor_name,
            sensor_id=sensor_id,
            offset=offset,
            status="no_response",
            latency_ms=latency_ms,
            peripheral_ok=peripheral_ok,
            peripheral_error=peripheral_error,
            error=f"No response within {timeout} second(s)",
        )

    return _result_from_data(
        data=data,
        sample=sample,
        mount=mount,
        node=node,
        sensor_name=sensor_name,
        sensor_id=sensor_id,
        offset=offset,
        latency_ms=latency_ms,
        peripheral_ok=peripheral_ok,
        peripheral_error=peripheral_error,
    )


def _selected_sensors(sensor_name: str) -> Sequence[str]:
    return SUPPORTED_SENSOR_NAMES if sensor_name == "all" else (sensor_name,)


async def _read_device_identity(
    messenger: CanMessenger,
    node: NodeId,
    expected_channels: int,
    timeout: int,
) -> PipetteIdentity:
    targets: Set[FirmwareTarget] = {node}
    try:
        detected = await NetworkInfo(messenger).probe_specific(
            devices=targets, timeout=timeout
        )
    except Exception as error:
        return PipetteIdentity(
            expected_channels=expected_channels,
            firmware_status="error",
            firmware_error=_error_text(error),
        )

    info = detected.get(node)
    if info is None:
        return PipetteIdentity(
            expected_channels=expected_channels,
            firmware_status="no_response",
            firmware_error=f"No DeviceInfoResponse within {timeout} second(s)",
        )

    try:
        reported_type = PipetteType(info.subidentifier)
    except ValueError:
        return PipetteIdentity(
            expected_channels=expected_channels,
            firmware_status="unknown_type" if info.ok else "bootloader",
            firmware_type=f"unknown({info.subidentifier})",
            firmware_version=info.version,
            firmware_shortsha=info.shortsha,
            pcba_revision=repr(info.revision),
            firmware_error=(
                "Firmware reported an unknown pipette subtype"
                if info.ok
                else "Pipette is responding from bootloader; subtype is unknown"
            ),
        )

    return PipetteIdentity(
        expected_channels=expected_channels,
        firmware_status="ok" if info.ok else "bootloader",
        firmware_type=reported_type.name,
        firmware_channels=PIPETTE_TYPE_CHANNELS[reported_type],
        firmware_version=info.version,
        firmware_shortsha=info.shortsha,
        pcba_revision=repr(info.revision),
        firmware_error=None if info.ok else "Pipette is responding from bootloader",
    )


def _pipette_info_filter(node: NodeId, arbitration_id: ArbitrationId) -> bool:
    return bool(
        arbitration_id.parts.originating_node_id == node.value
        and arbitration_id.parts.message_id == MessageId.pipette_info_response
    )


async def _wait_for_pipette_info(
    reader: WaitableCallback,
) -> message_definitions.PipetteInfoResponse:
    while True:
        response, _ = await reader.read()
        if isinstance(response, message_definitions.PipetteInfoResponse):
            return response


async def _read_eeprom_identity(
    messenger: CanMessenger, node: NodeId, timeout: int
) -> _EepromIdentity:
    request = message_definitions.InstrumentInfoRequest()
    with WaitableCallback(
        messenger,
        lambda arbitration_id: _pipette_info_filter(node, arbitration_id),
    ) as reader:
        await messenger.send(node_id=node, message=request)
        try:
            response = await asyncio.wait_for(
                _wait_for_pipette_info(reader),
                timeout,
            )
        except asyncio.TimeoutError:
            return _EepromIdentity(
                status="no_response",
                error=f"No PipetteInfoResponse within {timeout} second(s)",
            )
        except Exception as error:
            return _EepromIdentity(status="error", error=_error_text(error))

    try:
        pipette_name = PipetteName(response.payload.name.value)
    except ValueError:
        pipette_name = PipetteName.unknown
    channels = PIPETTE_NAME_CHANNELS.get(pipette_name)
    serial = response.payload.serial.value.decode(errors="replace").split("\x00")[0]
    return _EepromIdentity(
        status="ok" if channels is not None else "unknown_type",
        name=pipette_name.name,
        channels=channels,
        model=model_versionstring_from_int(response.payload.model.value),
        serial=serial,
        error=None
        if channels is not None
        else "EEPROM reported an unknown pipette name",
    )


async def _read_pipette_identity(
    messenger: CanMessenger,
    node: NodeId,
    expected_channels: int,
    timeout: int,
) -> PipetteIdentity:
    identity = await _read_device_identity(
        messenger=messenger,
        node=node,
        expected_channels=expected_channels,
        timeout=timeout,
    )
    eeprom = await _read_eeprom_identity(
        messenger=messenger, node=node, timeout=timeout
    )
    return replace(
        identity,
        eeprom_status=eeprom.status,
        eeprom_name=eeprom.name,
        eeprom_channels=eeprom.channels,
        pipette_model=eeprom.model,
        pipette_serial=eeprom.serial,
        eeprom_error=eeprom.error,
    )


def _expected_ids_for_sensor(
    sensor_name: str, expected_channels: int
) -> Sequence[SensorId]:
    if expected_channels == 8 and sensor_name in ("pressure", "capacitive"):
        return (SensorId.S0, SensorId.S1)
    return (SensorId.S0,)


def _selected_sensor_pairs(
    sensor_names: Sequence[str], sensor_id: str, expected_channels: int
) -> Sequence[Tuple[str, SensorId]]:
    if sensor_id in ("auto", "all"):
        return tuple(
            (sensor_name, selected_id)
            for sensor_name in sensor_names
            for selected_id in _expected_ids_for_sensor(sensor_name, expected_channels)
        )
    selected_id = SENSOR_ID_BY_NAME[sensor_id]
    if expected_channels == 1 and selected_id == SensorId.S1:
        raise ValueError(
            "A 1-channel pipette has only S0; S1 is not a valid physical sensor."
        )
    if selected_id == SensorId.S1 and "environment" in sensor_names:
        raise ValueError(
            "environment.S1 is not a valid physical sensor. "
            "Use --sensor-id auto for the valid sensor matrix."
        )
    return tuple((sensor_name, selected_id) for sensor_name in sensor_names)


def _is_failure(result: DiagnosticResult) -> bool:
    return result.status != "ok"


def _summarize_pairs(results: Sequence[DiagnosticResult]) -> List[_PairHealth]:
    grouped: Dict[Tuple[str, str], List[DiagnosticResult]] = {}
    for result in results:
        grouped.setdefault((result.sensor, result.sensor_id), []).append(result)

    summaries: List[_PairHealth] = []
    for (sensor, sensor_id), pair_results in sorted(grouped.items()):
        successful = sum(result.status == "ok" for result in pair_results)
        no_response = sum(result.status == "no_response" for result in pair_results)
        total = len(pair_results)
        if successful == total:
            state = "responsive"
        elif successful == 0 and no_response == total:
            state = "no_data"
        elif successful == 0:
            state = "failed"
        else:
            state = "intermittent"
        summaries.append(
            _PairHealth(
                sensor=sensor,
                sensor_id=sensor_id,
                total=total,
                successful=successful,
                no_response=no_response,
                state=state,
            )
        )
    return summaries


def _sensor_id_state(summaries: Sequence[_PairHealth], sensor_id: str) -> str:
    states = [item.state for item in summaries if item.sensor_id == sensor_id]
    if not states:
        return "not_tested"
    if all(state == "responsive" for state in states):
        return "responsive"
    if all(state == "no_data" for state in states):
        return "no_data"
    if all(state == "failed" for state in states):
        return "failed"
    if "intermittent" in states:
        return "intermittent"
    return "partial_failure"


def _health_details(summaries: Sequence[_PairHealth]) -> str:
    if not summaries:
        return "no sensor reads were collected"
    return "; ".join(
        f"{item.sensor}.{item.sensor_id}={item.state}"
        f"({item.successful}/{item.total}, no_response={item.no_response})"
        for item in summaries
    )


def _diagnosis(
    *,
    verdict: str,
    code: str,
    reason: str,
    expected_channels: int,
    identity: PipetteIdentity,
    s0_state: str,
    s1_state: str,
    details: str,
    capacitive_s0_state: str = "not_tested",
    capacitive_s1_state: str = "not_tested",
) -> Diagnosis:
    return Diagnosis(
        verdict=verdict,
        code=code,
        reason=reason,
        expected_channels=expected_channels,
        firmware_channels=identity.firmware_channels,
        eeprom_channels=identity.eeprom_channels,
        s0_state=s0_state,
        s1_state=s1_state,
        details=details,
        capacitive_s0_state=capacitive_s0_state,
        capacitive_s1_state=capacitive_s1_state,
    )


def _diagnose_single_channel(
    identity: PipetteIdentity,
    s0_state: str,
    s1_state: str,
    capacitive_s0_state: str,
    capacitive_s1_state: str,
    details: str,
) -> Diagnosis:
    if s0_state == "not_tested":
        return _diagnosis(
            verdict="INCONCLUSIVE",
            code="S0_NOT_TESTED",
            reason="1 通道移液器必须检测 S0，但本次没有采集 S0。",
            expected_channels=1,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    if s0_state == "responsive":
        verified = (
            identity.firmware_status == "ok"
            and identity.firmware_channels == 1
            and identity.eeprom_status == "ok"
            and identity.eeprom_channels == 1
        )
        return _diagnosis(
            verdict="PASS" if verified else "WARNING",
            code=(
                "SINGLE_CHANNEL_COMMUNICATION_OK"
                if verified
                else "SINGLE_CHANNEL_RESPONSES_OK_FIRMWARE_UNVERIFIED"
            ),
            reason=(
                "S0 连续返回格式正确的数据，且主板报告单通道固件；"
                "这证明通信/读取链路正常，不代表测量精度或灵敏度合格。"
                if verified
                else "S0 连续返回格式正确的数据，但未能确认主板固件类型；"
                "这不代表测量精度或灵敏度合格。"
            ),
            expected_channels=1,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    return _diagnosis(
        verdict="FAIL",
        code=("S0_NO_DATA" if s0_state == "no_data" else "S0_SENSOR_RESPONSE_FAILURE"),
        reason=(
            "1 通道移液器唯一的 S0 无数据，应检查 S0 传感器、连接、主板或 CAN。"
            if s0_state == "no_data"
            else "1 通道移液器的 S0 响应异常或间歇性失败。"
        ),
        expected_channels=1,
        identity=identity,
        s0_state=s0_state,
        s1_state=s1_state,
        details=details,
        capacitive_s0_state=capacitive_s0_state,
        capacitive_s1_state=capacitive_s1_state,
    )


def _diagnose_pressure_s1_no_data(
    identity: PipetteIdentity,
    s0_state: str,
    s1_state: str,
    capacitive_s0_state: str,
    capacitive_s1_state: str,
    details: str,
    s1_initialization_failed: bool,
) -> Diagnosis:
    firmware_is_multi = (
        identity.firmware_status == "ok" and identity.firmware_channels == 8
    )
    capacitive_s1_failed = capacitive_s1_state not in ("responsive", "not_tested")
    capacitive_s0_failed = capacitive_s0_state not in ("responsive", "not_tested")
    if firmware_is_multi and s1_initialization_failed:
        code = "S1_INITIALIZATION_FAILURE"
        reason = (
            "主板已确认是 8 通道固件，因此可排除错烧单通道固件；"
            "PeripheralStatus 同时报错，S1 压力传感器驱动初始化流程异常。"
        )
    elif (
        firmware_is_multi
        and capacitive_s0_state == "responsive"
        and capacitive_s1_failed
    ):
        code = "S1_COMMON_PATH_FAILURE"
        reason = (
            "主板已确认是 8 通道固件，pressure.S1 与 capacitive.S1 同时异常，"
            "而 capacitive.S0 正常；应优先检查 S1 侧连接、配置或主板路径。"
        )
    elif firmware_is_multi and capacitive_s0_failed and capacitive_s1_failed:
        code = "MULTIPLE_SENSOR_PATH_FAILURE"
        reason = (
            "主板已确认是 8 通道固件，但 pressure.S1 和整个电容测量路径均异常；"
            "需要分别检查 S1 压力链路及电容 IC/I2C 公共链路。"
        )
    elif firmware_is_multi:
        code = "S1_PRESSURE_PATH_FAILURE"
        reason = (
            "主板已确认是 8 通道固件，因此可排除错烧单通道固件；"
            "pressure.S1 无数据，应检查 S1 压力传感器、连接或主板 S1 通道。"
        )
    else:
        code = "S1_NO_DATA_FIRMWARE_UNVERIFIED"
        reason = (
            "pressure.S0 正常而 pressure.S1 无数据，但固件类型无法确认；"
            "可能是错烧单通道固件，也可能是 S1 压力传感器链路故障。"
        )
    return _diagnosis(
        verdict="FAIL" if firmware_is_multi else "INCONCLUSIVE",
        code=code,
        reason=reason,
        expected_channels=8,
        identity=identity,
        s0_state=s0_state,
        s1_state=s1_state,
        details=details,
        capacitive_s0_state=capacitive_s0_state,
        capacitive_s1_state=capacitive_s1_state,
    )


def _diagnose_both_pressure_no_data(
    identity: PipetteIdentity,
    s0_state: str,
    s1_state: str,
    capacitive_s0_state: str,
    capacitive_s1_state: str,
    details: str,
) -> Diagnosis:
    capacitive_states = (capacitive_s0_state, capacitive_s1_state)
    board_responded = (
        identity.firmware_status in ("ok", "unknown_type")
        or identity.eeprom_status in ("ok", "unknown_type")
        or any(state == "responsive" for state in capacitive_states)
    )
    capacitive_both_responsive = all(
        state == "responsive" for state in capacitive_states
    )
    capacitive_failed = any(
        state not in ("responsive", "not_tested") for state in capacitive_states
    )

    if board_responded and capacitive_both_responsive:
        code = "PRESSURE_COMMON_PATH_FAILURE"
        reason = (
            "pressure.S0/S1 均无数据，但 capacitive.S0/S1 正常响应，"
            "说明主板和 CAN 总体通信仍工作；"
            "可排除整板断电和总体 CAN 故障，应检查压力传感器公共供电、I2C/SPI、"
            "初始化配置或压力采集子系统。"
        )
    elif board_responded and capacitive_failed:
        code = "MULTIPLE_SENSOR_PATH_FAILURE"
        reason = (
            "主板至少仍有身份或其它传感器 CAN 响应，但 pressure.S0/S1 "
            "及部分电容通道均异常；"
            "应检查传感器公共供电、总线、连接和固件初始化路径。"
        )
    elif board_responded:
        code = "PRESSURE_SENSORS_NO_DATA"
        reason = (
            "主板至少仍有身份或其它传感器 CAN 响应，因此不是整板断电或总体 CAN 中断；"
            "pressure.S0/S1 均无数据，应检查压力采集公共链路。"
        )
    else:
        code = "PIPETTE_BOARD_OR_CAN_FAILURE"
        reason = (
            "pressure.S0/S1 和主板身份请求均无有效响应，可能是主板、供电、"
            "固件运行或 CAN 通信故障。"
        )
    return _diagnosis(
        verdict="FAIL",
        code=code,
        reason=reason,
        expected_channels=8,
        identity=identity,
        s0_state=s0_state,
        s1_state=s1_state,
        details=details,
        capacitive_s0_state=capacitive_s0_state,
        capacitive_s1_state=capacitive_s1_state,
    )


def _diagnose_eight_channel(
    identity: PipetteIdentity,
    s0_state: str,
    s1_state: str,
    capacitive_s0_state: str,
    capacitive_s1_state: str,
    details: str,
    s1_initialization_failed: bool,
) -> Diagnosis:
    if s0_state == "not_tested" or s1_state == "not_tested":
        return _diagnosis(
            verdict="INCONCLUSIVE",
            code="EIGHT_CHANNEL_TEST_INCOMPLETE",
            reason="8 通道移液器必须同时检测 S0 和 S1，本次测试不完整。",
            expected_channels=8,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    capacitive_s1_failed = capacitive_s1_state not in ("responsive", "not_tested")
    if s0_state == "responsive" and s1_state == "responsive" and capacitive_s1_failed:
        s1_specific = capacitive_s0_state == "responsive"
        return _diagnosis(
            verdict="FAIL",
            code=(
                "S1_CAPACITIVE_CHANNEL_FAILURE"
                if s1_specific
                else "CAPACITIVE_COMMON_PATH_FAILURE"
            ),
            reason=(
                "pressure.S0/S1 正常，但 capacitive.S1 异常；"
                "应检查 8 通道电容传感器的第二测量输入、电极连接或主板通道。"
                if s1_specific
                else "pressure.S0/S1 正常，但 capacitive.S0/S1 都存在异常；"
                "应检查电容传感器 IC、I2C、供电或公共连接路径。"
            ),
            expected_channels=8,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    if s0_state == "responsive" and s1_state == "responsive":
        verified = (
            identity.firmware_status == "ok"
            and identity.firmware_channels == 8
            and identity.eeprom_status == "ok"
            and identity.eeprom_channels == 8
        )
        return _diagnosis(
            verdict="PASS" if verified else "WARNING",
            code=(
                "EIGHT_CHANNEL_COMMUNICATION_OK"
                if verified
                else "EIGHT_CHANNEL_RESPONSES_OK_FIRMWARE_UNVERIFIED"
            ),
            reason=(
                "S0、S1 连续返回格式正确的数据，且主板报告 8 通道固件；"
                "这证明通信/读取链路正常，不代表测量精度或灵敏度合格。"
                if verified
                else "S0、S1 连续返回格式正确的数据，但未能确认主板固件类型；"
                "这不代表测量精度或灵敏度合格。"
            ),
            expected_channels=8,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    if s0_state == "responsive" and s1_state == "no_data":
        return _diagnose_pressure_s1_no_data(
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
            details=details,
            s1_initialization_failed=s1_initialization_failed,
        )
    if s0_state == "no_data" and s1_state == "no_data":
        return _diagnose_both_pressure_no_data(
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
            details=details,
        )
    if s0_state == "responsive":
        return _diagnosis(
            verdict="FAIL",
            code="S1_SENSOR_SPECIFIC_OR_INTERMITTENT_FAILURE",
            reason="S0 正常，但 S1 部分传感器异常或存在间歇性响应，应检查对应 S1 链路。",
            expected_channels=8,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    if s1_state == "responsive":
        return _diagnosis(
            verdict="FAIL",
            code="S0_SENSOR_CHAIN_FAILURE",
            reason="S1 正常，但 S0 异常，应检查 S0 传感器、连接或主板 S0 通道。",
            expected_channels=8,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    return _diagnosis(
        verdict="FAIL",
        code="MULTIPLE_SENSOR_RESPONSE_FAILURE",
        reason="S0、S1 都存在异常响应，需要检查主板、连接和传感器链路。",
        expected_channels=8,
        identity=identity,
        s0_state=s0_state,
        s1_state=s1_state,
        details=details,
        capacitive_s0_state=capacitive_s0_state,
        capacitive_s1_state=capacitive_s1_state,
    )


def _apply_supplemental_diagnostics(
    diagnosis: Diagnosis,
    summaries: Sequence[_PairHealth],
    peripheral_false_names: Sequence[str],
    details: str,
) -> Diagnosis:
    supplemental_failures = [
        item
        for item in summaries
        if item.sensor != "pressure" and item.state != "responsive"
    ]
    if diagnosis.verdict in ("PASS", "WARNING") and supplemental_failures:
        failed_names = ", ".join(
            f"{item.sensor}.{item.sensor_id}={item.state}"
            for item in supplemental_failures
        )
        return replace(
            diagnosis,
            verdict="FAIL",
            code="ADDITIONAL_SENSOR_FAILURE",
            reason=f"压力传感器判断正常，但其它传感器存在异常：{failed_names}。",
        )
    if diagnosis.verdict == "PASS" and peripheral_false_names:
        failed_names = ", ".join(peripheral_false_names)
        return replace(
            diagnosis,
            verdict="WARNING",
            code="SENSOR_INITIALIZATION_STATUS_WARNING",
            reason=(
                f"CAN 数据响应正常，但 PeripheralStatus 对 {failed_names} 报告未初始化；"
                "应复查初始化/配置，实际数据响应优先于该状态提示。"
            ),
            details=details,
        )
    return diagnosis


def _diagnose_results(
    expected_channels: int,
    identity: PipetteIdentity,
    results: Sequence[DiagnosticResult],
) -> Diagnosis:
    summaries = _summarize_pairs(results)
    pressure_summaries = [item for item in summaries if item.sensor == "pressure"]
    capacitive_summaries = [item for item in summaries if item.sensor == "capacitive"]
    s0_state = _sensor_id_state(pressure_summaries, SensorId.S0.name)
    s1_state = _sensor_id_state(pressure_summaries, SensorId.S1.name)
    capacitive_s0_state = _sensor_id_state(capacitive_summaries, SensorId.S0.name)
    capacitive_s1_state = _sensor_id_state(capacitive_summaries, SensorId.S1.name)
    details = _health_details(summaries)
    peripheral_false_names = sorted(
        {
            f"{result.sensor}.{result.sensor_id}"
            for result in results
            if result.peripheral_ok is False
        }
    )
    if peripheral_false_names:
        details += "; peripheral_status_false=" + ",".join(peripheral_false_names)
    s1_initialization_failed = any(
        result.sensor == "pressure"
        and result.sensor_id == SensorId.S1.name
        and result.peripheral_ok is False
        for result in results
    )

    if identity.firmware_status == "bootloader":
        return _diagnosis(
            verdict="FAIL",
            code="PIPETTE_IN_BOOTLOADER",
            reason="移液器主板当前运行在 bootloader，应用固件未正常启动。",
            expected_channels=expected_channels,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )
    if (
        identity.firmware_channels is not None
        and identity.firmware_channels != expected_channels
    ):
        if expected_channels == 8 and identity.firmware_channels == 1:
            if identity.eeprom_channels == 1:
                code = "EEPROM_AND_FIRMWARE_CONFIGURED_AS_SINGLE"
                reason = (
                    "物理配置为 8 通道，但 EEPROM 身份和已烧录固件都报告单通道；"
                    "需要同时修正移液器身份配置并烧录 8 通道固件。"
                )
            else:
                code = "SINGLE_CHANNEL_FIRMWARE_ON_EIGHT_CHANNEL_PIPETTE"
                reason = (
                    "物理配置为 8 通道，但主板 DeviceInfo 明确报告 pipette_single；"
                    "可直接判定烧录了单通道固件。"
                )
        else:
            code = "PIPETTE_FIRMWARE_TYPE_MISMATCH"
            reason = (
                f"物理配置为 {expected_channels} 通道，但主板固件报告 "
                f"{identity.firmware_channels} 通道类型。"
            )
        return _diagnosis(
            verdict="FAIL",
            code=code,
            reason=reason,
            expected_channels=expected_channels,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )

    if (
        identity.eeprom_channels is not None
        and identity.eeprom_channels != expected_channels
    ):
        return _diagnosis(
            verdict="FAIL",
            code="EEPROM_PIPETTE_IDENTITY_MISMATCH",
            reason=(
                f"物理配置为 {expected_channels} 通道，但 EEPROM/序列身份报告 "
                f"{identity.eeprom_channels} 通道；请检查序列号/身份 provision 配置。"
            ),
            expected_channels=expected_channels,
            identity=identity,
            s0_state=s0_state,
            s1_state=s1_state,
            details=details,
            capacitive_s0_state=capacitive_s0_state,
            capacitive_s1_state=capacitive_s1_state,
        )

    if expected_channels == 1:
        diagnosis = _diagnose_single_channel(
            identity,
            s0_state,
            s1_state,
            capacitive_s0_state,
            capacitive_s1_state,
            details,
        )
    else:
        diagnosis = _diagnose_eight_channel(
            identity,
            s0_state,
            s1_state,
            capacitive_s0_state,
            capacitive_s1_state,
            details,
            s1_initialization_failed,
        )

    return _apply_supplemental_diagnostics(
        diagnosis=diagnosis,
        summaries=summaries,
        peripheral_false_names=peripheral_false_names,
        details=details,
    )


async def run(args: argparse.Namespace, writer: ResultWriter) -> bool:
    """Run diagnostic reads and return whether any read failed."""
    node = MOUNT_TO_NODE[args.mount]
    sensor_names = _selected_sensors(args.sensor)
    sensor_pairs = _selected_sensor_pairs(
        sensor_names=sensor_names,
        sensor_id=args.sensor_id,
        expected_channels=args.pipette_channels,
    )
    any_failed = False
    sample = 0
    results: List[DiagnosticResult] = []

    async with build.driver(build_settings(args)) as can_driver:
        messenger = CanMessenger(driver=can_driver)
        messenger.start()
        try:
            identity = await _read_pipette_identity(
                messenger=messenger,
                node=node,
                expected_channels=args.pipette_channels,
                timeout=args.timeout,
            )
            writer.write_pipette_identity(identity)
            while args.count == 0 or sample < args.count:
                sample += 1
                for sensor_name, sensor_id in sensor_pairs:
                    result = await _read_one(
                        messenger=messenger,
                        sample=sample,
                        mount=args.mount,
                        node=node,
                        sensor_name=sensor_name,
                        sensor_id=sensor_id,
                        offset=args.offset,
                        timeout=args.timeout,
                        check_status=args.check_status,
                    )
                    if args.count != 0:
                        results.append(result)
                    writer.write(result)
                    any_failed = any_failed or _is_failure(result)

                if args.count == 0 or sample < args.count:
                    await asyncio.sleep(args.interval)

            diagnosis = _diagnose_results(
                expected_channels=args.pipette_channels,
                identity=identity,
                results=results,
            )
            writer.write_diagnosis(diagnosis)
            any_failed = any_failed or diagnosis.verdict != "PASS"
        finally:
            await messenger.stop()

    return any_failed


def _systemd_service_state(service: str) -> Optional[str]:
    systemctl = shutil.which("systemctl")
    if systemctl is None:
        return None
    completed = subprocess.run(
        [systemctl, "is-active", service],
        check=False,
        capture_output=True,
        text=True,
    )
    state = completed.stdout.strip()
    return state or None


def _systemctl(action: str, service: str) -> None:
    systemctl = shutil.which("systemctl")
    if systemctl is None:
        raise RuntimeError("systemctl is unavailable on this host")
    subprocess.run([systemctl, action, service], check=True)


@contextmanager
def _exclusive_can_bus(
    manage_robot_server: bool, allow_shared_can: bool
) -> Iterator[None]:
    state = _systemd_service_state(ROBOT_SERVER_SERVICE)
    stopped_server = False
    if manage_robot_server and state is None:
        raise RuntimeError(
            f"Could not determine {ROBOT_SERVER_SERVICE} state with systemctl"
        )
    if state == "active":
        if manage_robot_server:
            print(f"Stopping {ROBOT_SERVER_SERVICE}...", file=sys.stderr)
            _systemctl("stop", ROBOT_SERVER_SERVICE)
            stopped_server = True
        elif not allow_shared_can:
            raise RuntimeError(
                f"{ROBOT_SERVER_SERVICE} is active and already owns the CAN bus. "
                "Stop it first or pass --manage-robot-server."
            )
        else:
            print(
                "WARNING: sharing the CAN bus can mix sensor responses and invalidate "
                "diagnostic results.",
                file=sys.stderr,
            )

    try:
        yield
    finally:
        if stopped_server:
            print(f"Starting {ROBOT_SERVER_SERVICE}...", file=sys.stderr)
            _systemctl("start", ROBOT_SERVER_SERVICE)


def _non_negative_int(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be >= 0")
    return parsed


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be > 0")
    return parsed


def _non_negative_float(value: str) -> float:
    parsed = float(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be >= 0")
    return parsed


def build_parser() -> argparse.ArgumentParser:
    """Build the command-line parser."""
    parser = argparse.ArgumentParser(
        description="Read and diagnose Flex pipette sensors without a protocol.",
        epilog=(
            "Examples:\n"
            "  python3 -m opentrons_hardware.scripts.read_pipette_sensor "
            "--mount left --pipette-channels 1 --sensor pressure "
            "--manage-robot-server\n"
            "  python3 -m opentrons_hardware.scripts.read_pipette_sensor "
            "--mount right --pipette-channels 8 --sensor all "
            "--count 10 --csv /data/pipette-sensors.csv "
            "--manage-robot-server"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--mount", choices=MOUNT_TO_NODE, default="left")
    parser.add_argument(
        "--pipette-channels",
        "--channels",
        type=int,
        choices=(1, 8),
        required=True,
        help="physical pipette assembly type; required for firmware diagnosis",
    )
    parser.add_argument(
        "--sensor",
        choices=("all", *SUPPORTED_SENSOR_NAMES),
        default="all",
        help="sensor type to read",
    )
    parser.add_argument(
        "--sensor-id",
        "--id",
        choices=("auto", "s0", "s1", "all"),
        default="auto",
        help=(
            "auto reads only physically expected IDs: pressure S0 for 1ch, "
            "pressure/capacitance S0/S1 for 8ch, and environment S0"
        ),
    )
    parser.add_argument(
        "--count",
        type=_non_negative_int,
        default=3,
        help=(
            "number of sample rounds; 0 streams continuously without a final diagnosis"
        ),
    )
    parser.add_argument(
        "--interval",
        type=_non_negative_float,
        default=0.5,
        help="seconds between sample rounds",
    )
    parser.add_argument(
        "--timeout",
        type=_positive_int,
        default=2,
        help="seconds to wait for each sensor response",
    )
    parser.add_argument(
        "--offset",
        action="store_true",
        help="request the firmware's offset-adjusted reading",
    )
    parser.add_argument(
        "--check-status",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="query PeripheralStatus before each sensor read (default: enabled)",
    )
    parser.add_argument(
        "--json",
        dest="json_output",
        action="store_true",
        help="write one JSON object per sensor request",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        help="also save every request and diagnostic field to CSV",
    )
    parser.add_argument(
        "--manage-robot-server",
        action="store_true",
        help="stop robot-server before reading and restore it on exit",
    )
    parser.add_argument(
        "--allow-shared-can",
        action="store_true",
        help="allow reading while robot-server is active (unsafe for diagnosis)",
    )
    add_can_args(parser)
    return parser


def _main(args: argparse.Namespace) -> int:
    try:
        with _exclusive_can_bus(
            manage_robot_server=args.manage_robot_server,
            allow_shared_can=args.allow_shared_can,
        ):
            with ResultWriter(args.json_output, args.csv) as writer:
                any_failed = asyncio.run(run(args, writer))
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130
    except Exception as error:
        print(f"ERROR: {_error_text(error)}", file=sys.stderr)
        return 2
    return 1 if any_failed else 0


def main() -> None:
    """CLI entry point."""
    raise SystemExit(_main(build_parser().parse_args()))


if __name__ == "__main__":
    main()

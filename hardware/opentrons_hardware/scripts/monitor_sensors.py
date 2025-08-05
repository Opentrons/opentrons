"""Script to monitor sensor output."""
import asyncio
import argparse
import datetime
from contextlib import AsyncExitStack
import struct

from opentrons_hardware.drivers.can_bus import (
    build,
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import constants, utils
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)
from opentrons_hardware.firmware_bindings.utils.binary_serializable import Int32Field
from opentrons_hardware.sensors.types import (
    SensorDataType,
    sensor_fixed_point_conversion,
)
from opentrons_hardware.sensors.sensor_driver import LogListener, SensorDriver
from opentrons_hardware.sensors.sensor_types import PressureSensor, CapacitiveSensor

from opentrons_hardware.scripts.can_args import add_can_args, build_settings


async def do_run(
    messenger: CanMessenger,
    callback: WaitableCallback,
    target_node: constants.NodeId,
    target_sensor: constants.SensorType,
    sensor_id: constants.SensorId,
    threshold: float,
) -> None:
    """Configure and start the monitoring."""
    threshold = 9999
    threshold_payload = payloads.SetSensorThresholdRequestPayload(
        sensor=fields.SensorTypeField(constants.SensorType.capacitive),
        sensor_id=fields.SensorIdField(sensor_id),
        threshold=Int32Field(int(threshold * sensor_fixed_point_conversion)),
        mode=fields.SensorThresholdModeField(constants.SensorThresholdMode.absolute),
    )
    threshold_message = message_definitions.SetSensorThresholdRequest(
        payload=threshold_payload
    )
    # await messenger.send(target_node, threshold_message)
    baseline_payload = payloads.BaselineSensorRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        number_of_reads=utils.UInt16Field(20),
    )
    baseline_message = message_definitions.BaselineSensorRequest(
        payload=baseline_payload
    )

    await messenger.ensure_send(target_node, baseline_message)
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(2),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)
    print(f"Sending stimulus to {target_node.name} {target_sensor.name}")
    pressure_sensor = PressureSensor.build(
        sensor_id=fields.SensorIdField(sensor_id),
        node_id=target_node,
        stop_threshold=Int32Field(threshold)
    )

    log_listener = LogListener(messenger=messenger, sensor=pressure_sensor)
    async with AsyncExitStack() as binding_stack:
        await binding_stack.enter_async_context(log_listener)

        await messenger.send(target_node, stim_message)
        start = datetime.datetime.now()
        try:
            print("Monitoring")
            async for message, _arbid in callback:
                if isinstance(message, message_definitions.ReadFromSensorResponse):
                    ts = (datetime.datetime.now() - start).total_seconds()
                    s = constants.SensorType(message.payload.sensor.value).name
                    d = SensorDataType.build(
                        message.payload.sensor_data, message.payload.sensor
                    )
                    rd = message.payload.sensor_data
                    print(f"{ts:.3f}: {s} {d.to_float():5.3f}, \traw data: {str(rd)}")
                elif isinstance(message, message_definitions.BatchReadFromSensorResponse):
                    ts = (datetime.datetime.now() - start).total_seconds()
                    s = constants.SensorType(message.payload.sensor.value).name
                    data_length = message.payload.data_length.value
                    data_bytes = message.payload.sensor_data.value
                    data_ints = [
                        int.from_bytes(data_bytes[i * 4 : i * 4 + 4], byteorder="little")
                        for i in range(data_length)
                    ]
                    data_ints_big = [
                        int.from_bytes(data_bytes[i * 4 : i * 4 + 4], byteorder="big")
                        for i in range(data_length)
                    ]
                    new_vals = [
                        (int(Int32Field(d).value) / 65536, int(Int32Field(b).value) / 65536**2)
                        for d, b in zip(data_ints, data_ints_big)
                    ] 
                    struct_vals = [
                        struct.unpack('>l', data_bytes[i * 4 : i * 4 + 4])[0] / 65536
                        for i in range(data_length)
                    ]

                    # convert the hex to int
                    # divide the int by 65536
                    # build as int32field



                    # data_floats = [
                    #     SensorDataType.build(d, message.payload.sensor)
                    #     for d in data_ints
                    # ]
                    # print(f"raw data = {message.payload.sensor_data:X}")
                    # breakpoint()
                    # for d in data_ints:
                    for v in struct_vals:
                        # pressure_val_float = d / 65536 
                        # print(f"{ts:.3f}: {s} {d}")
                        print(f"{ts:.3f}: {s} little {v:5.3f}") #', big {v[1]:5.3f}")

        finally:
            print("cleaning up")
            await messenger.send(target_node, reset_message)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    if args.mount == "gripper":
        target = constants.NodeId["gripper"]
    else:
        target = constants.NodeId["pipette_" + args.mount]
    sensor = constants.SensorType[args.sensor]
    sensor_id = constants.SensorId[args.id]

    async with build.can_messenger(build_settings(args)) as messenger:
        with WaitableCallback(messenger) as reader:
            return await do_run(
                messenger, reader, target, sensor, sensor_id, args.threshold
            )


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="CAN bus testing.")
    add_can_args(parser)
    parser.add_argument(
        "-m",
        "--mount",
        type=str,
        choices=["left", "right", "gripper"],
        help="which mount",
        default="right",
    )
    parser.add_argument(
        "-s",
        "--sensor",
        type=str,
        choices=["capacitive", "pressure", "environment"],
        help="which sensor",
        default="capacitive",
    )
    parser.add_argument(
        "-i",
        "--id",
        type=str,
        choices=["S0", "S1"],
        help="sensor id",
        default="S0",
    )
    parser.add_argument(
        "-t", "--threshold", type=float, help="sensor threshold", default=50
    )

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
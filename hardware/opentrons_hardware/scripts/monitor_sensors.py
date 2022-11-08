"""Script to monitor sensor output."""
import asyncio
import argparse
import datetime

from opentrons_hardware.drivers.can_bus import (
    build,
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import constants
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
    threshold_payload = payloads.SetSensorThresholdRequestPayload(
        sensor=fields.SensorTypeField(constants.SensorType.capacitive),
        sensor_id=fields.SensorIdField(sensor_id),
        threshold=Int32Field(int(threshold * sensor_fixed_point_conversion)),
        mode=fields.SensorThresholdModeField(constants.SensorThresholdMode.absolute),
    )
    threshold_message = message_definitions.SetSensorThresholdRequest(
        payload=threshold_payload
    )
    await messenger.send(target_node, threshold_message)
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(3),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)
    print(f"Sending stimulus to {target_node.name} {target_sensor.name}")
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
                print(f"{ts:.3f}: {s} {d.to_float():5.3f}")
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

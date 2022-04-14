import asyncio
import argparse
import datetime


from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings import constants
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)
from opentrons_hardware.sensors.utils import SensorDataType

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


async def do_run(
    messenger: CanMessenger,
    callback: WaitableCallback,
    target_node: constants.NodeId,
    target_sensor: constants.SensorType,
) -> None:
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        binding=fields.SensorOutputBindingField(3),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
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
                d = SensorDataType.build(message.payload.sensor_data)
                print(f"{ts:.3f}: {s} {d.to_float():5.3f}")
    finally:
        print("cleaning up")
        await messenger.send(target_node, reset_message)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))
    target = constants.NodeId["pipette_" + args.mount]
    sensor = constants.SensorType[args.sensor]

    messenger = CanMessenger(driver)
    messenger.start()
    with WaitableCallback(messenger) as reader:
        return await do_run(messenger, reader, target, sensor)


def main() -> None:
    """Entry point."""

    parser = argparse.ArgumentParser(description="CAN bus testing.")
    add_can_args(parser)
    parser.add_argument(
        "-m",
        "--mount",
        type=str,
        choices=["left", "right"],
        help="which mount",
        default="right",
    )
    parser.add_argument(
        "-s",
        "--sensor",
        type=str,
        choices=["capacitive"],
        help="which sensor",
        default="capacitive",
    )

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()

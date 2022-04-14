"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
from numpy import float64
from logging.config import dictConfig
from typing import Optional

from opentrons_hardware.drivers.can_bus import CanDriver
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.utils.binary_serializable import Int32Field
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.hardware_control.network import probe
import opentrons_hardware.sensors.utils as sensor_utils

from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads

from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    MoveType,
    MoveStopCondition,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}


class Capturer:
    def __init__(self) -> None:
        self.response_queue: asyncio.Queue[
            message_definitions.ReadFromSensorResponse
        ] = asyncio.Queue()

    def __call__(
        self,
        message: message_definitions.MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            self.response_queue.put_nowait(message)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()

    target_z = NodeId["head_" + args.mount]
    target_pipette = NodeId["pipette_" + args.mount]
    found = await probe(messenger, set((target_z, target_pipette)), 1)
    if target_z not in found or target_pipette not in found:
        raise RuntimeError(f"could not find targets for {args.mount} in {found}")

    await messenger.send(
        node_id=NodeId.broadcast, message=message_definitions.SetupRequest()
    )
    await messenger.send(
        node_id=NodeId.broadcast, message=message_definitions.EnableMotorRequest()
    )

    sensor_cap = Capturer()
    messenger.add_listener(sensor_cap, None)

    move_groups = [
        # Group 0 - home
        [
            {
                target_z: MoveGroupSingleAxisStep(
                    distance_mm=float64(0),
                    velocity_mm_sec=float64(50),
                    duration_sec=float64(1000),
                    acceleration_mm_sec_sq=float64(0),
                    stop_condition=MoveStopCondition.limit_switch,
                    move_type=MoveType.home,
                ),
            },
        ],
        # Group 1
        [
            {
                target_z: MoveGroupSingleAxisStep(
                    distance_mm=float64(args.prep_distance),
                    velocity_mm_sec=float64(args.prep_speed),
                    duration_sec=float64(args.prep_distance / args.prep_speed),
                ),
            },
            {
                target_z: MoveGroupSingleAxisStep(
                    distance_mm=float64(args.distance),
                    velocity_mm_sec=float64(args.speed),
                    duration_sec=float64(args.distance / args.speed),
                    stop_condition=MoveStopCondition.cap_sensor,
                    move_type=MoveType.calibration,
                ),
            },
        ],
    ]

    threshold_payload = payloads.SetSensorThresholdRequestPayload(
        sensor=fields.SensorTypeField(SensorType.capacitive),
        threshold=utils.Int32Field(int(args.threshold * 2**15)),
    )
    threshold_message = message_definitions.SetSensorThresholdRequest(
        payload=threshold_payload
    )
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(SensorType.capacitive),
        binding=fields.SensorOutputBindingField(3),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(SensorType.capacitive),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)
    runner = MoveGroupRunner(move_groups=move_groups)
    await can_messenger.send(target_pipette, threshold_message)
    await can_messenger.send(target_pipette, stim_message)

    try:
        position = await runner.run(can_messenger=messenger)
    except asyncio.CancelledError:
        pass
    finally:
        await can_messenger.send(reset_message)
        await messenger.stop()
        driver.shutdown()
        print(f"Position: {position[target_z]}")


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus move.")
    add_can_args(parser)
    parser.add_argument(
        "-m", "--mount", type="str", choices=["left", "right"], default="left"
    )
    parser.add_argument("-s", "--speed", type=float, default=5)
    parser.add_argument("-d", "--distance", type=float, default=5)
    parser.add_argument("-pd", "--prep-distance", type=float, default=50)
    parser.add_argument("-ps", "--prep-speed", type=float, default=50)
    parser.add_argument("-t", "--threshold", type=float, default=30)

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()

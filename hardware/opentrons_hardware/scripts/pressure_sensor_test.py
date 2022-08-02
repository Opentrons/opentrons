"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
import logging
from numpy import float64
from logging.config import dictConfig
from typing import Iterator, List, Any, Dict

from opentrons_hardware.drivers.can_bus import build, CanMessenger
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorType,
    SensorId,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.hardware_control.network import probe
import opentrons_hardware.sensors.utils as sensor_utils

from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    MessageDefinition,
    fields,
)

from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_home_step,
    create_step,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

log = logging.getLogger(__name__)


class InvalidInput(Exception):
    """Invalid input exception."""

    pass


def build_log_config(level: str) -> Dict[str, Any]:
    """Build a log config from a level."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
        },
        "handlers": {
            "stream_handler": {
                "class": "logging.StreamHandler",
                "formatter": "basic",
                "level": getattr(logging, level),
            },
        },
        "loggers": {
            "": {
                "handlers": ["stream_handler"],
                "level": getattr(logging, level),
            },
        },
    }


class Capturer:
    """Capture incoming sensor messages."""

    def __init__(self) -> None:
        """Build the capturer."""
        self.response_queue: asyncio.Queue[float] = asyncio.Queue()

    def _do_get_all(self) -> Iterator[float]:
        """Worker to get messages."""
        try:
            yield self.response_queue.get_nowait()
        except asyncio.QueueEmpty:
            return

    def get_all(self) -> List[float]:
        """Get all captured messages."""
        return list(self._do_get_all())

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            self.response_queue.put_nowait(
                sensor_utils.SensorDataType.build(
                    message.payload.sensor_data
                ).to_float()
            )


# take in input: which pipette (left, right, both) - list
# take in input: height of well in mm
# home target axes (head and pipette)
# send BindSensorOutputRequest w binding = 3 to target pipettes

# send a move for target axes, and sensor should stop the move
# may or may not cause a timeouterror

# figure out logging


def prompt_well_height() -> int:
    try:
        return int(input("enter well height(mm):"))
    except (ValueError, IndexError) as e:
        raise InvalidInput(str(e))


async def run_test(messenger: CanMessenger, args: argparse.Namespace) -> None:
    """Run the test."""
    target_z = NodeId["head_" + args.mount[0]]
    target_pipette = NodeId["pipette_" + args.mount]
    found = await probe(messenger, {NodeId.head, target_pipette}, 10)
    if NodeId.head not in found or target_pipette not in found:
        raise RuntimeError(f"could not find targets for {args.mount} in {found}")

    await messenger.send(
        node_id=NodeId.broadcast, message=message_definitions.EnableMotorRequest()
    )

    sensor_cap = Capturer()
    messenger.add_listener(sensor_cap, None)

    move_groups = [
        # Group 0 - home
        [create_home_step({target_z: float64(-1000)}, {target_z: float64(-50)})],
        # Group 1
        [
            create_step(
                {target_z: float64(args.prep_distance)},
                {target_z: float64(args.prep_speed)},
                {},
                float64(args.prep_distance / args.prep_speed),
                [target_z],
            ),
            create_step(
                {target_z: float64(args.distance)},
                {target_z: float64(args.speed)},
                {},
                float64(args.distance / args.speed),
                [target_z],
                MoveStopCondition.sync,
            ),
        ],
    ]
    # TODO: change MoveStopCondition.cap_sensor to sync

    # threshold_payload = payloads.SetSensorThresholdRequestPayload(
    #     sensor=fields.SensorTypeField(SensorType.capacitive),
    #     sensor_id=fields.SensorIdField(SensorId.S0),
    #     threshold=Int32Field(
    #         int(args.threshold * sensor_utils.sensor_fixed_point_conversion)
    #     ),
    #     mode=fields.SensorThresholdModeField(SensorThresholdMode.auto_baseline),
    # )
    # threshold_message = message_definitions.SetSensorThresholdRequest(
    #     payload=threshold_payload
    # )
    if args.verbose_monitoring:
        binding = 3
    else:
        binding = 1
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(SensorType.pressure),
        sensor_id=fields.SensorIdField(SensorId.S0),
        binding=fields.SensorOutputBindingField(binding),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(SensorType.pressure),
        sensor_id=fields.SensorIdField(SensorId.S0),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)
    runner = MoveGroupRunner(move_groups=move_groups)
    # move head and pipette to well height before starting
    await messenger.send(target_pipette, stim_message)
    position = await runner.run(can_messenger=messenger)
    if args.verbose_monitoring:
        print(f"Sensor data: {sensor_cap.get_all()}")
    print(f"Position: {position[target_z]}")
    await messenger.send(target_pipette, reset_message)
    await asyncio.get_running_loop().run_in_executor(
        None, lambda: input("press enter to home")
    )
    runner = MoveGroupRunner(move_groups=[move_groups[0]])
    await runner.run(can_messenger=messenger)
    await messenger.send(NodeId.broadcast, message_definitions.DisableMotorRequest())


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with build.can_messenger(build_settings(args)) as messenger:
        await run_test(messenger, args)


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="CAN bus move.")
    add_can_args(parser)
    parser.add_argument(
        "-m", "--mount", type=str, choices=["left", "right"], default="left"
    )
    parser.add_argument("-s", "--speed", type=float, default=5)
    parser.add_argument("-d", "--distance", type=float, default=7)
    parser.add_argument("-pd", "--prep-distance", type=float, default=12)
    parser.add_argument("-ps", "--prep-speed", type=float, default=50)
    parser.add_argument("-v", "--verbose-monitoring", action="store_true")
    parser.add_argument(
        "-l",
        "--log-level",
        type=str,
        choices=["INFO", "DEBUG", "WARNING", "ERROR"],
        default="WARNING",
    )
    args = parser.parse_args()
    dictConfig(build_log_config(args.log_level))

    asyncio.run(run(args))


if __name__ == "__main__":
    main()

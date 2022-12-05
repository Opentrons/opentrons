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
    SensorThresholdMode,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.hardware_control.network import probe
import opentrons_hardware.sensors.types as sensor_types

from opentrons_hardware.firmware_bindings.utils import (
    Int32Field,
    UInt8Field,
)
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
        self.mount = "left"

    def _do_get_all(self) -> Iterator[float]:
        """Worker to get messages."""
        try:
            yield self.response_queue.get_nowait()
        except asyncio.QueueEmpty:
            return

    def get_all(self) -> List[float]:
        """Get all captured messages."""
        return list(self._do_get_all())

    def set_mount(self, mount: str) -> None:
        self.mount = mount

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            self.response_queue.put_nowait(
                sensor_types.SensorDataType.build(
                    message.payload.sensor_data, message.payload.sensor
                ).to_float()
            )
        elif isinstance(message, message_definitions.MoveCompleted):
            if message.payload.ack_id == UInt8Field(2):
                if arbitration_id.parts.originating_node_id == \
                NodeId["head_" + self.mount[0]]:
                    print(f"\nmount position = {message.payload.current_position_um}")
                    print(f"mount encoder position = {message.payload.encoder_position_um}")
                elif arbitration_id.parts.originating_node_id == \
                NodeId["pipette_" + self.mount]:
                    print(f"\npipette position = {message.payload.current_position_um}")
                    print(f"pipette encoder position = {message.payload.encoder_position_um}")


async def run_test(messenger: CanMessenger, args: argparse.Namespace) -> None:
    """Run the test."""
    target_z = NodeId["head_" + args.mount[0]]
    target_pipette = NodeId["pipette_" + args.mount]
    found = await probe(messenger, {NodeId.head, target_pipette}, 10)
    if NodeId.head not in found or target_pipette not in found:
        raise RuntimeError(f"could not find targets for {args.mount} in {found}")

    slot_width = 55
    slot_length = 90
    slot_dist = {
        1: [2.5 * slot_width, 3.5 * slot_length],
        2: [1.5 * slot_width, 3.5 * slot_length],
        3: [0.5 * slot_width, 3.5 * slot_length],
        4: [2.5 * slot_width, 2.5 * slot_length],
        5: [1.5 * slot_width, 2.5 * slot_length],
        6: [0.5 * slot_width, 2.5 * slot_length],
        7: [2.5 * slot_width, 1.5 * slot_length],
        8: [1.5 * slot_width, 1.5 * slot_length],
        9: [0.5 * slot_width, 1.5 * slot_length],
        10: [2.5 * slot_width, 0.5 * slot_length],
        11: [1.5 * slot_width, 0.5 * slot_length],
        12: [0.5 * slot_width, 0.5 * slot_length],
    }
    # 164 x 107 each according to ot3_standards.json
    # using 152 x 103 from ot3repl

    x_dist = float64(slot_dist[args.which_slot][0])
    # print(f"x dist = {x_dist}, should be 75")
    sensor_cap = Capturer()
    sensor_cap.set_mount(args.mount)
    messenger.add_listener(sensor_cap, None)

    prep_move_group = [
        # Group 0 - home
        [
            create_home_step(
                {
                    NodeId.gantry_x: float64(-1000),
                    NodeId.gantry_y: float64(-1000),
                    target_z: float64(1000),
                    target_pipette: float64(500),
                },
                {
                    NodeId.gantry_x: float64(-40),
                    NodeId.gantry_y: float64(-40),
                    target_z: float64(-10),
                    target_pipette: float64(-10),
                },
            )
        ],
        [
            create_step(
                distance={
                    # NodeId.gantry_x: float64(slot_dist[args.which_slot][0]),
                    NodeId.gantry_x: float64(26.5),
                    NodeId.gantry_y: float64(slot_dist[args.which_slot][1]),
                },
                velocity={
                    NodeId.gantry_x: float64(args.gantry_speed + 2),
                    NodeId.gantry_y: float64(args.gantry_speed),
                },
                acceleration={},
                duration=float64(
                    max(slot_dist[args.which_slot][0], slot_dist[args.which_slot][1])
                    / args.gantry_speed
                ),
                present_nodes=[NodeId.gantry_x, NodeId.gantry_y],
                stop_condition=MoveStopCondition.none,
            )
        ],
        [
            create_step(
                distance={
                    target_z: float64(args.mount_start_height),
                },
                velocity={
                    target_z: float64(args.mount_speed),
                },
                acceleration={},
                duration=float64(args.mount_start_height / args.mount_speed),
                present_nodes=[target_z],
                stop_condition=MoveStopCondition.none,
            ),
        ],
    ]

    test_move_group = [
        [
            create_step(
                distance={
                    target_z: float64(args.mount_distance),
                    target_pipette: float64(70),
                },
                velocity={
                    target_z: float64(args.mount_speed),
                    target_pipette: float64(10),
                },
                acceleration={},
                duration=float64(6.75),
                present_nodes=[target_z, target_pipette],
                stop_condition=MoveStopCondition.none,
            ),
        ],
        [
            create_step(
                distance={
                    target_z: float64(-50),
                },
                velocity={
                    target_z: float64(-1 * args.mount_speed),
                },
                acceleration={},
                duration=float64(6.75),
                present_nodes=[target_z],
                stop_condition=MoveStopCondition.none,
            ),
        ]
    ]
    threshold_cmh20 = float(67)
    threshold_payload = payloads.SetSensorThresholdRequestPayload(
        sensor=fields.SensorTypeField(SensorType.pressure),
        sensor_id=fields.SensorIdField(0),
        threshold=Int32Field(
            int(threshold_cmh20 * sensor_types.sensor_fixed_point_conversion)
        ),
        mode=fields.SensorThresholdModeField(SensorThresholdMode.absolute),
    )
    threshold_message = message_definitions.SetSensorThresholdRequest(
        payload=threshold_payload
    )
    await messenger.send(target_pipette, threshold_message)

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
    runner = MoveGroupRunner(move_groups=prep_move_group)

    position = await runner.run(can_messenger=messenger)

    # await messenger.send(target_pipette, reset_message)
    await asyncio.get_running_loop().run_in_executor(
        None, lambda: input("\npress enter to start reading")
    )
    await messenger.send(target_pipette, stim_message)

    runner = MoveGroupRunner(move_groups=test_move_group)
    position = await runner.run(can_messenger=messenger)
    if args.verbose_monitoring:
        print(f"Sensor data: {sensor_cap.get_all()}")
    # print(f"Final position: {position}")

    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(SensorType.pressure),
        sensor_id=fields.SensorIdField(SensorId.S0),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)

    await asyncio.get_running_loop().run_in_executor(
        None, lambda: input("\npress enter to home")
    )
    await messenger.send(target_pipette, reset_message)
    runner = MoveGroupRunner(move_groups=[prep_move_group[0]])
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
    parser.add_argument("-ps", "--pipette-speed", type=float, default=10)
    parser.add_argument("-tv", "--threshold-value", type=float, default=10)
    parser.add_argument("-pd", "--pipette-distance", type=float, default=100)
    parser.add_argument("-mh", "--mount-start-height", type=float, default=140)
    parser.add_argument("-md", "--mount-distance", type=float, default=10)
    parser.add_argument("-ms", "--mount-speed", type=float, default=10)
    parser.add_argument("-gs", "--gantry-speed", type=float, default=60)
    parser.add_argument("-ws", "--which-slot", type=int, default=5)
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

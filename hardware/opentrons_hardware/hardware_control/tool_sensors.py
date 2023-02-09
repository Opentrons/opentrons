"""Functions for commanding motion limited by tool sensors."""
import asyncio
import csv
import time
from typing import Union, List, Iterator, Tuple, Dict, Any
from logging import getLogger
from numpy import float64
from math import copysign
from typing_extensions import Literal
import os

import opentrons_hardware.sensors.types as sensor_types
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    MessageDefinition,
)

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorThresholdMode,
    SensorOutputBinding,
)
from opentrons_hardware.sensors.types import (
    SensorDataType,
    sensor_fixed_point_conversion,
)
from opentrons_hardware.sensors.sensor_types import SensorInformation, PressureSensor
from opentrons_hardware.sensors.sensor_driver import SensorDriver
from opentrons_hardware.sensors.scheduler import SensorScheduler
from opentrons_hardware.sensors.utils import SensorThresholdInformation
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

LOG = getLogger(__name__)
ProbeTarget = Union[Literal[NodeId.pipette_left, NodeId.pipette_right, NodeId.gripper]]


class LogListener:
    """Capture incoming sensor messages."""

    def __init__(
        self,
        mount: NodeId,
        z_velocity: float,
        plunger_velocity: float,
        threshold_pascals: float,
    ) -> None:  # add args here to set mount, threshold, stuff to log
        """Build the capturer."""
        self.csv_writer = Any
        self.data_file = Any
        self.response_queue: asyncio.Queue[float] = asyncio.Queue()
        self.mount = mount
        self.new_file_created = not os.path.isfile("/var/pressure_sensor_data.csv")
        self.start_time = 0.0
        self.z_velocity = z_velocity
        self.plunger_velocity = plunger_velocity
        self.threshold_pascals = threshold_pascals

    async def __aenter__(self) -> None:
        """Create a csv heading for logging pressure readings."""
        heading = [
            "Pressure(pascals)",
            "time(s)",
            "z_velocity(mm/s)",
            "plunger_velocity(mm/s)",
            "threshold(pascals)",
        ]
        first_row = [
            0,
            self.start_time,
            self.z_velocity,
            self.plunger_velocity,
            self.threshold_pascals,
        ]

        if self.new_file_created:
            self.data_file = open("/var/pressure_sensor_data.csv", "w")
            self.csv_writer = csv.writer(self.data_file)
            self.csv_writer.writerows([heading, first_row])
        else:
            self.data_file = open("/var/pressure_sensor_data.csv", "a")
            self.csv_writer = csv.writer(self.data_file)

        self.start_time = time.time()

    async def __aexit__(self, *args: Any) -> None:
        """Close csv file."""
        self.data_file.close()  # type: ignore

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if isinstance(message, message_definitions.ReadFromSensorResponse):
            data = sensor_types.SensorDataType.build(
                message.payload.sensor_data, message.payload.sensor
            ).to_float()
            self.response_queue.put_nowait(data)
            current_time = round((time.time() - self.start_time), 3)
            self.csv_writer.writerow([data, current_time])  # type: ignore


def _build_pass_step(
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    stop_condition: MoveStopCondition = MoveStopCondition.sync_line,
) -> MoveGroupStep:
    # use any node present to calculate duration of the move, assuming the durations
    #   will be the same
    return create_step(
        distance={ax: float64(abs(distance[ax])) for ax in movers},
        velocity={
            ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
        },
        acceleration={},
        duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
        present_nodes=movers,
        stop_condition=stop_condition,
    )


async def liquid_probe(
    messenger: CanMessenger,
    tool: ProbeTarget,
    head_node: NodeId,
    max_z_distance: float,
    plunger_speed: float,
    mount_speed: float,
    starting_mount_height: float,
    prep_move_speed: float,
    threshold_pascals: float,
    log_pressure: bool = True,
    read_only: bool = False,
    sensor_id: SensorId = SensorId.S0,
) -> Dict[NodeId, Tuple[float, float, bool, bool]]:
    """Create and run liquid probing moves."""
    """Move the mount down to the starting height, then move the
    mount and pipette while reading from the pressure sensor.
    """

    sensor_driver = SensorDriver()
    threshold_fixed_point = threshold_pascals * sensor_fixed_point_conversion
    pressure_sensor = PressureSensor.build(
        sensor_id=sensor_id,
        node_id=tool,
        stop_threshold=threshold_fixed_point,
    )

    if read_only:
        stop_condition = MoveStopCondition.none
        binding = [SensorOutputBinding.report]
    else:
        stop_condition = MoveStopCondition.sync_line
        binding = [SensorOutputBinding.sync]
        await sensor_driver.send_stop_threshold(messenger, pressure_sensor)

    prep_move = create_step(
        distance={head_node: float64(abs(starting_mount_height))},
        velocity={head_node: float64(prep_move_speed)},
        acceleration={},
        duration=float64(abs(starting_mount_height / prep_move_speed)),
        present_nodes=[head_node],
        stop_condition=MoveStopCondition.none,
    )

    sensor_group = _build_pass_step(
        movers=[head_node, tool],
        distance={head_node: max_z_distance, tool: max_z_distance},
        speed={head_node: mount_speed, tool: plunger_speed},
        stop_condition=stop_condition,
    )

    prep_runner = MoveGroupRunner(move_groups=[[prep_move]])
    sensor_runner = MoveGroupRunner(move_groups=[[sensor_group]])
    await prep_runner.run(can_messenger=messenger)

    if log_pressure:
        sensor_capturer = SensorLog(
            head_node, mount_speed, plunger_speed, threshold_pascals
        )
        binding.append(SensorOutputBinding.report)

    async with sensor_driver.bind_output(messenger, pressure_sensor, binding):
        if log_pressure:
            messenger.add_listener(sensor_capturer, None)

            async with sensor_capturer:
                positions = await sensor_runner.run(can_messenger=messenger)
            messenger.remove_listener(sensor_capturer)

        else:
            positions = await sensor_runner.run(can_messenger=messenger)

    return positions


async def capacitive_probe(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
    sensor_id: SensorId = SensorId.S0,
    relative_threshold_pf: float = 1.0,
    log_sensor_values: bool = False,
) -> Tuple[float, float]:
    """Move the specified tool down until its capacitive sensor triggers.

    Moves down by the specified distance at the specified speed until the
    capacitive sensor triggers and returns the position afterward.

    The direction is sgn(distance)*sgn(speed), so you can set the direction
    either by negating speed or negating distance.
    """
    sensor_scheduler = SensorScheduler()
    sensor_info = SensorInformation(SensorType.capacitive, sensor_id, tool)
    threshold = await sensor_scheduler.send_threshold(
        SensorThresholdInformation(
            sensor=sensor_info,
            data=SensorDataType.build(relative_threshold_pf, SensorType.capacitive),
            mode=SensorThresholdMode.auto_baseline,
        ),
        messenger,
    )
    if not threshold:
        raise RuntimeError("Could not set threshold for probe")
    LOG.info(f"starting capacitive probe with threshold {threshold.to_float()}")
    pass_group = _build_pass_step([mover], {mover: distance}, {mover: speed})
    runner = MoveGroupRunner(move_groups=[[pass_group]])
    async with sensor_scheduler.bind_sync(
        sensor_info,
        messenger,
        do_log=log_sensor_values,
    ):
        position = await runner.run(can_messenger=messenger)
        return position[mover][:2]


async def capacitive_pass(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
    sensor_id: SensorId = SensorId.S0,
) -> List[float]:
    """Move the specified axis while capturing capacitive sensor readings."""
    sensor_scheduler = SensorScheduler()
    sensor_info = SensorInformation(
        sensor_type=SensorType.capacitive,
        sensor_id=sensor_id,
        node_id=tool,
    )
    pass_group = _build_pass_step([mover], {mover: distance}, {mover: speed})
    runner = MoveGroupRunner(move_groups=[[pass_group]])
    await runner.prep(messenger)
    async with sensor_scheduler.capture_output(sensor_info, messenger) as output_queue:
        await runner.execute(messenger)

    def _drain() -> Iterator[float]:
        while True:
            try:
                yield output_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    return list(_drain())

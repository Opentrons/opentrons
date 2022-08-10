"""Functions for commanding motion limited by tool sensors."""
import asyncio
from typing import Union, List, Iterator, Tuple
from logging import getLogger
from numpy import float64
from math import copysign
from typing_extensions import Literal
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorThresholdMode,
)
from opentrons_hardware.sensors.types import SensorDataType
from opentrons_hardware.sensors.sensor_types import SensorInformation
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


def _build_pass_step(mover: NodeId, distance: float, speed: float) -> MoveGroupStep:
    return create_step(
        distance={mover: float64(abs(distance))},
        velocity={mover: float64(speed * copysign(1.0, distance))},
        acceleration={},
        duration=float64(abs(distance / speed)),
        present_nodes=[mover],
        stop_condition=MoveStopCondition.cap_sensor,
    )


async def capacitive_probe(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
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
    sensor_info = SensorInformation(SensorType.capacitive, SensorId.S0, tool)
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
    pass_group = _build_pass_step(mover, distance, speed)
    runner = MoveGroupRunner(move_groups=[[pass_group]])
    async with sensor_scheduler.bind_sync(
        sensor_info,
        messenger,
        log=log_sensor_values,
    ):
        position = await runner.run(can_messenger=messenger)
        return position[mover]


async def capacitive_pass(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
) -> List[float]:
    """Move the specified axis while capturing capacitive sensor readings."""
    sensor_scheduler = SensorScheduler()
    sensor_info = SensorInformation(
        sensor_type=SensorType.capacitive, sensor_id=SensorId.S0, node_id=tool
    )
    pass_group = _build_pass_step(mover, distance, speed)
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

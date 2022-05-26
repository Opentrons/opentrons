"""Functions for commanding motion limited by tool sensors."""
from typing import Union
from logging import getLogger
from numpy import float64
from typing_extensions import Literal
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorType,
    SensorThresholdMode,
)
from opentrons_hardware.sensors.scheduler import SensorScheduler
from opentrons_hardware.sensors.utils import (
    SensorInformation,
    SensorThresholdInformation,
    SensorDataType,
)
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.hardware_control.motion import MoveStopCondition, create_step
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

LOG = getLogger(__name__)
ProbeTarget = Union[Literal[NodeId.pipette_left, NodeId.pipette_right, NodeId.gripper]]


async def capacitive_probe(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
    relative_threshold_pf: float = 1.0,
    log_sensor_values: bool = False,
) -> float:
    """Move the specified tool down until its capacitive sensor triggers.

    Moves down by the specified distance at the specified speed until the
    capacitive sensor triggers and returns the position afterward.
    """
    sensor_scheduler = SensorScheduler()
    threshold = await sensor_scheduler.send_threshold(
        SensorThresholdInformation(
            sensor_type=SensorType.capacitive,
            node_id=tool,
            data=SensorDataType.build(relative_threshold_pf),
            mode=SensorThresholdMode.auto_baseline,
        ),
        messenger,
    )
    if not threshold:
        raise RuntimeError("Could not set threshold for probe")
    LOG.info(f"starting capacitive probe with threshold {threshold.to_float()}")
    pass_group = create_step(
        distance={mover: float64(distance)},
        velocity={mover: float64(speed)},
        acceleration={},
        duration=float64(distance / speed),
        present_nodes=[mover],
        stop_condition=MoveStopCondition.cap_sensor,
    )
    runner = MoveGroupRunner(move_groups=[[pass_group]])
    async with sensor_scheduler.bind_sync(
        SensorInformation(sensor_type=SensorType.capacitive, node_id=tool),
        messenger,
        log=log_sensor_values,
    ):
        position = await runner.run(can_messenger=messenger)
        return position[mover]

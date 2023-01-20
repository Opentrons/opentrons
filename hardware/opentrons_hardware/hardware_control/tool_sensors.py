"""Functions for commanding motion limited by tool sensors."""
import asyncio
from typing import Union, List, Iterator, Tuple, Dict
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


def _build_pass_step(
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    sensor_stop_condition: MoveStopCondition = MoveStopCondition.cap_sensor,
) -> MoveGroupStep:
    # use the head node to determine the duration of the move
    head_node = [ax for ax in movers if ax in [NodeId.head_l, NodeId.head_r]][0]
    return create_step(
        distance={ax: float64(abs(distance[ax])) for ax in movers},
        velocity={
            ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
        },
        acceleration={},
        duration=float64(abs(distance[head_node] / speed[head_node])),
        present_nodes=movers,
        stop_condition=sensor_stop_condition,
    )


async def liquid_probe(
    messenger: CanMessenger,
    tool: ProbeTarget,
    mount: NodeId,
    max_z_distance: float,
    plunger_speed: float,
    mount_speed: float,
    starting_mount_height: float,
    prep_move_speed: float,
    sensor_id: SensorId = SensorId.S0,
    threshold_pascals: float = 1.0,
) -> Dict[NodeId, Tuple[float, float, bool, bool]]:
    """Move the mount down to the starting height, then move the
    mount and pipette while reading from the pressure sensor."""
    sensor_driver = SensorDriver()
    threshold_fixed_point = threshold_pascals * sensor_fixed_point_conversion
    pressure_sensor = PressureSensor.build(
        sensor_id=sensor_id,
        node_id=tool,
        stop_threshold=threshold_fixed_point,
    )

    sensor_group = _build_pass_step(
        movers=[mount, tool],
        distance={mount: max_z_distance, tool: max_z_distance},
        speed={mount: mount_speed, tool: plunger_speed},
        sensor_stop_condition=MoveStopCondition.pressure_sensor,
    )

    prep_move = create_step(
        distance={mount: float64(abs(starting_mount_height))},
        velocity={mount: float64(prep_move_speed)},
        acceleration={},
        duration=float64(abs(starting_mount_height / prep_move_speed)),
        present_nodes=[mount],
        stop_condition=MoveStopCondition.none,
    )

    await sensor_driver.send_stop_threshold(messenger, pressure_sensor)
    prep_runner = MoveGroupRunner(move_groups=[[prep_move]])
    sensor_runner = MoveGroupRunner(move_groups=[[sensor_group]])
    await prep_runner.run(can_messenger=messenger)
    async with sensor_driver.bind_output(
        messenger,
        pressure_sensor,
    ):
        return await sensor_runner.run(can_messenger=messenger)


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

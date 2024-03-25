"""Functions for commanding motion limited by tool sensors."""
import asyncio
from functools import partial
from typing import (
    Union,
    List,
    Iterator,
    Tuple,
    Dict,
    Callable,
    AsyncContextManager,
    Optional,
)
from logging import getLogger
from numpy import float64
from math import copysign
from typing_extensions import Literal

from opentrons_shared_data.errors.exceptions import CanbusCommunicationError

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorThresholdMode,
    SensorOutputBinding,
    ErrorCode,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    SendAccumulatedPressureDataPayload,
    BindSensorOutputRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorIdField,
    SensorOutputBindingField,
    SensorTypeField,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BindSensorOutputRequest,
    SendAccumulatedPressureDataRequest,
)
from opentrons_hardware.sensors.sensor_driver import SensorDriver, LogListener
from opentrons_hardware.sensors.types import (
    SensorDataType,
    sensor_fixed_point_conversion,
)
from opentrons_hardware.sensors.sensor_types import SensorInformation, PressureSensor
from opentrons_hardware.sensors.scheduler import SensorScheduler
from opentrons_hardware.sensors.utils import SensorThresholdInformation
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.types import MotorPositionStatus

LOG = getLogger(__name__)
PipetteProbeTarget = Literal[NodeId.pipette_left, NodeId.pipette_right]
InstrumentProbeTarget = Union[PipetteProbeTarget, Literal[NodeId.gripper]]

pressure_output_file_heading = [
    "time(s)",
    "Pressure(pascals)",
    "z_velocity(mm/s)",
    "plunger_velocity(mm/s)",
    "threshold(pascals)",
]

# FIXME we should organize all of these functions to use the sensor drivers.
# FIXME we should restrict some of these functions by instrument type.


def _build_pass_step(
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    stop_condition: MoveStopCondition = MoveStopCondition.sync_line,
) -> MoveGroupStep:
    pipette_nodes = [
        i for i in movers if i in [NodeId.pipette_left, NodeId.pipette_right]
    ]

    move_group = create_step(
        distance={ax: float64(abs(distance[ax])) for ax in movers},
        velocity={
            ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
        },
        acceleration={},
        # use any node present to calculate duration of the move, assuming the durations
        #   will be the same
        duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
        present_nodes=movers,
        stop_condition=stop_condition,
    )
    pipette_move = create_step(
        distance={ax: float64(abs(distance[ax])) for ax in movers},
        velocity={
            ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
        },
        acceleration={},
        # use any node present to calculate duration of the move, assuming the durations
        #   will be the same
        duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
        present_nodes=pipette_nodes,
        stop_condition=MoveStopCondition.sensor_report,
    )
    for node in pipette_nodes:
        move_group[node] = pipette_move[node]
    return move_group


async def run_sync_buffer_to_csv(
    messenger: CanMessenger,
    sensor_driver: SensorDriver,
    pressure_sensor: PressureSensor,
    mount_speed: float,
    plunger_speed: float,
    threshold_pascals: float,
    head_node: NodeId,
    move_group: MoveGroupRunner,
    log_file: str,
    tool: PipetteProbeTarget,
    sensor_id: SensorId,
) -> Dict[NodeId, MotorPositionStatus]:
    """Runs the sensor pass move group and creates a csv file with the results."""
    sensor_metadata = [0, 0, mount_speed, plunger_speed, threshold_pascals]
    sensor_capturer = LogListener(
        mount=head_node,
        data_file=log_file,
        file_heading=pressure_output_file_heading,
        sensor_metadata=sensor_metadata,
    )
    async with sensor_capturer:
        print("starting move group runner")
        positions = await move_group.run(can_messenger=messenger)
        messenger.add_listener(sensor_capturer, None)
        await messenger.send(
            node_id=tool,
            message=SendAccumulatedPressureDataRequest(
                payload=SendAccumulatedPressureDataPayload(
                    sensor_id=SensorIdField(sensor_id)
                )
            ),
        )
        await asyncio.sleep(10)
        messenger.remove_listener(sensor_capturer)
    await messenger.send(
        node_id=tool,
        message=BindSensorOutputRequest(
            payload=BindSensorOutputRequestPayload(
                sensor=SensorTypeField(SensorType.pressure),
                sensor_id=SensorIdField(sensor_id),
                binding=SensorOutputBindingField(SensorOutputBinding.none),
            )
        ),
    )
    return positions


async def run_stream_output_to_csv(
    messenger: CanMessenger,
    sensor_driver: SensorDriver,
    pressure_sensor: PressureSensor,
    mount_speed: float,
    plunger_speed: float,
    threshold_pascals: float,
    head_node: NodeId,
    move_group: MoveGroupRunner,
    log_file: str,
) -> Dict[NodeId, MotorPositionStatus]:
    """Runs the sensor pass move group and creates a csv file with the results."""
    sensor_metadata = [0, 0, mount_speed, plunger_speed, threshold_pascals]
    sensor_capturer = LogListener(
        mount=head_node,
        data_file=log_file,
        file_heading=pressure_output_file_heading,
        sensor_metadata=sensor_metadata,
    )
    binding = [SensorOutputBinding.sync, SensorOutputBinding.report]

    async with sensor_driver.bind_output(messenger, pressure_sensor, binding):
        messenger.add_listener(sensor_capturer, None)

        async with sensor_capturer:
            positions = await move_group.run(can_messenger=messenger)
        messenger.remove_listener(sensor_capturer)

    return positions


async def liquid_probe(
    messenger: CanMessenger,
    tool: PipetteProbeTarget,
    head_node: NodeId,
    max_z_distance: float,
    plunger_speed: float,
    mount_speed: float,
    threshold_pascals: float,
    csv_output: bool = False,
    sync_buffer_output: bool = False,
    can_bus_only_output: bool = False,
    # output_option: OutputOptions,
    data_file: Optional[str] = None,
    auto_zero_sensor: bool = True,
    num_baseline_reads: int = 10,
    sensor_id: SensorId = SensorId.S0,
) -> Dict[NodeId, MotorPositionStatus]:
    """Move the mount and pipette simultaneously while reading from the pressure sensor."""
    sensor_driver = SensorDriver()
    threshold_fixed_point = threshold_pascals * sensor_fixed_point_conversion
    pressure_sensor = PressureSensor.build(
        sensor_id=sensor_id,
        node_id=tool,
        stop_threshold=threshold_fixed_point,
    )

    if auto_zero_sensor:
        pressure_baseline = await sensor_driver.get_baseline(
            messenger, pressure_sensor, num_baseline_reads
        )
        LOG.debug(f"found baseline pressure: {pressure_baseline} pascals")

    await sensor_driver.send_stop_threshold(messenger, pressure_sensor)

    sensor_group = _build_pass_step(
        movers=[head_node, tool],
        distance={head_node: max_z_distance, tool: max_z_distance},
        speed={head_node: mount_speed, tool: plunger_speed},
        stop_condition=MoveStopCondition.sync_line,
    )

    sensor_runner = MoveGroupRunner(move_groups=[[sensor_group]])
    log_file: str = "/var/pressure_sensor_data.csv" if not data_file else data_file
    if csv_output:
        return await run_stream_output_to_csv(
            messenger,
            sensor_driver,
            pressure_sensor,
            mount_speed,
            plunger_speed,
            threshold_pascals,
            head_node,
            sensor_runner,
            log_file,
        )
    elif sync_buffer_output:
        return await run_sync_buffer_to_csv(
            messenger,
            sensor_driver,
            pressure_sensor,
            mount_speed,
            plunger_speed,
            threshold_pascals,
            head_node,
            sensor_runner,
            log_file,
            tool=tool,
            sensor_id=sensor_id,
        )
    elif can_bus_only_output:
        async with sensor_driver.bind_output(
            messenger,
            pressure_sensor,
            [
                SensorOutputBinding.sync,
                SensorOutputBinding.report,
            ],
        ):
            return await sensor_runner.run(can_messenger=messenger)
    else:  # none
        async with sensor_driver.bind_output(
            messenger,
            pressure_sensor,
            [
                SensorOutputBinding.sync,
            ],
        ):
            return await sensor_runner.run(can_messenger=messenger)


async def check_overpressure(
    messenger: CanMessenger,
    tools: Dict[PipetteProbeTarget, List[SensorId]],
) -> Callable[..., AsyncContextManager["asyncio.Queue[Tuple[NodeId, ErrorCode]]"]]:
    """Montior for overpressure in the system.

    Returns a partial context manager to be used in the hardware controller so
    we can wrap moves.
    """
    sensor_scheduler = SensorScheduler()
    sensor_info = []
    for tool, sensor_ids in tools.items():
        for _ids in sensor_ids:
            sensor_info.append(SensorInformation(SensorType.pressure, _ids, tool))
    return partial(
        sensor_scheduler.monitor_exceed_max_threshold, sensor_info, messenger
    )


async def capacitive_probe(
    messenger: CanMessenger,
    tool: InstrumentProbeTarget,
    mover: NodeId,
    distance: float,
    speed: float,
    sensor_id: SensorId = SensorId.S0,
    relative_threshold_pf: float = 1.0,
    log_sensor_values: bool = False,
) -> MotorPositionStatus:
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
        raise CanbusCommunicationError(
            message="Could not set threshold for probe",
            detail={
                "tool": tool.name,
                "sensor": sensor_id.name,
                "threshold": str(relative_threshold_pf),
            },
        )
    LOG.info(f"starting capacitive probe with threshold {threshold.to_float()}")
    pass_group = _build_pass_step([mover], {mover: distance}, {mover: speed})
    runner = MoveGroupRunner(move_groups=[[pass_group]])
    async with sensor_scheduler.bind_sync(
        sensor_info,
        messenger,
        do_log=log_sensor_values,
    ):
        position = await runner.run(can_messenger=messenger)
        return position[mover]


async def capacitive_pass(
    messenger: CanMessenger,
    tool: InstrumentProbeTarget,
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

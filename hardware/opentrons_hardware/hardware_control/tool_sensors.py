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

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorOutputBinding,
    ErrorCode,
    SensorThresholdMode,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    SendAccumulatedSensorDataPayload,
    BindSensorOutputRequestPayload,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    SensorIdField,
    SensorOutputBindingField,
    SensorTypeField,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    BindSensorOutputRequest,
    SendAccumulatedSensorDataRequest,
)
from opentrons_hardware.sensors.sensor_driver import SensorDriver, LogListener
from opentrons_hardware.sensors.types import (
    sensor_fixed_point_conversion,
)
from opentrons_hardware.sensors.sensor_types import (
    SensorInformation,
    PressureSensor,
    CapacitiveSensor,
)
from opentrons_hardware.sensors.scheduler import SensorScheduler
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
ProbeSensorDict = Union[
    Dict[SensorId, PressureSensor], Dict[SensorId, CapacitiveSensor]
]

pressure_output_file_heading = [
    "time(s)",
    "Pressure(pascals)",
    "z_velocity(mm/s)",
    "plunger_velocity(mm/s)",
    "threshold(pascals)",
]

capacitive_output_file_heading = [
    "time(s)",
    "Capacitance(farads)",
    "z_velocity(mm/s)",
    "plunger_velocity(mm/s)",
    "threshold(farads)",
]

# FIXME we should organize all of these functions to use the sensor drivers.
# FIXME we should restrict some of these functions by instrument type.

Z_SOLO_MOVE_DISTANCE = 0.5
PLUNGER_SOLO_MOVE_TIME = 0.2


def _fix_pass_step_for_buffer(
    move_group: MoveGroupStep,
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    sensor_type: SensorType,
    sensor_id: SensorId,
    stop_condition: MoveStopCondition = MoveStopCondition.sync_line,
) -> MoveGroupStep:
    tool_nodes = [
        i
        for i in movers
        if i in [NodeId.pipette_left, NodeId.pipette_right, NodeId.gripper]
    ]
    if sensor_type == SensorType.pressure:
        tool_move = create_step(
            distance={ax: float64(abs(distance[ax])) for ax in movers},
            velocity={
                ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
            },
            acceleration={},
            # use any node present to calculate duration of the move, assuming the durations
            #   will be the same
            duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
            present_nodes=tool_nodes,
            stop_condition=MoveStopCondition.sensor_report,
            sensor_type_pass=sensor_type,
            sensor_id_pass=sensor_id,
        )
    elif sensor_type == SensorType.capacitive:
        tool_move = create_step(
            distance={},
            velocity={},
            acceleration={},
            # use any node present to calculate duration of the move, assuming the durations
            #   will be the same
            duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
            present_nodes=tool_nodes,
            stop_condition=MoveStopCondition.sensor_report,
            sensor_type_pass=sensor_type,
            sensor_id_pass=sensor_id,
        )
    for node in tool_nodes:
        move_group[node] = tool_move[node]
    return move_group


def _build_pass_step(
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    sensor_type: SensorType,
    sensor_id: SensorId,
    stop_condition: MoveStopCondition = MoveStopCondition.sync_line,
) -> MoveGroupStep:
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
        sensor_type_pass=sensor_type,
        sensor_id_pass=sensor_id,
    )
    return move_group


async def run_sync_buffer_to_csv(
    messenger: CanMessenger,
    mount_speed: float,
    plunger_speed: float,
    threshold: float,
    head_node: NodeId,
    move_group: MoveGroupRunner,
    log_files: Dict[SensorId, str],
    tool: InstrumentProbeTarget,
    sensor_type: SensorType,
    output_file_heading: list[str],
) -> Dict[NodeId, MotorPositionStatus]:
    """Runs the sensor pass move group and creates a csv file with the results."""
    sensor_metadata = [0, 0, mount_speed, plunger_speed, threshold]
    positions = await move_group.run(can_messenger=messenger)
    for sensor_id in log_files.keys():
        sensor_capturer = LogListener(
            mount=head_node,
            data_file=log_files[sensor_id],
            file_heading=output_file_heading,
            sensor_metadata=sensor_metadata,
        )
        async with sensor_capturer:
            messenger.add_listener(sensor_capturer, None)
            await messenger.send(
                node_id=tool,
                message=SendAccumulatedSensorDataRequest(
                    payload=SendAccumulatedSensorDataPayload(
                        sensor_id=SensorIdField(sensor_id),
                        sensor_type=SensorTypeField(sensor_type),
                    )
                ),
            )
            await sensor_capturer.wait_for_complete()
            messenger.remove_listener(sensor_capturer)
        await messenger.send(
            node_id=tool,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_type),
                    sensor_id=SensorIdField(sensor_id),
                    binding=SensorOutputBindingField(SensorOutputBinding.none),
                )
            ),
        )
    return positions


async def run_stream_output_to_csv(
    messenger: CanMessenger,
    sensors: ProbeSensorDict,
    mount_speed: float,
    plunger_speed: float,
    threshold: float,
    head_node: NodeId,
    move_group: MoveGroupRunner,
    log_files: Dict[SensorId, str],
    output_file_heading: list[str],
) -> Dict[NodeId, MotorPositionStatus]:
    """Runs the sensor pass move group and creates a csv file with the results."""
    sensor_metadata = [0, 0, mount_speed, plunger_speed, threshold]
    sensor_capturer = LogListener(
        mount=head_node,
        data_file=log_files[
            next(iter(log_files))
        ],  # hardcode to the first file, need to think more on this
        file_heading=output_file_heading,
        sensor_metadata=sensor_metadata,
    )
    binding = [SensorOutputBinding.sync, SensorOutputBinding.report]
    binding_field = SensorOutputBindingField.from_flags(binding)
    for sensor_id in sensors.keys():
        sensor_info = sensors[sensor_id].sensor
        await messenger.send(
            node_id=sensor_info.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_info.sensor_type),
                    sensor_id=SensorIdField(sensor_info.sensor_id),
                    binding=binding_field,
                )
            ),
        )

    messenger.add_listener(sensor_capturer, None)
    async with sensor_capturer:
        positions = await move_group.run(can_messenger=messenger)
    messenger.remove_listener(sensor_capturer)

    for sensor_id in sensors.keys():
        sensor_info = sensors[sensor_id].sensor
        await messenger.send(
            node_id=sensor_info.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_info.sensor_type),
                    sensor_id=SensorIdField(sensor_info.sensor_id),
                    binding=SensorOutputBindingField(SensorOutputBinding.none),
                )
            ),
        )
    return positions


async def _setup_pressure_sensors(
    messenger: CanMessenger,
    sensor_id: SensorId,
    tool: PipetteProbeTarget,
    num_baseline_reads: int,
    threshold_fixed_point: float,
    sensor_driver: SensorDriver,
    auto_zero_sensor: bool,
) -> Dict[SensorId, PressureSensor]:
    sensors: List[SensorId] = []
    result: Dict[SensorId, PressureSensor] = {}
    if sensor_id == SensorId.BOTH:
        sensors.append(SensorId.S0)
        sensors.append(SensorId.S1)
    else:
        sensors.append(sensor_id)

    for sensor in sensors:
        pressure_sensor = PressureSensor.build(
            sensor_id=sensor,
            node_id=tool,
            stop_threshold=threshold_fixed_point,
        )

        if auto_zero_sensor:
            pressure_baseline = await sensor_driver.get_baseline(
                messenger, pressure_sensor, num_baseline_reads
            )
            LOG.debug(f"found baseline pressure: {pressure_baseline} pascals")

        await sensor_driver.send_stop_threshold(messenger, pressure_sensor)
        result[sensor] = pressure_sensor
    return result


async def _setup_capacitive_sensors(
    messenger: CanMessenger,
    sensor_id: SensorId,
    tool: InstrumentProbeTarget,
    relative_threshold_pf: float,
    sensor_driver: SensorDriver,
) -> Dict[SensorId, CapacitiveSensor]:
    sensors: List[SensorId] = []
    result: Dict[SensorId, CapacitiveSensor] = {}
    if sensor_id == SensorId.BOTH:
        sensors.append(SensorId.S0)
        sensors.append(SensorId.S1)
    else:
        sensors.append(sensor_id)

    for sensor in sensors:
        capacitive_sensor = CapacitiveSensor.build(
            sensor_id=sensor,
            node_id=tool,
            stop_threshold=relative_threshold_pf,
        )
        threshold = await sensor_driver.send_stop_threshold(
            messenger, capacitive_sensor, SensorThresholdMode.auto_baseline
        )
        LOG.info(
            f"starting capacitive probe with threshold {threshold.to_float() if threshold is not None else None}"
        )
        result[sensor] = capacitive_sensor
    return result


async def _run_with_binding(
    messenger: CanMessenger,
    sensors: ProbeSensorDict,
    sensor_runner: MoveGroupRunner,
    binding: List[SensorOutputBinding],
) -> Dict[NodeId, MotorPositionStatus]:
    binding_field = SensorOutputBindingField.from_flags(binding)
    for sensor_id in sensors.keys():
        sensor_info = sensors[sensor_id].sensor
        await messenger.send(
            node_id=sensor_info.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_info.sensor_type),
                    sensor_id=SensorIdField(sensor_info.sensor_id),
                    binding=binding_field,
                )
            ),
        )

    result = await sensor_runner.run(can_messenger=messenger)
    for sensor_id in sensors.keys():
        sensor_info = sensors[sensor_id].sensor
        await messenger.send(
            node_id=sensor_info.node_id,
            message=BindSensorOutputRequest(
                payload=BindSensorOutputRequestPayload(
                    sensor=SensorTypeField(sensor_info.sensor_type),
                    sensor_id=SensorIdField(sensor_info.sensor_id),
                    binding=SensorOutputBindingField(SensorOutputBinding.none),
                )
            ),
        )
    return result


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
    data_files: Optional[Dict[SensorId, str]] = None,
    sensor_id: SensorId = SensorId.S0,
) -> Dict[NodeId, MotorPositionStatus]:
    """Move the mount and pipette simultaneously while reading from the pressure sensor."""
    log_files: Dict[SensorId, str] = {} if not data_files else data_files
    sensor_driver = SensorDriver()
    threshold_fixed_point = threshold_pascals * sensor_fixed_point_conversion
    # How many samples to take to level out the sensor
    num_baseline_reads = 20
    pressure_sensors = await _setup_pressure_sensors(
        messenger,
        sensor_id,
        tool,
        num_baseline_reads,
        threshold_fixed_point,
        sensor_driver,
        True,
    )

    sensor_group = _build_pass_step(
        movers=[head_node, tool],
        distance={head_node: max_z_distance, tool: max_z_distance},
        speed={head_node: mount_speed, tool: plunger_speed},
        sensor_type=SensorType.pressure,
        sensor_id=sensor_id,
        stop_condition=MoveStopCondition.sync_line,
    )
    if sync_buffer_output:
        sensor_group = _fix_pass_step_for_buffer(
            sensor_group,
            movers=[head_node, tool],
            distance={head_node: max_z_distance, tool: max_z_distance},
            speed={head_node: mount_speed, tool: plunger_speed},
            sensor_type=SensorType.pressure,
            sensor_id=sensor_id,
            stop_condition=MoveStopCondition.sync_line,
        )

    raise_z_axis = create_step(
        distance={head_node: float64(-Z_SOLO_MOVE_DISTANCE)},
        velocity={head_node: float64(-mount_speed)},
        acceleration={},
        duration=float64(abs(-Z_SOLO_MOVE_DISTANCE) / (mount_speed)),
        present_nodes=[head_node],
    )

    lower_plunger = create_step(
        distance={tool: float64(PLUNGER_SOLO_MOVE_TIME * plunger_speed)},
        velocity={tool: float64(plunger_speed)},
        acceleration={},
        duration=float64(PLUNGER_SOLO_MOVE_TIME),
        present_nodes=[tool],
    )

    sensor_runner = MoveGroupRunner(
        move_groups=[[raise_z_axis], [lower_plunger], [sensor_group]]
    )
    if csv_output:
        return await run_stream_output_to_csv(
            messenger,
            pressure_sensors,
            mount_speed,
            plunger_speed,
            threshold_pascals,
            head_node,
            sensor_runner,
            log_files,
            pressure_output_file_heading,
        )
    elif sync_buffer_output:
        return await run_sync_buffer_to_csv(
            messenger,
            mount_speed,
            plunger_speed,
            threshold_pascals,
            head_node,
            sensor_runner,
            log_files,
            tool=tool,
            sensor_type=SensorType.pressure,
            output_file_heading=pressure_output_file_heading,
        )
    elif can_bus_only_output:
        binding = [SensorOutputBinding.sync, SensorOutputBinding.report]
        return await _run_with_binding(
            messenger, pressure_sensors, sensor_runner, binding
        )
    else:  # none
        binding = [SensorOutputBinding.sync]
        return await _run_with_binding(
            messenger, pressure_sensors, sensor_runner, binding
        )


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
    plunger_speed: float,
    mount_speed: float,
    sensor_id: SensorId = SensorId.S0,
    relative_threshold_pf: float = 1.0,
    csv_output: bool = False,
    sync_buffer_output: bool = False,
    can_bus_only_output: bool = False,
    data_files: Optional[Dict[SensorId, str]] = None,
) -> MotorPositionStatus:
    """Move the specified tool down until its capacitive sensor triggers.

    Moves down by the specified distance at the specified speed until the
    capacitive sensor triggers and returns the position afterward.

    The direction is sgn(distance)*sgn(speed), so you can set the direction
    either by negating speed or negating distance.
    """
    log_files: Dict[SensorId, str] = {} if not data_files else data_files
    sensor_driver = SensorDriver()
    capacitive_sensors = await _setup_capacitive_sensors(
        messenger,
        sensor_id,
        tool,
        relative_threshold_pf,
        sensor_driver,
    )

    sensor_group = _build_pass_step(
        movers=[mover, tool],
        distance={mover: distance, tool: 0.0},
        speed={mover: mount_speed, tool: 0.0},
        sensor_type=SensorType.capacitive,
        sensor_id=sensor_id,
        stop_condition=MoveStopCondition.sync_line,
    )
    if sync_buffer_output:
        sensor_group = _fix_pass_step_for_buffer(
            sensor_group,
            movers=[mover, tool],
            distance={mover: distance, tool: distance},
            speed={mover: mount_speed, tool: plunger_speed},
            sensor_type=SensorType.capacitive,
            sensor_id=sensor_id,
            stop_condition=MoveStopCondition.sync_line,
        )

    runner = MoveGroupRunner(move_groups=[[sensor_group]])
    if csv_output:
        positions = await run_stream_output_to_csv(
            messenger,
            capacitive_sensors,
            mount_speed,
            0.0,
            relative_threshold_pf,
            mover,
            runner,
            log_files,
            capacitive_output_file_heading,
        )
    elif sync_buffer_output:
        positions = await run_sync_buffer_to_csv(
            messenger,
            mount_speed,
            0.0,
            relative_threshold_pf,
            mover,
            runner,
            log_files,
            tool=tool,
            sensor_type=SensorType.capacitive,
            output_file_heading=capacitive_output_file_heading,
        )
    elif can_bus_only_output:
        binding = [SensorOutputBinding.sync, SensorOutputBinding.report]
        positions = await _run_with_binding(
            messenger, capacitive_sensors, runner, binding
        )
    else:
        binding = [SensorOutputBinding.sync]
        positions = await _run_with_binding(
            messenger, capacitive_sensors, runner, binding
        )
    return positions[mover]


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

    sensor_group = _build_pass_step(
        movers=[mover],
        distance={mover: distance},
        speed={mover: speed},
        sensor_type=SensorType.capacitive,
        sensor_id=sensor_id,
    )

    runner = MoveGroupRunner(move_groups=[[sensor_group]])
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

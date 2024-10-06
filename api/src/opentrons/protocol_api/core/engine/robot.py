from typing import Optional, Dict
from opentrons.hardware_control import SyncHardwareAPI

from opentrons.types import Mount, MountType, Point, AxisType, AxisMapType
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import DeckPoint, MotorAxis

from opentrons.protocol_api.core.robot import AbstractRobot

_AXIS_TYPE_TO_MOTOR_AXIS = {
    AxisType.X: MotorAxis.X,
    AxisType.Y: MotorAxis.Y,
    AxisType.P_L: MotorAxis.LEFT_PLUNGER,
    AxisType.P_R: MotorAxis.RIGHT_PLUNGER,
    AxisType.Z_L: MotorAxis.LEFT_Z,
    AxisType.Z_R: MotorAxis.RIGHT_Z,
    AxisType.Z_G: MotorAxis.EXTENSION_Z,
    AxisType.G: MotorAxis.EXTENSION_JAW,
    AxisType.Q: MotorAxis.CLAMP_JAW_96_CHANNEL,
}


class RobotCore(AbstractRobot):
    """Robot API core using a ProtocolEngine.

    Args:
        engine_client: A client to the ProtocolEngine that is executing the protocol.
        api_version: The Python Protocol API versionat which  this core is operating.
        sync_hardware: A SynchronousAdapter-wrapped Hardware Control API.
    """

    def __init__(
        self, engine_client: EngineClient, sync_hardware_api: SyncHardwareAPI
    ) -> None:
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api

    def _convert_to_engine_mount(self, axis_map: AxisMapType) -> Dict[MotorAxis, float]:
        return {_AXIS_TYPE_TO_MOTOR_AXIS[ax]: dist for ax, dist in axis_map.items()}

    def get_pipette_type_from_engine(self, mount: Mount) -> Optional[str]:
        """Get the pipette attached to the given mount."""
        engine_mount = MountType[mount.name]
        maybe_pipette = self._engine_client.state.pipettes.get_by_mount(engine_mount)
        return maybe_pipette.pipetteName if maybe_pipette else None

    def move_to(self, mount: Mount, destination: Point, speed: Optional[float]) -> None:
        engine_mount = MountType[mount.name]
        engine_destination = DeckPoint(
            x=destination.x, y=destination.y, z=destination.z
        )
        self._engine_client.execute_command(
            cmd.robot.MoveToParams(
                mount=engine_mount, destination=engine_destination, speed=speed
            )
        )

    def move_axes_to(
        self, axis_map: AxisMapType, critical_point: AxisMapType, speed: Optional[float]
    ) -> None:
        axis_engine_map = self._convert_to_engine_mount(axis_map)
        critical_point_engine = self._convert_to_engine_mount(critical_point)
        self._engine_client.execute_command(
            cmd.robot.MoveAxesToParams(
                axis_map=axis_engine_map,
                critical_point=critical_point_engine,
                speed=speed,
            )
        )

    def move_axes_relative(self, axis_map: AxisMapType, speed: Optional[float]) -> None:
        axis_engine_map = self._convert_to_engine_mount(axis_map)
        self._engine_client.execute_command(
            cmd.robot.MoveAxesRelativeParams(axis_map=axis_engine_map, speed=speed)
        )

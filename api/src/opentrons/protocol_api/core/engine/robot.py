from typing import Optional
from opentrons.hardware_control import SyncHardwareAPI

from opentrons.types import Mount, MountType, Point, AxisMapType
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import DeckPoint

from opentrons.protocol_api.core.robot import AbstractRobot


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

    def move_to(self, mount: Mount, destination: Point, speed: Optional[float]) -> None:
        engine_mount = MountType[mount.name]
        engine_destination = DeckPoint(*destination)
        self._engine_client.execute_command(
            cmd.robot.MoveToParams(mount=engine_mount, destination=engine_destination, speed=speed)
        )

    def move_axes_to(
        self, axis_map: AxisMapType, critical_point: AxisMapType, speed: Optional[float]
    ) -> None:
        self._engine_client.execute_command(
            cmd.robot.MoveAxesToParams(
                axis_map=axis_map, critical_point=critical_point, speed=speed
            )
        )

    def move_axes_relative(self, axis_map: AxisMapType, speed: Optional[float]) -> None:
        self._engine_client.execute_command(
            cmd.robot.MoveAxesRelativeParams(axis_map=axis_map, speed=speed)
        )

from abc import ABC, abstractmethod
from typing import Optional, List, Dict

from opentrons.types import Point, Mount

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    CriticalPoint,
    Axis as HardwareAxis,
)
from opentrons.hardware_control.errors import MustHomeError as HardwareMustHomeError

from opentrons.motion_planning import Waypoint

from ..state import StateStore
from ..types import MotorAxis
from ..errors import MustHomeError


MOTOR_AXIS_TO_HARDWARE_AXIS: Dict[MotorAxis, HardwareAxis] = {
    MotorAxis.X: HardwareAxis.X,
    MotorAxis.Y: HardwareAxis.Y,
    MotorAxis.LEFT_Z: HardwareAxis.Z,
    MotorAxis.RIGHT_Z: HardwareAxis.A,
    MotorAxis.LEFT_PLUNGER: HardwareAxis.B,
    MotorAxis.RIGHT_PLUNGER: HardwareAxis.C,
}


class AbstractGantryMovementHandler(ABC):
    @abstractmethod
    async def get_position(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint] = None,
        fail_on_not_homed: bool = False,
    ) -> Point:
        """Get the current position of the gantry."""
        ...

    @abstractmethod
    async def get_position_fail_not_homed(
        self, pipette_id: str, mount: Mount, critical_point: Optional[CriticalPoint]
    ) -> Point:
        """Get the current position of the gantry, raise error if not homed."""
        ...

    @abstractmethod
    def get_max_travel_z(self, pipette_id: str, mount: Mount) -> float:
        """Get the maximum allowed z-height for pipette movement."""
        ...

    @abstractmethod
    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        """Move the hardware gantry to a waypoint."""
        ...

    @abstractmethod
    async def move_relative(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint],
        delta: Point,
        speed: Optional[float],
    ) -> Point:
        """Move the hardware gantry in a relative direction by delta."""
        ...

    @abstractmethod
    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        """Home the gantry."""
        ...


class GantryMovementHandler(AbstractGantryMovementHandler):
    def __init__(self, hardware_api: HardwareControlAPI):
        self._hardware_api = hardware_api

    async def get_position(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint] = None,
        fail_on_not_homed: bool = False,
    ) -> Point:
        """Get the current position of the gantry.

        Args:
            pipette_id: Not used in hardware implementation.
            mount: Hardware mount to get position for.
            critical_point: Critical point to use.
            fail_on_not_homed: Raise HardwareMustHomeError if gantry position is not known.
        """
        return await self._hardware_api.gantry_position(
            mount=mount,
            critical_point=critical_point,
            fail_on_not_homed=fail_on_not_homed,
        )

    async def get_position_fail_not_homed(
        self, pipette_id: str, mount: Mount, critical_point: Optional[CriticalPoint]
    ) -> Point:
        """Get the current position of the gantry, raise error if not homed."""
        try:
            point = await self.get_position(
                pipette_id=pipette_id,
                mount=mount,
                critical_point=critical_point,
                fail_on_not_homed=True,
            )
        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        return point

    def get_max_travel_z(self, pipette_id: str, mount: Mount) -> float:
        """Get the maximum allowed z-height for pipette movement.

        Args:
            pipette_id: Not used in hardware implementation.
            mount: Hardware mount to get position for.
        """
        return self._hardware_api.get_instrument_max_height(mount=mount)

    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        """Move the hardware gantry to a waypoint."""
        await self._hardware_api.move_to(
            mount=mount,
            abs_position=waypoint.position,
            critical_point=waypoint.critical_point,
            speed=speed,
        )

    async def move_relative(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint],
        delta: Point,
        speed: Optional[float],
    ) -> Point:
        """Move the hardware gantry in a relative direction by delta.

        Args:
            pipette_id: Not used in hardware implementation.
            mount: Hardware mount to get position for.
            critical_point: Critical point to use.
            delta: Relative X/Y/Z distance to move gantry.
            speed: Optional speed parameter for the move.
        """
        try:
            await self._hardware_api.move_rel(
                mount=mount,
                delta=delta,
                fail_on_not_homed=True,
                speed=speed,
            )
            point = await self.get_position(
                pipette_id=pipette_id,
                mount=mount,
                critical_point=critical_point,
                fail_on_not_homed=True,
            )
        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        return point

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        """Home the gantry."""
        # TODO(mc, 2022-12-01): this is overly complicated
        # https://opentrons.atlassian.net/browse/RET-1287
        if axes is None:
            await self._hardware_api.home()
        elif axes == [MotorAxis.LEFT_PLUNGER]:
            await self._hardware_api.home_plunger(Mount.LEFT)
        elif axes == [MotorAxis.RIGHT_PLUNGER]:
            await self._hardware_api.home_plunger(Mount.RIGHT)
        elif axes == [MotorAxis.LEFT_Z, MotorAxis.LEFT_PLUNGER]:
            await self._hardware_api.home_z(Mount.LEFT)
            await self._hardware_api.home_plunger(Mount.LEFT)
        elif axes == [MotorAxis.RIGHT_Z, MotorAxis.RIGHT_PLUNGER]:
            await self._hardware_api.home_z(Mount.RIGHT)
            await self._hardware_api.home_plunger(Mount.RIGHT)
        else:
            hardware_axes = [MOTOR_AXIS_TO_HARDWARE_AXIS[a] for a in axes]
            await self._hardware_api.home(axes=hardware_axes)


class VirtualGantryMovementHandler(AbstractGantryMovementHandler):
    def __init__(self, state_store: StateStore):
        self._state_store = state_store

    async def get_position(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint] = None,
        fail_on_not_homed: bool = False,
    ) -> Point:
        """Get the current position of the gantry.

        Args:
            pipette_id: Pipette ID to get position of.
            mount: Not used in virtual implementation.
            critical_point: Not used in virtual implementation.
            fail_on_not_homed: Not used in virtual implementation.
        """
        origin_deck_point = self._state_store.pipettes.get_deck_point(pipette_id)
        if origin_deck_point is not None:
            origin = Point(
                x=origin_deck_point.x, y=origin_deck_point.y, z=origin_deck_point.z
            )
        else:
            origin = Point(x=0, y=0, z=0)
        return origin

    async def get_position_fail_not_homed(
        self, pipette_id: str, mount: Mount, critical_point: Optional[CriticalPoint]
    ) -> Point:
        """Get the current position of the gantry. This will not raise in the virtual implementation."""
        return await self.get_position(pipette_id, mount)

    def get_max_travel_z(self, pipette_id: str, mount: Mount) -> float:
        """Get the maximum allowed z-height for pipette movement.

        Args:
            pipette_id: Pipette ID to get instrument height and tip length for.
            mount: Not used in virtual implementation.
        """
        instrument_height = self._state_store.pipettes.get_instrument_max_height(
            pipette_id
        )
        tip_length = self._state_store.tips.get_tip_length(pipette_id)
        return instrument_height - tip_length

    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        """Move the hardware gantry to a waypoint. No-op in virtual implementation."""
        pass

    async def move_relative(
        self,
        pipette_id: str,
        mount: Mount,
        critical_point: Optional[CriticalPoint],
        delta: Point,
        speed: Optional[float],
    ) -> Point:
        """Move the hardware gantry in a relative direction by delta.

        Args:
            pipette_id: Pipette ID to get position of for virtual move.
            mount: Hardware mount to get position for.
            critical_point: Not used in virtual implementation.
            delta: Relative X/Y/Z distance to move gantry.
            speed: Not used in virtual implementation.
        """
        origin = await self.get_position(pipette_id, mount)
        return origin + delta

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        """Home the gantry. No-op in virtual implementation."""
        pass

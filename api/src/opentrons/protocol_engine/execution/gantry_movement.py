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

from ..state import StateStore, CurrentWell
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
    async def get_origin_point(
        self, pipette_id: str, current_well: Optional[CurrentWell] = None
    ) -> Point:
        ...

    @abstractmethod
    def get_max_travel_z(self, pipette_id: str) -> float:
        ...

    @abstractmethod
    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        ...

    @abstractmethod
    async def move_relative(
        self, pipette_id: str, delta: Point, speed: Optional[float]
    ) -> Point:
        ...

    @abstractmethod
    async def save_position(self, pipette_id: str) -> Point:
        ...

    @abstractmethod
    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        ...


class GantryMovementHandler(AbstractGantryMovementHandler):
    def __init__(self, state_store: StateStore, hardware_api: HardwareControlAPI):
        self._state_store = state_store
        self._hardware_api = hardware_api

    async def get_origin_point(
        self, pipette_id: str, current_well: Optional[CurrentWell] = None
    ) -> Point:
        # get the pipette's mount and current critical point, if applicable
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
            current_well=current_well,
        )
        hw_mount = pipette_location.mount.to_hw_mount()
        origin_cp = pipette_location.critical_point

        origin = await self._hardware_api.gantry_position(
            mount=hw_mount,
            critical_point=origin_cp,
        )

        return origin

    def get_max_travel_z(self, pipette_id: str) -> float:
        mount = self._state_store.pipettes.get(pipette_id).mount
        return self._hardware_api.get_instrument_max_height(mount=mount.to_hw_mount())

    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        await self._hardware_api.move_to(
            mount=mount,
            abs_position=waypoint.position,
            critical_point=waypoint.critical_point,
            speed=speed,
        )

    async def move_relative(
        self, pipette_id: str, delta: Point, speed: Optional[float]
    ) -> Point:
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
        )
        pip_cp = pipette_location.critical_point
        hw_mount = pipette_location.mount.to_hw_mount()

        try:
            await self._hardware_api.move_rel(
                mount=hw_mount,
                delta=delta,
                fail_on_not_homed=True,
                speed=speed,
            )
            point = await self._hardware_api.gantry_position(
                mount=hw_mount,
                critical_point=pip_cp,
                fail_on_not_homed=True,
            )
        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        return point

    async def save_position(self, pipette_id: str) -> Point:
        pipette_location = self._state_store.motion.get_pipette_location(
            pipette_id=pipette_id,
        )

        hw_mount = pipette_location.mount.to_hw_mount()
        pip_cp = pipette_location.critical_point
        if pip_cp is None:
            hw_pipette = self._state_store.pipettes.get_hardware_pipette(
                pipette_id=pipette_id,
                attached_pipettes=self._hardware_api.attached_instruments,
            )
            if hw_pipette.config.get("tip_length"):
                pip_cp = CriticalPoint.TIP
            else:
                pip_cp = CriticalPoint.NOZZLE

        try:
            point = await self._hardware_api.gantry_position(
                mount=hw_mount,
                critical_point=pip_cp,
                fail_on_not_homed=True,
            )
        except HardwareMustHomeError as e:
            raise MustHomeError(str(e)) from e

        return point

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
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

    async def get_origin_point(
        self, pipette_id: str, current_well: Optional[CurrentWell] = None
    ) -> Point:
        origin_deck_point = self._state_store.pipettes.get_deck_point(pipette_id)
        if origin_deck_point is not None:
            origin = Point(
                x=origin_deck_point.x, y=origin_deck_point.y, z=origin_deck_point.z
            )
        else:
            origin = Point(x=0, y=0, z=0)
        return origin

    def get_max_travel_z(self, pipette_id: str) -> float:
        instrument_height = self._state_store.pipettes.get_instrument_max_height(
            pipette_id
        )
        tip_length = self._state_store.tips.get_tip_length(pipette_id)
        return instrument_height - tip_length

    async def move_to(
        self, mount: Mount, waypoint: Waypoint, speed: Optional[float]
    ) -> None:
        pass

    async def move_relative(
        self, pipette_id: str, delta: Point, speed: Optional[float]
    ) -> Point:
        origin = await self.get_origin_point(pipette_id)
        return origin + delta

    async def save_position(self, pipette_id: str) -> Point:
        # TODO is this all we need?
        return await self.get_origin_point(pipette_id)

    async def home(self, axes: Optional[List[MotorAxis]]) -> None:
        pass

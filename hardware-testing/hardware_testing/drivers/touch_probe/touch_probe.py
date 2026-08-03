"""Calibrate Labware."""
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point
from opentrons.hardware_control.ot3api import OT3API
from typing import Optional, Tuple
from hardware_testing.drivers.touch_probe.dimensions import LabwareDims
from dataclasses import dataclass

# ============================================================================
# Configuration
# ============================================================================


@dataclass
class ProbeConfig:
    """Global configuration for touch probe operations."""

    safe_z: float = 150.0
    probe_speed: float = 4.0
    edge_offset: float = 6.0  # how far inside the SLOT we start
    bound_offset: float = 5.0  # mm from edge of slot to consider as deck boundary
    xy_debounce_offset: float = 3.0  # mm to back off in X or Y
    shank_height: float = 22.0
    ball_radius: float = 1.0


# ============================================================================
# Calibration Functions
# ============================================================================


class TouchProbe:
    """Basic functions to use the probe."""

    def __init__(self, api: OT3API, mount: OT3Mount, config: ProbeConfig) -> None:
        """Touch probe properties."""
        self.api = api
        self.mount = mount
        self.config = config

    async def touch_probe(self, axis: Axis, speed: float, distance: float) -> Point:
        """Perform a touch probe and return the contact point adjusted for the ball radius."""
        probe_point = await self.api.touch_probe(self.mount, axis, speed, distance)

        # Determine adjustment based on axis and movement direction
        adjustment = (
            -self.config.ball_radius if distance > 0 else self.config.ball_radius
        )

        if axis == Axis.X:
            probe_point = probe_point._replace(x=probe_point.x + adjustment)
        elif axis == Axis.Y:
            probe_point = probe_point._replace(y=probe_point.y + adjustment)
        elif axis == Axis.Z:
            probe_point = probe_point._replace(
                z=probe_point.z
            )  # removed adjustment in Z
        else:
            raise ValueError(f"Unsupported axis: {axis}")

        return probe_point

    async def get_pos(self, refresh: bool = False) -> Point:
        """Return the current position as a Point."""
        current_position = await self.api.current_position_ot3(
            mount=self.mount,
            critical_point=None,
            refresh=refresh,
        )
        return Point(
            x=current_position[Axis.X],
            y=current_position[Axis.Y],
            z=current_position[Axis.Z],
        )

    async def get_deck_z(self, slot: int) -> Point:
        """Probe and return the deck Z contact point."""
        deck_square_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
        probe_deck_safe_z = 100.0

        # Move above probe point
        await self.api.move_to(
            self.mount, deck_square_pos._replace(y=deck_square_pos.y + 25, z=250)
        )
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=probe_deck_safe_z))

        try:
            measured_deck_pos = await self.touch_probe(
                axis=Axis.Z,
                speed=3.33,
                distance=probe_deck_safe_z,
            )
        except Exception:
            await self.api.move_to(
                self.mount, current_pos._replace(z=self.config.safe_z)
            )
            raise RuntimeError("Failed to detect deck surface")

        await self.api.move_to(self.mount, current_pos._replace(z=self.config.safe_z))
        return deck_square_pos._replace(z=measured_deck_pos.z)

    async def search_hole(
        self,
        start_point: Point,
    ) -> bool:
        """Search for a hole at the given probe point by probing down from the surface."""
        await self.api.move_to(self.mount, start_point._replace(z=self.config.safe_z))
        await self.api.move_to(self.mount, start_point._replace(z=start_point.z + 5.0))
        try:
            await self.touch_probe(
                axis=Axis.Z, speed=self.config.probe_speed, distance=5.0
            )
            await self.api.move_to(
                self.mount, start_point._replace(z=self.config.safe_z)
            )
            return False
        except Exception:
            return True

    async def search_hole_center(
        self, start_point: Point
    ) -> Optional[Tuple[Point, float]]:
        """Search for hole center and compute a representative radius. Start point should be the position after search_hole, i.e just above the hole."""
        max_radius = 127
        start_point = start_point._replace(
            z=start_point.z - 1.0
        )  # go a bit lower to hit the walls

        try:
            # X probe
            await self.api.move_to(self.mount, start_point)
            x_left = await self.touch_probe(
                axis=Axis.X, speed=self.config.probe_speed, distance=max_radius
            )
            await self.api.move_to(self.mount, start_point)
            x_right = await self.touch_probe(
                axis=Axis.X, speed=self.config.probe_speed, distance=-max_radius
            )

            # Y probe
            await self.api.move_to(self.mount, start_point)
            y_up = await self.touch_probe(
                axis=Axis.Y, speed=self.config.probe_speed, distance=-max_radius
            )
            await self.api.move_to(self.mount, start_point)
            y_down = await self.touch_probe(
                axis=Axis.Y, speed=self.config.probe_speed, distance=max_radius
            )

        except Exception as e:
            print(f"Failed to detect hole edges: {e}")
            return None

        center_x = (x_left.x + x_right.x) / 2
        center_y = (y_up.y + y_down.y) / 2
        center = Point(
            x=center_x, y=center_y, z=start_point.z + 1.0
        )  # recorrect for the 1mm z offset from the beginning

        radius_x = abs(x_right.x - x_left.x) / 2
        radius_y = abs(y_up.y - y_down.y) / 2
        radius = min(radius_x, radius_y)

        if abs(radius_x - radius_y) > 1:
            radius = radius_x
        else:
            radius = min(radius_x, radius_y)

        await self.api.move_to(self.mount, center)
        await asyncio.sleep(0.5)
        center_and_radius = center, radius
        return center_and_radius

    async def get_bottom(self, well_center: Point) -> Optional[Point]:
        """Probe the bottom of a well starting from its XY center."""
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=self.config.safe_z))
        await self.api.move_to(self.mount, well_center._replace(z=self.config.safe_z))
        await self.api.move_to(self.mount, well_center)

        try:
            bottom = await self.touch_probe(
                axis=Axis.Z,
                speed=self.config.probe_speed,
                distance=self.config.shank_height,
            )
        except Exception:
            return None

        await self.api.move_to(self.mount, well_center._replace(z=self.config.safe_z))
        return bottom

    async def search_hole_and_center(
        self, start_point: Point
    ) -> Optional[Tuple[Point, float]]:
        """# look for deck square hole. If hole, then get the center."""
        if await self.search_hole(start_point):
            current_pos = await self.get_pos(refresh=True)
            center_and_radius = await self.search_hole_center(current_pos)
            if center_and_radius:
                center, radius = center_and_radius
                print(f"Deck hole center: {center}, radius: {radius:.3f} mm")
        return center_and_radius

    async def calibrate_labware(
        self,
        slot: int,
        deck_pos: Point,
    ) -> Optional[LabwareDims]:
        """Probe Z, X, and Y bounds of labware in a given slot using absolute coordinates."""
        top_left = helpers_ot3.get_slot_top_left_position_ot3(slot)
        slot_size = helpers_ot3.get_slot_size()
        slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(slot)

        # Slot boundaries with offsets
        deck_bound_left = top_left.x - self.config.bound_offset
        deck_bound_right = top_left.x + slot_size.x + self.config.bound_offset
        deck_bound_up = top_left.y + self.config.bound_offset
        deck_bound_down = top_left.y - slot_size.y - self.config.bound_offset

        # Move to safe Z before probing
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=self.config.safe_z))

        # Z probe to get top of labware
        z_probe_pos = Point(
            x=top_left.x + self.config.edge_offset,
            y=slot_center.y,
            z=self.config.safe_z,
        )
        await self.api.move_to(self.mount, z_probe_pos)
        print(f"Probing for top surface (Z) at {z_probe_pos}")

        try:
            z_max = await self.touch_probe(
                axis=Axis.Z,
                speed=self.config.probe_speed,
                distance=self.config.safe_z,
            )
        except Exception:
            print("Failed to detect Z surface")
            return None

        print(f"Top surface detected at Z = {z_max.z} mm")
        print(f"Height before correction = {z_max.z - deck_pos.z} mm")

        # Safe Z for XY probes
        safe_z_labware = z_max.z + 10.0

        # Compute XY probe height based on labware height vs shank length
        labware_height = z_max.z - deck_pos.z
        if labware_height < self.config.shank_height:
            xy_probe_z = deck_pos.z + 3.0  # probe near bottom for short labware
            print(
                f"Labware is short ({labware_height:.2f} mm), probing XY near bottom at {xy_probe_z:.2f} mm"
            )
        else:
            xy_probe_z = z_max.z - 2.0  # probe near top for tall labware
            print(
                f"Labware is tall ({labware_height:.2f} mm), probing XY near top at {xy_probe_z:.2f} mm"
            )

        # XY probe positions
        x_min_probe_pos = Point(deck_bound_left, slot_center.y, xy_probe_z)
        x_max_probe_pos = Point(deck_bound_right, slot_center.y, xy_probe_z)
        y_max_probe_pos = Point(slot_center.x, deck_bound_up, xy_probe_z)
        y_min_probe_pos = Point(slot_center.x, deck_bound_down, xy_probe_z)

        move_list = [
            (x_min_probe_pos, Axis.X, -1),
            (x_max_probe_pos, Axis.X, +1),
            (y_max_probe_pos, Axis.Y, +1),
            (y_min_probe_pos, Axis.Y, -1),
        ]

        # Probe XY edges
        for move_point, probe_axis, release_dir in move_list:
            await self.api.move_to(
                self.mount, Point(x=move_point.x, y=move_point.y, z=safe_z_labware)
            )
            await self.api.move_to(self.mount, move_point)  # move to probe height

            probe_loc = await self.touch_probe(
                axis=probe_axis,
                speed=self.config.probe_speed,
                distance=25 * release_dir,
            )
            if probe_loc is None:
                raise RuntimeError(f"Failed to detect {probe_axis.name} edge")

            # Store probe results
            if probe_axis == Axis.X:
                if release_dir < 0:
                    x_min = probe_loc
                else:
                    x_max = probe_loc
            else:  # Axis.Y
                if release_dir > 0:
                    y_max = probe_loc
                else:
                    y_min = probe_loc

            # Debounce move
            if probe_axis == Axis.X:
                release_pos = Point(
                    x=move_point.x + self.config.xy_debounce_offset * release_dir,
                    y=move_point.y,
                    z=safe_z_labware,
                )
            else:
                release_pos = Point(
                    x=move_point.x,
                    y=move_point.y + self.config.xy_debounce_offset * release_dir,
                    z=safe_z_labware,
                )
            await self.api.move_to(self.mount, release_pos)
            print(
                f"{probe_axis.name} surface detected at {probe_loc.x if probe_axis == Axis.X else probe_loc.y:.3f} mm"
            )

        # Return to safe Z
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=self.config.safe_z))

        if None in (x_min, x_max, y_min, y_max):
            print("Failed to collect all XY probe results")
            return None

        return LabwareDims(
            deck_pos=deck_pos,
            z_max=z_max,
            x_min=x_min,
            x_max=x_max,
            y_max=y_max,
            y_min=y_min,
            well_bottom=None,
            num_wells=None,
            radius=None,
        )

    # this assumes you call this function RIGHT AFTER you call search_hole_center
    async def get_brim_height(
        self, well_center: Point, radius: float
    ) -> Optional[float]:
        """Gets the height of the lip of a well, given the well center and well radius."""
        # move to safe height above center
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=self.config.safe_z))
        # Choose a point (brim_xy) slightly outside the left well edge
        left_well_edge = well_center.x - radius
        brim_xy = well_center._replace(x=left_well_edge - 0.5, z=self.config.safe_z)
        await self.api.move_to(self.mount, brim_xy)
        await self.api.move_to(self.mount, brim_xy._replace(z=well_center.z + 10))
        try:
            brim_point = await self.touch_probe(
                axis=Axis.Z, speed=self.config.probe_speed, distance=10
            )
            # compensate for ball radius on Z probe place holder
            try:
                brim_point = brim_point._replace(z=brim_point.z)
            except Exception:
                pass
            if abs(brim_point.z - well_center.z) > 0.25:
                print(f"located well brim height at {brim_point.z}")
                print(f"brim height: {brim_point.z - well_center.z}")
            else:
                brim_point = brim_point._replace(z=well_center.z)
                print("no brim detected.")
            await self.api.move_to(self.mount, brim_xy)
            return brim_point.z
        except Exception:
            print("failed to locate brim location")
            return None

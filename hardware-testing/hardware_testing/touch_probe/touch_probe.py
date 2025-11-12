"""Calibrate Labware."""
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from opentrons.hardware_control.ot3api import OT3API
from typing import Optional, Tuple
from hardware_testing.touch_probe.dimensions import ProbeConfig, LabwareDims

# ============================================================================
# Calibration Functions
# ============================================================================


class TouchProbe:
    def __init__(self, api: OT3API, mount: OT3Mount):
        self.api = api
        self.mount = mount

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

    async def get_deck_z(self, slot: int, config: ProbeConfig) -> Point:
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
            measured_deck_pos = await self.api.touch_probe(
                self.mount,
                axis=Axis.Z,
                speed=3.33,
                distance=probe_deck_safe_z,
            )
        except Exception:
            await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))
            raise RuntimeError("Failed to detect deck surface")

        await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))
        return deck_square_pos._replace(z=measured_deck_pos.z)

    async def search_hole(
        self,
        start_point: Point,
        config: ProbeConfig,
    ) -> bool:
        """Search for a hole at the given probe point by probing down from the surface."""
        await self.api.move_to(self.mount, start_point._replace(z=config.safe_z))
        await self.api.move_to(self.mount, start_point._replace(z=start_point.z + 5.0))
        try:
            await self.api.touch_probe(
                self.mount,
                axis=Axis.Z,
                speed=config.probe_speed,
                distance=5.0,
            )
            await self.api.move_to(self.mount, start_point._replace(z=config.safe_z))
            return False
        except Exception:
            return True

    async def search_hole_center(
        self, start_point: Point, config: ProbeConfig
    ) -> Optional[Tuple[Point, float]]:
        """Search for hole center and compute a representative radius."""
        max_radius = 127
        probe_depth = start_point.z - 1
        start_point = start_point._replace(z=probe_depth)

        try:
            # X probe
            await self.api.move_to(self.mount, start_point)
            x_left = await self.api.touch_probe(
                self.mount, axis=Axis.X, speed=config.probe_speed, distance=max_radius
            )
            await self.api.move_to(self.mount, start_point)
            x_right = await self.api.touch_probe(
                self.mount, axis=Axis.X, speed=config.probe_speed, distance=-max_radius
            )

            # Y probe
            await self.api.move_to(self.mount, start_point)
            y_up = await self.api.touch_probe(
                self.mount, axis=Axis.Y, speed=config.probe_speed, distance=-max_radius
            )
            await self.api.move_to(self.mount, start_point)
            y_down = await self.api.touch_probe(
                self.mount, axis=Axis.Y, speed=config.probe_speed, distance=max_radius
            )

        except Exception as e:
            print(f"Failed to detect hole edges: {e}")
            return None

        center_x = (x_left.x + x_right.x) / 2
        center_y = (y_up.y + y_down.y) / 2
        center = Point(x=center_x, y=center_y, z=start_point.z + 1.0)

        radius_x = abs(x_right.x - x_left.x) / 2 + config.ball_radius
        radius_y = abs(y_up.y - y_down.y) / 2 + config.ball_radius
        radius = min(radius_x, radius_y)

        if abs(radius_x - radius_y) > 1:
            radius = radius_x
        else:
            radius = min(radius_x, radius_y)

        await self.api.move_to(self.mount, center)
        await asyncio.sleep(0.5)
        center_and_radius = center, radius
        return center_and_radius

    async def get_bottom(
        self, well_center: Point, config: ProbeConfig
    ) -> Optional[Point]:
        """Probe the bottom of a well starting from its XY center."""
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))
        await self.api.move_to(self.mount, well_center._replace(z=config.safe_z))
        await self.api.move_to(self.mount, well_center)

        try:
            bottom = await self.api.touch_probe(
                self.mount,
                axis=Axis.Z,
                speed=config.probe_speed,
                distance=config.shank_height,
            )
        except Exception:
            return None

        await self.api.move_to(self.mount, well_center._replace(z=config.safe_z))
        return bottom

    async def search_hole_and_center(
        self, start_point: Point, config: ProbeConfig
    ) -> Optional[Tuple[Point, float]]:
        """# look for deck square hole. If hole, then get the center"""
        if await self.search_hole(start_point, config):
            current_pos = await self.get_pos(refresh=True)
            center_and_radius = await self.search_hole_center(current_pos, config)
            if center_and_radius:
                center, radius = center_and_radius
                print(f"Deck hole center: {center}, radius: {radius:.3f} mm")
        return center_and_radius

    async def calibrate_labware(
        self,
        slot: int,
        deck_pos: Point,
        config: ProbeConfig,
    ) -> Optional[LabwareDims]:
        """Probe Z, X, and Y bounds of labware in a given slot using absolute coordinates."""
        top_left = helpers_ot3.get_slot_top_left_position_ot3(slot)
        slot_size = helpers_ot3.get_slot_size()
        slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(slot)

        # Slot boundaries with offsets
        deck_bound_left = top_left.x - config.bound_offset
        deck_bound_right = top_left.x + slot_size.x + config.bound_offset
        deck_bound_up = top_left.y + config.bound_offset
        deck_bound_down = top_left.y - slot_size.y - config.bound_offset

        # Move to safe Z before probing
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))

        # Z probe to get top of labware
        z_probe_pos = Point(
            x=top_left.x + config.edge_offset, y=slot_center.y, z=config.safe_z
        )
        await self.api.move_to(self.mount, z_probe_pos)
        print(f"Probing for top surface (Z) at {z_probe_pos}")

        try:
            z_max = await self.api.touch_probe(
                self.mount,
                axis=Axis.Z,
                speed=config.probe_speed,
                distance=config.safe_z,
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
        if labware_height < config.shank_height:
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

            probe_loc = await self.api.touch_probe(
                self.mount,
                axis=probe_axis,
                speed=config.probe_speed,
                distance=25 * release_dir,
            )
            if probe_loc is None:
                raise RuntimeError(f"Failed to detect {probe_axis.name} edge")

            # TODO:
            # Apply ball radius compensation. This really needs to be figured out.
            if probe_axis == Axis.X:
                if release_dir > 0:
                    probe_loc = probe_loc._replace(x=probe_loc.x - config.ball_radius)
                else:
                    probe_loc = probe_loc._replace(x=probe_loc.x)
            else:  # Axis.Y
                if release_dir > 0:
                    probe_loc = probe_loc._replace(y=probe_loc.y - config.ball_radius)
                else:
                    probe_loc = probe_loc._replace(y=probe_loc.y)

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
                    x=move_point.x + config.xy_debounce_offset * release_dir,
                    y=move_point.y,
                    z=safe_z_labware,
                )
            else:
                release_pos = Point(
                    x=move_point.x,
                    y=move_point.y + config.xy_debounce_offset * release_dir,
                    z=safe_z_labware,
                )
            await self.api.move_to(self.mount, release_pos)
            print(
                f"{probe_axis.name} surface detected at {probe_loc.x if probe_axis==Axis.X else probe_loc.y:.3f} mm"
            )

        # Return to safe Z
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))

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
        self, well_center: Point, radius: float, config: ProbeConfig
    ) -> Optional[float]:
        """Gets the height of the lip of a well, given the well center and well radius."""
        # move to safe height above center
        current_pos = await self.get_pos()
        await self.api.move_to(self.mount, current_pos._replace(z=config.safe_z))
        # Choose a point (brim_xy) slightly outside the left well edge
        left_well_edge = well_center.x - radius
        brim_xy = well_center._replace(x=left_well_edge - 0.5, z=config.safe_z)
        await self.api.move_to(self.mount, brim_xy)
        await self.api.move_to(self.mount, brim_xy._replace(z=well_center.z + 10))
        try:
            brim_point = await self.api.touch_probe(
                self.mount, axis=Axis.Z, speed=config.probe_speed, distance=10
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

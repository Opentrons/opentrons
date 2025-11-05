"""Touch Probe Script for OT-3"""
import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import CriticalPoint
from typing import Tuple, Union, Optional
from dataclasses import dataclass, field


# ============================================================================
# Configuration
# ============================================================================


@dataclass
class ProbeConfig:
    """Global configuration for touch probe operations."""

    safe_z: float = 150.0
    probe_deck_safe_z: float = 100.0
    probe_speed: float = 5.0
    edge_offset: float = 6.0  # how far inside the SLOT we start
    bound_offset: float = 5.0  # mm from edge of slot to consider as deck boundary
    xy_debounce_offset: float = 3.0  # mm to back off in X or Y
    shank_height: float = 22.0
    ball_radius: float = 0.75


# ============================================================================
# Dimensions Data Structure
# ============================================================================


@dataclass
class Dimensions:
    """Container for probe results with computed properties."""

    z_deck: Point
    z_max: Point
    z_min: Optional[Point]
    x_min: Point
    x_max: Point
    y_max: Point
    y_min: Point

    @property
    def width(self) -> float:
        """Width of the probed area (X dimension)."""
        return abs(self.x_max.x - self.x_min.x)

    @property
    def length(self) -> float:
        """Length of the probed area (Y dimension)."""
        return abs(self.y_max.y - self.y_min.y)

    @property
    def height(self) -> float:
        """Height of the probed area (Z dimension from deck to top)."""
        return self.z_max.z - self.z_deck.z

    @property
    def depth(self) -> Optional[float]:
        """Height of the hole depth (Z dimension from top to hole bottom)."""
        if self.z_min is None:
            return None
        return self.z_max.z - self.z_min.z

    @property
    def bottom_offset(self) -> Optional[float]:
        """Height of the bottom offset (Z dimension from hole bottom to deck)."""
        if self.z_min is None:
            return None
        return self.z_min.z - self.z_deck.z


# ============================================================================
# Probe Functions
# ============================================================================


async def get_deck_z(
    api: OT3API, mount: OT3Mount, probe_point: Point, config: ProbeConfig
) -> Point:
    """Probe Deck Z position."""
    # Move above probe point
    await api.move_to(mount, Point(x=probe_point.x, y=probe_point.y + 17.5, z=250))
    current_pos = await api.current_position_ot3(mount)
    # Move to safe Z for probing
    await api.move_to(
        mount,
        Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=config.probe_deck_safe_z),
    )

    # Perform Z touch probe
    z_deck_pos = await api.touch_probe(
        mount, axis=Axis.Z, speed=config.probe_speed, distance=config.probe_deck_safe_z
    )
    if z_deck_pos is None:
        # Move back to safe Z before raising error
        await api.move_to(
            mount,
            Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=config.safe_z),
        )
        raise RuntimeError("Failed to detect deck surface")

    # Compensate for ball radius if needed (currently placeholder)
    z_deck_pos = z_deck_pos._replace(z=z_deck_pos.z)

    return z_deck_pos


async def calibrate_labware_simple(
    api: OT3API, mount: OT3Mount, slot: int, z_deck_pos: Point, config: ProbeConfig
) -> Optional[Dimensions]:
    """Probe Z, X, and Y bounds of labware in a given SLOT using absolute coordinates."""
    top_left = helpers_ot3.get_slot_top_left_position_ot3(slot)
    slot_size = helpers_ot3.get_slot_size()
    slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(slot)

    # Slot boundaries with offsets
    deck_bound_left = top_left.x - config.bound_offset
    deck_bound_right = top_left.x + slot_size.x + config.bound_offset
    deck_bound_up = top_left.y + config.bound_offset
    deck_bound_down = top_left.y - slot_size.y - config.bound_offset

    # Move to safe Z before probing
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=config.safe_z)
    )

    # Z probe to get top of labware
    z_probe_pos = Point(
        x=top_left.x + config.edge_offset, y=slot_center.y, z=config.safe_z
    )
    await api.move_to(mount, z_probe_pos)
    print(f"Probing for top surface (Z) at {z_probe_pos}")

    try:
        z_max = await api.touch_probe(
            mount, axis=Axis.Z, speed=config.probe_speed, distance=config.safe_z
        )
    except Exception:
        print("Failed to detect Z surface")
        return None

    print(f"Top surface detected at Z = {z_max.z} mm")
    print(f"Height before correction = {z_max.z - z_deck_pos.z} mm")

    # Safe Z for XY probes
    z_safe = z_max.z + 10.0
    config.safe_z = z_safe

    # ------------------------------------------------------------------------
    # Compute XY probe height based on labware height vs shank length
    # ------------------------------------------------------------------------
    labware_height = z_max.z - z_deck_pos.z
    if labware_height < config.shank_height:
        xy_probe_z = z_deck_pos.z + 3.0  # probe near bottom for short labware
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
        await api.move_to(mount, Point(x=move_point.x, y=move_point.y, z=z_safe))
        await api.move_to(mount, move_point)  # move to probe height

        probe_loc = await api.touch_probe(
            mount, axis=probe_axis, speed=config.probe_speed, distance=25 * release_dir
        )
        if probe_loc is None:
            raise RuntimeError(f"Failed to detect {probe_axis.name} edge")

        # Apply ball radius compensation
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
                z=z_safe,
            )
        else:
            release_pos = Point(
                x=move_point.x,
                y=move_point.y + config.xy_debounce_offset * release_dir,
                z=z_safe,
            )
        await api.move_to(mount, release_pos)
        print(
            f"{probe_axis.name} surface detected at {probe_loc.x if probe_axis==Axis.X else probe_loc.y:.3f} mm"
        )

    # Return to safe Z
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=config.safe_z)
    )

    if None in (x_min, x_max, y_min, y_max):
        print("Failed to collect all XY probe results")
        return None

    return Dimensions(
        z_deck=z_deck_pos,
        z_max=z_max,
        z_min=None,
        x_min=x_min,
        x_max=x_max,
        y_max=y_max,
        y_min=y_min,
    )


async def search_hole(
    api: OT3API,
    mount: OT3Mount,
    probe_point: Point,
    z_surface: float,
    config: ProbeConfig,
) -> bool:
    """Search for a hole at the given probe point by probing down from the surface.

    Args:
        api: OT3API instance
        mount: Mount to use for probing
        probe_point: XY position to probe at (Z will be set to safe_z)
        z_surface: Z height of the surface to probe from
        config: Probe configuration

    Returns:
        True if a hole is detected (probe didn't trigger), False otherwise
    """
    # Move to probe point at safe Z
    start_point = probe_point._replace(z=config.safe_z)
    await api.move_to(mount, start_point)

    # Move to position above surface
    z_target = z_surface + 5.0
    await api.move_to(mount, Point(x=start_point.x, y=start_point.y, z=z_target))

    # Attempt a Z probe to check for the presence of a hole.
    # Note: touch_probe raises an exception when it doesn't trigger (i.e., when it finds a hole)
    try:
        await api.touch_probe(
            mount,
            axis=Axis.Z,
            speed=config.probe_speed,
            distance=(z_target - z_surface),
        )
        # Probe triggered (hit surface), meaning no hole found
        print("No hole detected during Z probe.")
        await api.move_to(mount, start_point)  # return to safe
        return False
    except Exception:
        # Exception raised: probe didn't trigger (found a hole)
        # This is the expected behavior when a hole is present
        print("Hole detected.")
        return True


async def search_hole_center(
    api: OT3API, mount: OT3Mount, start_point: Point, config: ProbeConfig
) -> Optional[Tuple[Point, float]]:
    """Search for hole center and compute true well radius."""
    max_radius = 127
    probe_depth = start_point.z - 1
    start_point = start_point._replace(z=probe_depth)

    try:
        # X Probe
        await api.move_to(mount, start_point)
        x_left = await api.touch_probe(
            mount, axis=Axis.X, speed=config.probe_speed, distance=max_radius
        )
        await api.move_to(mount, start_point)
        x_right = await api.touch_probe(
            mount, axis=Axis.X, speed=config.probe_speed, distance=-max_radius
        )
        # Y Probe
        await api.move_to(mount, start_point)
        y_up = await api.touch_probe(
            mount, axis=Axis.Y, speed=config.probe_speed, distance=-max_radius
        )
        await api.move_to(mount, start_point)
        y_down = await api.touch_probe(
            mount, axis=Axis.Y, speed=config.probe_speed, distance=max_radius
        )

    except Exception as e:
        print(f"Failed to detect hole edges: {e}")
        return None

    print(
        f"x_left: {x_left.x}, x_right: {x_right.x}, y_up: {y_up.y}, y_down: {y_down.y}"
    )

    center_x = (x_left.x + x_right.x) / 2
    center_y = (y_up.y + y_down.y) / 2
    center = Point(x=center_x, y=center_y, z=start_point.z + 1.0)

    radius_x = abs(x_right.x - x_left.x) / 2 + config.ball_radius
    radius_y = abs(y_up.y - y_down.y) / 2 + config.ball_radius
    radius = min(radius_x, radius_y)

    # Select the representative radius
    if abs(radius_x - radius_y) > 1:
        radius = radius_x
    else:
        radius = min(radius_x, radius_y)

    await api.move_to(mount, center)

    print(
        f"Center found at: {center} | "
        f"radius_x: {radius_x:.3f} mm, radius_y: {radius_y:.3f} mm, "
        f"true radius: {radius:.3f} mm"
    )
    await api.move_to(mount, center)
    await asyncio.sleep(0.5)
    return center, radius


async def get_brim_height(
    api: OT3API, mount: OT3Mount, well_center: Point, radius: float, config: ProbeConfig
) -> Optional[float]:
    # move to safe height above center
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=config.safe_z)
    )
    # go to well rim minus a small offset
    start_point = well_center._replace(x=well_center.x - radius - 0.5, z=config.safe_z)
    await api.move_to(mount, start_point)
    await api.move_to(mount, start_point._replace(z=well_center.z + 10))
    try:
        well_brim_point = await api.touch_probe(
            mount, axis=Axis.Z, speed=config.probe_speed, distance=10
        )
        # compensate for ball radius on Z probe
        try:
            well_brim_point = well_brim_point._replace(z=well_brim_point.z)
        except Exception:
            pass
        if abs(well_brim_point.z - well_center.z) > 0.25:
            print(f"located well brim height at {well_brim_point.z}")
            print(f"brim height: {well_brim_point.z - well_center.z}")
        else:
            well_brim_point = well_brim_point._replace(z=well_center.z)
            print(f"no brim detected.")
        await api.move_to(mount, start_point)
        return well_brim_point.z
    except Exception:
        print("failed to locate brim location")
        return None


async def get_bottom(
    api: OT3API, mount: OT3Mount, well_center: Point, config: ProbeConfig
) -> Optional[Point]:
    # ensure starts at well center
    current_pos = await api.current_position_ot3(mount)
    current_pos_point = Point(
        x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z]
    )
    if current_pos_point != well_center:
        if current_pos_point.z != config.safe_z:
            await api.move_to(mount, current_pos_point._replace(z=config.safe_z))
        await api.move_to(mount, well_center._replace(z=config.safe_z))
        await api.move_to(mount, well_center)

    try:
        bottom = await api.touch_probe(
            mount, Axis.Z, config.probe_speed, config.shank_height - 1.0
        )
        await api.move_to(mount, well_center)
        print(f"Bottom is {bottom.z}")
    except Exception:
        print("Unable to find bottom")
        return None
    return bottom


# ============================================================================
# Main Function
# ============================================================================


async def _main(simulating: bool, mount: OT3Mount, num_wells: int, slot: int) -> None:
    # Initialize configuration
    config = ProbeConfig()
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    await api.home()
    await api.cache_instruments()

    deck_square_slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(
        slot + 1
    )
    # Probe Deck Z
    z_deck_pos = await get_deck_z(
        api,
        mount,
        deck_square_slot_center._replace(y=deck_square_slot_center.y + 15),
        config,
    )
    print(f"z deck pos: {z_deck_pos.z}")

    # search for deck square hole and get center. takes z deck surface, not pos
    deck_square_found = await search_hole(
        api, mount, deck_square_slot_center, z_deck_pos.z, config
    )
    if deck_square_found:
        current_pos = await api.current_position_ot3(
            mount=mount, critical_point=None, refresh=True
        )
        deck_square_center_result = await search_hole_center(
            api,
            mount,
            Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z]),
            config,
        )
        if deck_square_center_result:
            deck_square_center, deck_square_radius = deck_square_center_result
            print(
                f"Deck square hole center: {deck_square_center}, radius: {deck_square_radius:.3f} mm"
            )

    print(f"\nStarting Calibration on slot #{slot}")
    dimensions = await calibrate_labware_simple(api, mount, slot, z_deck_pos, config)
    if dimensions is None:
        print("Calibration failed.")
        return

    # Calculate well probe point based on well plate type
    if num_wells == 96:
        x_offset, y_offset = 14.38, 11.23
    elif num_wells == 384:
        x_offset, y_offset = 11.3, 8.5
    else:
        raise ValueError(f"Unsupported num_wells: {num_wells}")

    well_probe_point = Point(
        x=dimensions.x_min.x + x_offset,
        y=dimensions.y_max.y - y_offset,
        z=config.safe_z,
    )

    well_found = await search_hole(
        api, mount, well_probe_point, dimensions.z_max.z, config
    )
    if well_found:
        current_pos = await api.current_position_ot3(
            mount=mount, critical_point=None, refresh=True
        )
        result = await search_hole_center(
            api,
            mount,
            Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z]),
            config,
        )
        if result:
            center, radius = result
            brim_z = await get_brim_height(api, mount, center, radius, config)
            if brim_z is not None:
                # replace z_max with a Point using the brim height
                dimensions.z_max = dimensions.z_max._replace(z=brim_z)
                # also update the well center height to brim height
                center = center._replace(z=brim_z)
            dimensions.z_min = await get_bottom(api, mount, center, config)
        else:
            print("unable to determine well dimensions")

    # Print final dimensions using dataclass properties
    print(f"\nFinal Dimensions:")
    print(f"  Deck Radius: {deck_square_radius:.3f} mm")
    print(f"  Deck Center: {deck_square_center} mm")
    print(f"  Width:  {dimensions.width:.3f} mm")
    print(f"  Length: {dimensions.length:.3f} mm")
    print(f"  Height: {dimensions.height:.3f} mm")
    print(f"  Depth: {dimensions.depth:.3f} mm")
    print(f"  Bottom Offset: {dimensions.bottom_offset:.3f} mm")
    print(f"  Well Radius: {radius:.3f} mm")
    print(f"  Well Center: {center} mm")
    print(
        deck_square_radius,
        deck_square_center.x,
        deck_square_center.y,
        dimensions.width,
        dimensions.length,
        dimensions.height,
        dimensions.depth,
        dimensions.bottom_offset,
        radius,
        center.x,
        center.y,
    )
    await asyncio.sleep(0.5)
    await api.home([Axis.Z, Axis.X, Axis.Y])
    return


if __name__ == "__main__":
    print("\nTouch Probe Test\n")
    arg_parser = argparse.ArgumentParser(description="Touch Probe Test")
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--num_wells", type=int, default=96)
    arg_parser.add_argument("--slot", type=int, default=5)
    args = arg_parser.parse_args()
    mount = OT3Mount.LEFT
    asyncio.run(_main(args.simulate, mount, args.num_wells, args.slot))

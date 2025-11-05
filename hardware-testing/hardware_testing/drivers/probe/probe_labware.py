"""Touch Probe Script for OT-3"""
import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import CriticalPoint
from typing import Tuple, Union, Optional
from dataclasses import dataclass
from hardware_testings.drivers.probe.probe_config import ProbeConfig
from typing import NamedTuple

SLOT = 5
SAFE_Z = 150.0
PROBE_DECK_SAFE_Z = 100.0
PROBE_SPEED = 5.0
EDGE_OFFSET = 6.0  # how far inside the SLOT we start
BOUND_OFFSET = 5.0  # mm from edge of slot to consider as deck boundary
XY_DEBOUNCE_OFFSET = 3.0  # mm to back off in X or Y
SHANK_HEIGHT = 22.0
BALL_RADIUS = 1.0

@dataclass
class ProbeResukts(NameTuple):
   x_left: float = 0.0
   x_right: float = 0.0
   y_left: float = 0.0
   y_right: float = 0.0
   z_edge: float = 0.0
   height: float = 0.0
   


async def get_deck_z(api: OT3API, mount: OT3Mount, probe_point: Point) -> Point:
    """Probe Deck Z position."""
    # Probe Deck
    await api.move_to(mount, Point(x=probe_point.x, y=probe_point.y, z=250))
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=PROBE_DECK_SAFE_Z)
    )
    z_deck_pos = await api.touch_probe(
        mount, axis=Axis.Z, speed=PROBE_SPEED, distance=PROBE_DECK_SAFE_Z
    )
    if z_deck_pos is None:
        raise RuntimeError("Failed to detect deck surface")
    # compensate for ball probe radius (probe reports contact point at ball surface)
    try:
        z_deck_pos = z_deck_pos._replace(z=z_deck_pos.z)
    except Exception:
        pass
    # return to safe z
    await api.move_to(
        mount,
        Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=SAFE_Z),
    )
    return z_deck_pos


async def search_deck_square(
    api: OT3API, mount: OT3Mount, slot: int, z_deck_pos: Point
) -> Optional[tuple[Point, float]]:
    """
    Search for a hole in the deck calibration square for the given slot.
    If a hole is detected, refine its center and radius using search_hole_center
    and return (center_point, radius). Returns None if no hole is present.
    """
    slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(slot)

    # Move to safe XY above the square
    start_point = Point(x=slot_center.x, y=slot_center.y, z=SAFE_Z)
    await api.move_to(mount, start_point)

    z_target = z_deck_pos.z + 10.0
    await api.move_to(mount, Point(x=start_point.x, y=start_point.y, z=z_target))
    try:
        await api.touch_probe(
            mount, axis=Axis.Z, speed=PROBE_SPEED, distance=(z_target - z_deck_pos.z)
        )
        print("no square found")
        await api.move_to(mount, start_point)  # return to safe
        return None
    except Exception:
        print("square found")
        current_pos = await api.current_position_ot3(
            mount=mount, critical_point=None, refresh=True
        )
        search_start = Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z] - 1.0)
        try:
            result = await search_hole_center(api, mount, search_start)
            if result:
                center, radius = result
                print(f"Deck square hole center: {center}, radius: {radius:.3f} mm")
                return center, radius
            else:
                print("Unable to refine hole center for deck square.")
                return None
        except Exception:
            print(f"Error getting center")
            return None


async def calibrate_labware_simple(
    api: OT3API, mount: OT3Mount
) -> Optional[list[Point]]:
    """Probe Z, X, and Y bounds of labware in a given SLOT using absolute coordinates."""

    probe_results = []

    # Slot geometry, Points
    top_left = helpers_ot3.get_slot_top_left_position_ot3(SLOT)
    slot_size = helpers_ot3.get_slot_size()
    slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT)

    # bounds
    deck_bound_left = top_left.x - BOUND_OFFSET
    deck_bound_right = top_left.x + slot_size.x + BOUND_OFFSET
    deck_bound_up = top_left.y + BOUND_OFFSET
    deck_bound_down = top_left.y - slot_size.y - BOUND_OFFSET

    # Probe Deck Z
    z_deck_pos = await get_deck_z(
        api, mount, Point(x=slot_center.x + slot_size.x, y=slot_center.y + 17.5, z=250)
    )
    await search_deck_square(api, mount, 6, z_deck_pos)
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=SAFE_Z))
                      
    probe_results.append(z_deck_pos)

    # Positions for probing (Z first so we can compute z_safe and probe_offset)
    z_probe_pos = Point(x=top_left.x + EDGE_OFFSET, y=slot_center.y, z=SAFE_Z)
    x_min_probe_pos = Point(deck_bound_left, slot_center.y, z=SAFE_Z)
    x_max_probe_pos = Point(deck_bound_right, slot_center.y, z=SAFE_Z)
    y_max_probe_pos = Point(slot_center.x, deck_bound_up, z=SAFE_Z)
    y_min_probe_pos = Point(slot_center.x, deck_bound_down, z=SAFE_Z)

    # Each tuple = (target point, axis probed, retract direction)
    move_list = [
        (z_probe_pos, Axis.Z, 1),  # probe Z first to compute z_safe/probe_offset
        (x_min_probe_pos, Axis.X, -1),  # probing left wall, move -X to release
        (x_max_probe_pos, Axis.X, +1),  # probing right wall, move +X to release
        (y_max_probe_pos, Axis.Y, +1),  # probing top wall, move +Y to release
        (y_min_probe_pos, Axis.Y, -1),  # probing bottom wall, move -Y to release
    ]

    z_safe = SAFE_Z
    probe_offset = SAFE_Z - 2

    for move_point, probe_axis, release_dir in move_list:
        if probe_axis == Axis.Z:
            # Z probe: move to start and probe down the Z axis
            print(f"Moving to Z start position: {move_point}")
            await api.move_to(mount, move_point)

            print("Probing for top surface (Z)")
            try:
                z_probe_point = await api.touch_probe(
                    mount, axis=Axis.Z, speed=PROBE_SPEED, distance=SAFE_Z
                )
            except Exception:
                print("Failed to detect z surface")
                return None

            # compensate for ball radius on Z probe
            try:
                z_probe_point = z_probe_point._replace(z=z_probe_point.z)
            except Exception:
                pass
            probe_results.append(z_probe_point)
            z_edge = z_probe_point.z
            print(f"Top surface detected at Z = {z_edge} mm")

            # compute safe heights/offsets for subsequent XY probes
            z_safe = z_edge + 10
            probe_offset = z_edge - 2

            # debounce to z_safe
            current_pos = await api.current_position_ot3(mount)
            await api.move_to(
                mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=z_safe)
            )
            continue

        await api.move_to(mount, Point(x=move_point.x, y=move_point.y, z=z_safe))
        await api.move_to(mount, Point(x=move_point.x, y=move_point.y, z=probe_offset))

        # Perform the probe along the specified axis
        probe_loc = await api.touch_probe(
            mount,
            axis=probe_axis,
            speed=PROBE_SPEED,
            distance=25 * release_dir,
        )
        if probe_loc is None:
            raise RuntimeError(f"Failed to detect {probe_axis.name} edge")
        # compensate for ball radius on XY probes
        try:
            if probe_axis == Axis.X:
                # release_dir > 0 means probe moved in +X direction
                if release_dir > 0:
                    probe_loc = probe_loc._replace(x=probe_loc.x + BALL_RADIUS)
                else:
                    probe_loc = probe_loc._replace(x=probe_loc.x - BALL_RADIUS)
            else:  # Axis.Y
                if release_dir > 0:
                    probe_loc = probe_loc._replace(y=probe_loc.y + BALL_RADIUS)
                else:
                    probe_loc = probe_loc._replace(y=probe_loc.y - BALL_RADIUS)
        except Exception:
            pass
        probe_results.append(probe_loc)

        # Compute debounce/release move
        if probe_axis == Axis.X:
            coord = probe_loc.x
            release_pos = Point(
                x=move_point.x + (XY_DEBOUNCE_OFFSET * release_dir),
                y=move_point.y,
                z=z_safe,
            )
        else:  # Axis.Y
            coord = probe_loc.y
            release_pos = Point(
                x=move_point.x,
                y=move_point.y + (XY_DEBOUNCE_OFFSET * release_dir),
                z=z_safe,
            )

        print(f"{probe_axis.name} surface detected at {coord:.3f} mm")
        await api.move_to(mount, release_pos)

        # Return to safe Z after each probe
        current_pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=z_safe)
        )

    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=SAFE_Z)
    )

    return probe_results


async def get_dimensions(probe_results):
    z_deck_pos, z_max, x_min, x_max, y_max, y_min = probe_results
    width = abs(x_max.x - x_min.x)
    length = abs(y_max.y - y_min.y)
    height = z_max.z - z_deck_pos.z
    dimensions = {"width": width, "length": length, "height": height}
    print(dimensions)


async def search_hole(api, mount, probe_results: list[Point], num_wells: int) -> bool:
    """Search for hole center by probing and refining with an XY search.
    Returns the hole center Point or None if not found.
    """
    z_deck_pos, z_max, x_min, x_max, y_max, y_min = probe_results

    well_found: bool = False

    if num_wells == 96:
        x_offset, y_offset = 14.0, 11.0
    elif num_wells == 384:
        x_offset, y_offset = 11.3, 8.5
    else:
        raise ValueError(f"Unsupported num_wells: {num_wells}")

    start_point = Point(x=x_min.x + x_offset, y=y_max.y - y_offset, z=SAFE_Z)
    await api.move_to(mount, start_point)

    z_target = z_max.z + 5
    await api.move_to(mount, Point(x=start_point.x, y=start_point.y, z=z_target))

    # Attempt a small Z probe to check for the presence of a well.
    try:
        await api.touch_probe(
            mount, axis=Axis.Z, speed=PROBE_SPEED, distance=(z_target - z_max.z)
        )
    except Exception:
        # The probe didn't trigger, meaning it found a well.
        print("Well detected.")
        well_found = True
        return well_found

    print("No well detected during Z probe.")
    await api.move_to(mount, Point(x=start_point.x, y=start_point.y, z=SAFE_Z))
    return well_found


async def search_hole_center(
    api, mount, start_point: Point
) -> Optional[tuple[Point, float]]:
    """Search for hole center and compute true well radius."""
    max_radius = 127
    probe_depth = start_point.z - 1
    start_point = start_point._replace(z=probe_depth)

    try:
        # X Probe
        await api.move_to(mount, start_point)
        x_left = await api.touch_probe(
            mount, axis=Axis.X, speed=PROBE_SPEED, distance=max_radius
        )
        await api.move_to(mount, start_point)
        x_right = await api.touch_probe(
            mount, axis=Axis.X, speed=PROBE_SPEED, distance=-max_radius
        )
        # Y Probe
        await api.move_to(mount, start_point)
        y_up = await api.touch_probe(
            mount, axis=Axis.Y, speed=PROBE_SPEED, distance=-max_radius
        )
        await api.move_to(mount, start_point)
        y_down = await api.touch_probe(
            mount, axis=Axis.Y, speed=PROBE_SPEED, distance=max_radius
        )

    except Exception as e:
        print(f"Failed to detect hole edges: {e}")
        return None

    x_left = x_left.x - BALL_RADIUS
    x_right = x_right.x + BALL_RADIUS
    y_up = y_up.y + BALL_RADIUS
    y_down = y_down.y - BALL_RADIUS

    print(x_left, x_right, y_up, y_down)

    center_x = (x_left + x_right) / 2
    center_y = (y_up + y_down) / 2
    center = Point(x=center_x, y=center_y, z=start_point.z + 1.0)

    radius_x = abs(x_right - x_left) / 2.0
    radius_y = abs(y_up - y_down) / 2.0

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
    await asyncio.sleep(2)

    radius_test = await api.touch_probe(
        mount, axis=Axis.X, speed=PROBE_SPEED, distance=max_radius
    )
    radius_confirm = abs((radius_test.x - BALL_RADIUS) - center.x)
    print(f"radius confirm: {radius_confirm}")
    await api.move_to(mount, center)
    await asyncio.sleep(2)
    return center, radius


async def get_brim_height(
    api: OT3API, mount: OT3Mount, well_center: Point, radius: float
) -> Optional[float]:
    # move to safe height above center
    current_pos = await api.current_position_ot3(mount)
    await api.move_to(
        mount, Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=SAFE_Z)
    )
    # go to well rim minus a small offset
    start_point = well_center._replace(x=well_center.x - radius - 0.5, z=SAFE_Z)
    await api.move_to(mount, start_point)
    await api.move_to(mount, start_point._replace(z=well_center.z + 10))
    try:
        well_brim_point = await api.touch_probe(
            mount, axis=Axis.Z, speed=PROBE_SPEED, distance=10
        )
        # compensate for ball radius on Z probe
        try:
            well_brim_point = well_brim_point._replace(z=well_brim_point.z)
        except Exception:
            pass
        if abs(well_brim_point.z - well_center.z) > 0.25:
            print(f"located well brim height at {well_brim_point.z}")
        else:
            well_brim_point = well_brim_point._replace(z=well_center.z)
            print(f"no brim detected.")
        await api.move_to(mount, start_point)
        return well_brim_point.z
    except Exception:
        print("failed to locate brim location")
        return None


async def get_depth(
    api: OT3API,
    mount: OT3Mount,
    well_center: Point,
) -> Optional[float]:

    # ensure starts at well center
    current_pos = await api.current_position_ot3(mount)
    current_pos_point = Point(
        x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z]
    )
    if current_pos_point != well_center:
        if current_pos_point.z != SAFE_Z:
            await api.move_to(mount, current_pos_point._replace(z=SAFE_Z))
        await api.move_to(mount, well_center._replace(z=SAFE_Z))
        await api.move_to(mount, well_center)

    try:
        bottom = await api.touch_probe(mount, Axis.Z, PROBE_SPEED, SHANK_HEIGHT - 1.0)
        # compensate for ball radius on Z probe
        try:
            bottom = bottom._replace(z=bottom.z)
        except Exception:
            pass
        depth = well_center.z - bottom.z  # TODO make probe results a dictionary
        current_pos = await api.current_position_ot3(mount)
        await api.move_to(mount, well_center)
        print(f"Depth is {depth}")
    except Exception:
        print("Unable to find depth")
        return None
    return depth


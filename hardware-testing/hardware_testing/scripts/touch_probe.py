"""Touch Probe Script for OT-3"""
import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import CriticalPoint
from typing import Tuple, Union, Optional

SLOT = 5
SAFE_Z = 150.0
PROBE_DECK_SAFE_Z = 110.0
PROBE_SPEED = 5.0
EDGE_OFFSET = 6.0  # how far inside the SLOT we start
BOUND_OFFSET = 5.0  # mm from edge of slot to consider as deck boundary
XY_DEBOUNCE_OFFSET = 3.0  # mm to back off in X or Y
ENCODER_ERROR_OFFSET = (
    1.0  # mm to subtract from touch probe results to account for encoder error
)
SHANK_HEIGHT = 22.0


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
    # return to safe z
    await api.move_to(
        mount,
        Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=SAFE_Z),
    )
    return z_deck_pos


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
    width = abs(x_max.x - x_min.x) - ENCODER_ERROR_OFFSET
    length = abs(y_max.y - y_min.y) - ENCODER_ERROR_OFFSET
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
        x_offset, y_offset = 13.0, 10.0
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


async def search_hole_center(api, mount, start_point: Point) -> Optional[Point]:
    """Search for hole center"""
    max_radius = 100
    probe_depth = start_point.z - 1.0
    start_point = start_point._replace(z=probe_depth)
    try:
        # X Probe
        await api.move_to(mount, start_point)
        x_left = await api.touch_probe(
            mount, axis=Axis.X, speed=PROBE_SPEED, distance=-max_radius
        )
        await api.move_to(mount, start_point)
        x_right = await api.touch_probe(
            mount, axis=Axis.X, speed=PROBE_SPEED, distance=max_radius
        )

        # Y Probe
        await api.move_to(mount, start_point)
        y_up = await api.touch_probe(
            mount, axis=Axis.Y, speed=PROBE_SPEED, distance=max_radius
        )
        await api.move_to(mount, start_point)
        y_down = await api.touch_probe(
            mount, axis=Axis.Y, speed=PROBE_SPEED, distance=-max_radius
        )
    except Exception:
        print("Failed to detect hole edges.")
        return None

    center_x = (x_left.x + x_right.x) / 2
    center_y = (y_up.y + y_down.y) / 2
    center = Point(x=center_x, y=center_y, z=start_point.z + 1.0)
    if center is not None:
        await api.move_to(mount, center)

    print(f"Center found at: {center}")
    return center


async def get_depth(
    api: OT3API, mount: OT3Mount, well_center: Point, top_point: Point
) -> Optional[float]:

    try:
        bottom = await api.touch_probe(mount, Axis.Z, PROBE_SPEED, SHANK_HEIGHT - 1.0)
        depth = top_point.z - bottom.z  # TODO make probe results a dictionary
        current_pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount,
            Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=well_center.z),
        )
        print(f"Depth is {depth}")
    except Exception:
        print("Unable to find depth")
        return None
    return depth


async def _main(simulating: bool, mount: OT3Mount, num_wells: int) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    await api.home()
    await api.cache_instruments()
    print(f"\nStarting Calibration on slot #{SLOT}")
    probe_results = await calibrate_labware_simple(api, mount)
    if probe_results is None:
        print("Calibration failed.")
        return
    well_found = await search_hole(api, mount, probe_results, num_wells)
    if well_found:
        current_pos = await api.current_position_ot3(
            mount=mount, critical_point=None, refresh=True
        )
        center = await search_hole_center(
            api,
            mount,
            Point(x=current_pos[Axis.X], y=current_pos[Axis.Y], z=current_pos[Axis.Z]),
        )
        if center:
            depth = await get_depth(
                api, mount, center, probe_results[1]
            )  # probe results[1] should be the z_top lol. need to make this a dict
    await get_dimensions(probe_results)
    await asyncio.sleep(5)
    await api.home([Axis.Z, Axis.X, Axis.Y])
    return


if __name__ == "__main__":
    print("\nTouch Probe Test\n")
    arg_parser = argparse.ArgumentParser(description="Touch Probe Test")
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--num_wells", type=int, default=96)
    args = arg_parser.parse_args()
    mount = OT3Mount.LEFT
    asyncio.run(_main(args.simulate, mount, args.num_wells))

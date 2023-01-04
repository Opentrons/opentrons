"""OT-3 Manual Calibration."""
import argparse
import asyncio
from datetime import datetime
from threading import Thread
import time

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing import data
from hardware_testing.drivers.pressure_fixture import (
    PressureFixture,
    SimPressureFixture,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point


def file_setup(test_data, pipette_sn) -> str:
    D = datetime.now().strftime("%Y_%m_%d")
    test_header = ",".join(list(test_data.keys())) + "\n"
    test_tag = "{}-{}".format(pipette_sn, int(time.time()))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(pipette_sn)
    test_file = data.create_file_name(pipette_sn, test_id, test_tag)
    # data.append_data_to_file(test_name, test_file, pipette_sn)
    data.append_data_to_file(pipette_sn, test_file, str(pipette_sn) + "\n")
    data.append_data_to_file(pipette_sn, test_file, D + "\n")
    data.append_data_to_file(pipette_sn, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_file


async def _leak_test(api: OT3API, mount: OT3Mount, columns: int) -> None:
    # Move to slot 1-tiprack location to the first column
    home_pos = await api.current_position_ot3(mount)
    await api.move_to(mount, Point(175.6, 189.4, home_pos[OT3Axis.by_mount(mount)]))
    print("Jog to the TipRack")
    tiprack_loc = await helpers_ot3.jog_mount_ot3(api, mount)
    tip_column = 0
    for col in range(1, columns + 1):
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                tiprack_loc[OT3Axis.by_mount(mount)],
            ),
        )
        await api.pick_up_tip(mount, tip_length=57.3)
        await api.home_z(mount)
        tip_attached_home_z_pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
            ),
        )
        pos = await api.current_position_ot3(mount)
        # move to trough
        await api.move_to(
            mount, Point(340, 189.4, tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
        )
        await api.prepare_for_aspirate(mount)
        pos = await api.current_position_ot3(mount)
        if col <= 1:
            print("Jog to the Trough Liquid Height, 2mm below the liquid")
            trough_pos = await helpers_ot3.jog_mount_ot3(api, mount)
        # Move to Trough aspiration position
        else:
            await api.move_to(
                mount,
                Point(
                    trough_pos[OT3Axis.X],
                    trough_pos[OT3Axis.Y],
                    tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
                ),
            )
        await api.move_to(
            mount,
            Point(
                trough_pos[OT3Axis.X],
                trough_pos[OT3Axis.Y],
                trough_pos[OT3Axis.by_mount(mount)],
            ),
        )
        await api.aspirate(mount, volume=asp_volume)
        await api.move_to(
            mount,
            Point(
                trough_pos[OT3Axis.X],
                trough_pos[OT3Axis.Y],
                tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
            ),
        )
        for t in range(args.wait_time):
            print("Remaining time: ", args.wait_time - t, " (s)")
            await asyncio.sleep(1)
        input("Press Enter to Continue")
        pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount,
            Point(
                trough_pos[OT3Axis.X],
                trough_pos[OT3Axis.Y],
                pos[OT3Axis.by_mount(mount)],
            ),
        )
        await api.move_to(
            mount,
            Point(
                trough_pos[OT3Axis.X],
                trough_pos[OT3Axis.Y],
                trough_pos[OT3Axis.by_mount(mount)],
            ),
        )
        await api.dispense(mount)
        await api.blow_out(mount)
        await api.move_to(
            mount,
            Point(
                trough_pos[OT3Axis.X],
                trough_pos[OT3Axis.Y],
                tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
            ),
        )
        # Move to Trash Location- Note that these
        pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount, Point(434.8, 399.6, tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
        )
        await api.move_to(mount, Point(434.8, 399.6, 53.4))
        await api.drop_tip(mount, home_after=False)
        tip_column += 9
        pos = await api.current_position_ot3(mount)
        # Move to Z mount to home position
        await api.move_to(
            mount,
            Point(pos[OT3Axis.X], pos[OT3Axis.Y], home_pos[OT3Axis.by_mount(mount)]),
        )
        # Move to next tip column
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                home_pos[OT3Axis.by_mount(mount)],
            ),
        )


async def _check_pressure_leak(
    api: OT3API, mount: OT3Mount, test_name, test_file
) -> None:
    # Move to slot 1-tiprack location to the first column
    home_pos = await api.current_position_ot3(mount)
    await api.move_to(mount, Point(175.6, 189.4, home_pos[OT3Axis.by_mount(mount)]))
    print("Jog to next set of tips")
    tiprack_loc = await helpers_ot3.jog_mount_ot3(api, mount)
    tip_column = 0
    columns = 1
    descend_position = 14
    for col in range(1, columns + 1):
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                tiprack_loc[OT3Axis.by_mount(mount)],
            ),
        )
        await api.pick_up_tip(mount, tip_length=57.3)
        await api.home_z(mount)
        tip_attached_home_z_pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
            ),
        )
        pos = await api.current_position_ot3(mount)
        # move to Fixture
        await api.move_to(
            mount, Point(340, 189.4, tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
        )
        await api.prepare_for_aspirate(mount)
        pos = await api.current_position_ot3(mount)
        if col <= 1:
            print("Jog to the top of the fixture")
            fixture_loc = await helpers_ot3.jog_mount_ot3(api, mount)
        # Move to Trough aspiration position
        else:
            await api.move_to(
                mount,
                Point(
                    fixture_loc[OT3Axis.X],
                    fixture_loc[OT3Axis.Y],
                    tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
                ),
            )
        read = True
        phase = "Move"

        def run_pressure_fixture(gauge, test_name, test_file):
            start_time = time.time()
            while read:
                pressure_data = gauge.read_all_pressure_channel()
                d_str = f"{time.time() - start_time},{pressure_data},{phase} \n"
                data.append_data_to_file(test_name, test_file, d_str)

        PTH = Thread(target=run_pressure_fixture, args=(fixture, test_name, test_file))
        PTH.start()
        phase = "Move"
        await api.move_to(
            mount,
            Point(
                fixture_loc[OT3Axis.X],
                fixture_loc[OT3Axis.Y],
                fixture_loc[OT3Axis.by_mount(mount)],
            ),
        )
        await api.move_to(
            mount,
            Point(
                fixture_loc[OT3Axis.X],
                fixture_loc[OT3Axis.Y],
                fixture_loc[OT3Axis.by_mount(mount)] - descend_position,
            ),
            speed=2,
        )
        await asyncio.sleep(2)
        phase = "Aspirate"
        await api.aspirate(mount, volume=50)
        await asyncio.sleep(2)
        phase = "Dispense"
        await api.dispense(mount)
        phase = "Move"
        await api.move_to(
            mount,
            Point(
                fixture_loc[OT3Axis.X],
                fixture_loc[OT3Axis.Y],
                tip_attached_home_z_pos[OT3Axis.by_mount(mount)],
            ),
        )
        read = False
        PTH.join()  # Thread Finished
        # Move to Trash Location- Note that these
        pos = await api.current_position_ot3(mount)
        await api.move_to(
            mount, Point(434.8, 399.6, tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
        )
        await api.move_to(mount, Point(434.8, 399.6, 53.4))
        await api.drop_tip(mount, home_after=False)
        tip_column += 9
        pos = await api.current_position_ot3(mount)
        # Move to Z mount to home position
        await api.move_to(
            mount,
            Point(pos[OT3Axis.X], pos[OT3Axis.Y], home_pos[OT3Axis.by_mount(mount)]),
        )
        # Move to next tip column
        await api.move_to(
            mount,
            Point(
                tiprack_loc[OT3Axis.X] + tip_column,
                tiprack_loc[OT3Axis.Y],
                home_pos[OT3Axis.by_mount(mount)],
            ),
        )


async def _main(simulate: bool, mount: OT3Mount, columns: int) -> None:
    if simulate:
        fixture = SimPressureFixture()
    else:
        fixture = PressureFixture.create(port="/dev/ttyACM0")
    fixture.connect()
    test_data = {
        "Time": None,
        "P1": None,
        "P2": None,
        "P3": None,
        "P4:": None,
        "P5": None,
        "P6": None,
        "P7": None,
        "P8": None,
        "Phase": None,
    }
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    # Get pipette id
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    pipette_info = helpers_ot3.get_pipette_serial_ot3(pipette)
    print(f"Pipette: {pipette_info}")
    test_f = file_setup(test_data, pipette_info)
    data.append_data_to_file(pipette_info, test_f, f"Pipette: {pipette_info}")
    try:
        await api.home()
        if args.leak_test:
            await _leak_test(api, mount, columns)
        if args.check_pressure_test:
            await _check_pressure_leak(api, mount, pipette_info, test_f)
    finally:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        print("Test Finished")


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 Pipette Assembly QC Test")
    arg_parser.add_argument(
        "--mount", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--columns", type=int, default=2)
    arg_parser.add_argument("--wait_time", type=int, default=30)
    arg_parser.add_argument("--asp_volume_1", type=int, default=1000.0)
    arg_parser.add_argument("--asp_volume_2", type=int, default=50.0)
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--leak_test", action="store_true")
    arg_parser.add_argument("--check_pressure_test", action="store_true")
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    asyncio.run(_main(args.simulate, _mount, args.columns))

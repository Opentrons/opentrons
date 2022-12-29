"""OT-3 Manual Calibration."""
import asyncio
import argparse
import termios
import sys, tty, time
from threading import Thread
from datetime import datetime
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)

from hardware_testing import data
from hardware_testing.drivers.pressure_fixture import Ot3PressureFixture

async def suspend_timer(suspend_time: float):
    """

    """
    time_suspend = 0
    while time_suspend < suspend_time:
        asyncio.sleep(1)
        time_suspend +=1
        print('Remaining time: ', suspend_time-time_suspend, ' (s)' , end='')
        print('\r', end='')
    print('')

def fixture_setup():
    fixture = Ot3PressureFixture.create(port='/dev/ttyACM0')
    fixture.connect()
    return fixture

def getch():
    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch
    return _getch()

def dict_values_to_line(dict):
    return str.join(",", list(dict.values()))+"\n"

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys()))+"\n"

def file_setup(test_data, pipette, pipette_sn):
        test_name = "pipette_qc"
        D = datetime.now().strftime("%Y_%m_%d")
        test_header = dict_keys_to_line(test_data)
        test_tag = "{}-{}".format(pipette_sn, int(time.time()))
        test_id = data.create_run_id()
        test_path = data.create_folder_for_test_data(pipette_sn)
        test_file = data.create_file_name(pipette_sn, test_id, test_tag)
        # data.append_data_to_file(test_name, test_file, pipette_sn)
        data.append_data_to_file(pipette_sn, test_file, str(pipette_sn)+'\n')
        data.append_data_to_file(pipette_sn, test_file,  D + '\n')
        data.append_data_to_file(pipette_sn, test_file, test_header)
        print("FILE PATH = ", test_path)
        print("FILE NAME = ", test_file)
        return pipette_sn, test_file


def run_pressure_fixture(gauge, test_name, test_file):
    global read
    global phase
    start_time = time.perf_counter()
    while read:
        p = gauge.read_all_pressure_channel()
        p_channels = str([float(x) for x in p]).replace('[', '').replace(']', '')
        elasped_time = time.perf_counter() - start_time
        d_str = f"{elasped_time},{p_channels}, {phase} \n"
        print(d_str)
        data.append_data_to_file(test_name, test_file, d_str)

async def _jog_axis(api: OT3API, mount: OT3Mount, axis: OT3Axis) -> None:
    ax = axis.name.lower()[0]
    step_size = [0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == 'a':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X]-step,
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]),
                                        )
        elif input == 'd':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X]+step,
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]))
        elif input == 'w':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y]+step,
                                        pos[OT3Axis.by_mount(mount)]))
                                        # speed = 40)
        elif input == 's':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y]-step,
                                        pos[OT3Axis.by_mount(mount)]))
                                        # speed = 40)
        elif input == 'i':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]+step))
        elif input == 'k':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]-step))
        elif input == 'q':
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= len(step_size):
                step_length_index = len(step_size)-1
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == '\r':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            return pos

        current_position = await api.current_position_ot3(mount)
        print("Coordinates: X: {} Y: {} Z: {}".format(
                            round(current_position[OT3Axis.X],2),
                            round(current_position[OT3Axis.Y],2),
                            round(current_position[OT3Axis.by_mount(mount)],2)),
                            "      Motor Step: ",
                            step_size[step_length_index],
                            end='')
        print('\r', end='')

async def _leak_test(api: OT3API, mount: OT3Mount, columns: int) -> None:
    # Move to slot 1-tiprack location to the first column
    home_pos = await api.current_position_ot3(mount)
    await api.move_to(mount, Point(175.6,
                                    189.4,
                                    home_pos[OT3Axis.by_mount(mount)]))
    print("Jog to the TipRack")
    tiprack_loc = await _jog_axis(api, mount, OT3Axis.by_mount(mount))
    tip_column = 0
    for col in range(1, columns+1):
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tiprack_loc[OT3Axis.by_mount(mount)]))
        await api.pick_up_tip(mount, tip_length = 57.3)
        await api.home_z(mount)
        tip_attached_home_z_pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        pos = await api.current_position_ot3(mount)
        # move to trough
        await api.move_to(mount, Point(340,
                                    189.4,
                                    tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.prepare_for_aspirate(mount)
        pos = await api.current_position_ot3(mount)
        if col <= 1:
            print("Jog to the Trough Liquid Height, 2mm below the liquid")
            trough_pos = await _jog_axis(api, mount, OT3Axis.by_mount(mount))
        # Move to Trough aspiration position
        else:
            await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                            trough_pos[OT3Axis.Y],
                                            tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        trough_pos[OT3Axis.by_mount(mount)]))
        await api.aspirate(mount, volume = asp_volume)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await suspend_timer(args.wait_time)
        input("Press Enter to Continue")
        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]
                                ))
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        trough_pos[OT3Axis.by_mount(mount)]
                                        ))
        await api.dispense(mount)
        await api.blow_out(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
                                        )
        # Move to Trash Location- Note that these
        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(434.8 ,
                                        399.6 ,
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(434.8 ,399.6 ,53.4))
        await api.drop_tip(mount, home_after = False)
        tip_column += 9
        pos = await api.current_position_ot3(mount)
        # Move to Z mount to home position
        await api.move_to(mount, Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))
        # Move to next tip column
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))

async def _check_pressure_leak(api: OT3API, mount: OT3Mount, test_name, test_file) -> None:
    # Move to slot 1-tiprack location to the first column
    home_pos = await api.current_position_ot3(mount)
    await api.move_to(mount, Point(175.6,
                                    189.4,
                                    home_pos[OT3Axis.by_mount(mount)]))
    print("Jog to next set of tips")
    tiprack_loc = await _jog_axis(api, mount, OT3Axis.by_mount(mount))
    tip_column = 0
    columns = 1
    descend_position = 14
    for col in range(1, columns+1):
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tiprack_loc[OT3Axis.by_mount(mount)]))
        await api.pick_up_tip(mount, tip_length = 57.3)
        await api.home_z(mount)
        tip_attached_home_z_pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        pos = await api.current_position_ot3(mount)
        # move to Fixture
        await api.move_to(mount, Point(340,
                                    189.4,
                                    tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.prepare_for_aspirate(mount)
        pos = await api.current_position_ot3(mount)
        if col <= 1:
            print("Jog to the top of the fixture")
            fixture_loc = await _jog_axis(api, mount, OT3Axis.by_mount(mount))
        # Move to Trough aspiration position
        else:
            await api.move_to(mount, Point(fixture_loc[OT3Axis.X],
                                            fixture_loc[OT3Axis.Y],
                                            tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        global read
        global phase
        read = True

        PTH = Thread(target= run_pressure_fixture, args=(fixture, test_name, test_file))
        PTH.start()
        phase = 'Move'
        await api.move_to(mount, Point(fixture_loc[OT3Axis.X],
                                        fixture_loc[OT3Axis.Y],
                                        fixture_loc[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(fixture_loc[OT3Axis.X],
                                        fixture_loc[OT3Axis.Y],
                                        fixture_loc[OT3Axis.by_mount(mount)]-descend_position),
                                        speed = 2)
        await asyncio.sleep(2)
        phase = 'Aspirate'
        await api.aspirate(mount, volume = 50)
        await asyncio.sleep()
        phase = 'Dispense'
        await api.dispense(mount)
        phase = 'Move'
        await api.move_to(mount, Point(fixture_loc[OT3Axis.X],
                                        fixture_loc[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
                                        )
        read = False
        PTH.join() #Thread Finished
        # Move to Trash Location- Note that these
        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(434.8 ,
                                        399.6 ,
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(434.8 ,399.6 ,53.4))
        await api.drop_tip(mount, home_after = False)
        tip_column += 9
        pos = await api.current_position_ot3(mount)
        # Move to Z mount to home position
        await api.move_to(mount, Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))
        # Move to next tip column
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))

async def _main(simulate: bool, mount: OT3Mount, columns: int, fixture) -> None:
    test_data = {
                'Time': None,
                'P1': None,
                'P2': None,
                'P3': None,
                'P4:': None,
                'P5': None,
                'P6': None,
                'P7': None,
                'P8': None,
                'Phase': None
                }

    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    # Get pipette id
    pipette = api.hardware_pipettes[mount.to_mount()]
    pipette_info = input("Enter Pipette Serial SN: ")
    assert pipette, f"No pipette found on mount: {mount}"
    print(f'Pipette: {pipette_info}')
    test_n, test_f  = file_setup(test_data, pipette, pipette_info)
    d_str = f"Pipette: {pipette} \n"
    data.append_data_to_file(test_n, test_f, d_str)
    try:
        # Home gantry
        await api.home()
        home_pos = await api.current_position_ot3(mount)
        pos = await api.current_position_ot3(mount)
        if args.leak_test:
            await _leak_test(api, mount, columns)
        if args.check_pressure_test:
            await _check_pressure_leak(api, mount, test_n, test_f)
    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        print('Cancelled')
    finally:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        print('Test Finished')

if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 Assembly QC")
    arg_parser.add_argument(
        "--mount", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--columns", type = int, default = 2)
    arg_parser.add_argument("--wait_time", type = int, default = 30)
    arg_parser.add_argument("--asp_volume_1", type = int, default = 1000.0)
    arg_parser.add_argument("--asp_volume_2", type = int, default = 50.0)
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
    fixture = fixture_setup()
    asyncio.run(_main(args.simulate, _mount, args.columns, fixture))

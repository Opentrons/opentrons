import argparse
import asyncio
import time

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial

MOUNT = OT3Mount.LEFT
AXIS = OT3Axis.Z_L
TRIALS = 2

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    test_tag = input("Enter test tag:\n\t>> ")
    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "partial-tip-pick-up-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    # header = ['Trial', 'Current (A)', 'Tip Count', 'Dial 1 Reading (mm)', 'Dial 2 Reading (mm)',
    #                                                             'Tip Feel', 'Leaking', 'Test Robot']
    header = ['Trial', 'Current (A)', 'Tip Count', 'Dial 1 Reading (mm)', 'Dial 2 Reading (mm)', 'Test Robot']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    current_list = [0.75, 1.5] ### 1.0, 1.25, 1.5, 1.75, 2.0]
    ### 0.75 A for 8 tips, 1.5 A for 16 tips
    tip_count_list = [8, 16] ### , 24, 32]
    # loose_tip_list = []
    # leak_list = []
    # nozzle_list = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    print("Move to dial indicator fixture for initial measurement\n")
    tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {tip_rack_position}\n")

    print("|||Move to tip rack...|||\n")
    tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {tip_rack_position}\n")
    ### Jogged the mount to deck coordinate: {<OT3Axis.X: 0>: 413.709, <OT3Axis.Y: 1>: 423.3, <OT3Axis.Z_L: 2>: 499.151, <OT3Axis.P_L: 5>: 0}
    for current in current_list:
        for tc in tip_count_list:
            print(f"Current: {current}, Tip Count: {tc}\n")
            print("Moving to tip rack...")
            await api.move_to(mount, Point(tip_rack_position[OT3Axis.X],
                                tip_rack_position[OT3Axis.Y], tip_rack_position[OT3Axis.Z_L]))
            ### --> await helpers_ot3.update_pick_up_current(api, mount, current)
            tip_len = 57 # 50uL Tip
            # tip_len = 85 # 1K tip
            ### --> await api.pick_up_tip(mount, tip_length=tip_len)
            await api.move_rel(mount, delta=Point(z=-100)) ### change to z=100
            print("||| Inspect tips...|||\n")
            for row in range(int(tc/8)):
                print(f"Row: {row+1}\n")
                print("\t>> Are all tips securely attached? (Y/N)\n")
                tip_inspect = input("\t>> ")
                print("\n")
                if tip_inspect.lower() == 'n':
                    current_col = []
                    for nozzle in nozzle_list:
                        print(f"\n\t>> Nozzle {nozzle} (P/M/F):\n")
                        user_input = input("\n\t\t>> ")
                        current_col.append(user_input)
                    loose_tip_list.append(current_col)
                else:
                    loose_tip_list.append(["P", "P", "P", "P", "P", "P", "P", "P"])
                print("||| Move to dial indicator fixture...|||\n")
                gauge_pos = await helpers_ot3.jog_mount_ot3(api, mount)
                print(f"Jogged the mount to deck coordinate: {gauge_pos}\n")

                await asyncio.sleep(1)
                g1_read = gauge_one.read()
                g2_read = 0 ### --> gauge_two.read()
                print(f"Gauge 1 read: {g1_read} mm\n")
                print(f"Gauge 2 read: {g2_read} mm\n")

            print("|||Move to reservoir...|||\n")
            reservoir_pos = await helpers_ot3.jog_mount_ot3(api, mount)
            print(f"Jogged the mount to deck coordinate: {reservoir_pos}\n")
            ### --> await api.aspirate(mount, 50)
            await api.move_rel(mount, delta=Point(z=-100)) ### change to z=100
            print("|||Inspect tips...|||\n")
            for row in range(int(tc/8)):
                print(f"Row: {row+1}\n")
                print("\n\t>> Are any tips leaking? (Y/N)\n")
                leak_inspect = input("\t>> ")
                if leak_inspect.lower() == 'y':
                    leak_col = []
                    for nozzle in nozzle_list:
                        print(f"\n\t>> Nozzle {nozzle} (Y/N):\n")
                        user_input = input("\n\t\t>> ")
                        leak_col.append(user_input)
                    leak_list.append(leak_col)
                else:
                    leak_list.append(["N", "N", "N", "N", "N", "N", "N", "N"])

            cycle_data = ["1", current, tc, g1_read, g2_read, loose_tip_list, leak_list, test_robot]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
            await asyncio.sleep(1)
            await api.remove_tip(mount)

if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--port_one", type=str,
                        default = '/dev/ttyUSB0', help = "Dial Indicator 1 Port")
    parser.add_argument("--port_two", type=str,
                        default = '/dev/ttyUSB1', help = "Dial Indicator 2 Port")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    gauge_one = dial.Mitutoyo_Digimatic_Indicator(port=args.port_one)
    gauge_one.connect()

    ### --> gauge_two = dial.Mitutoyo_Digimatic_Indicator(port=args.port_two)
    ### --> gauge_two.connect()

    asyncio.run(_main(args.simulate, mount))

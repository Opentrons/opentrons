import argparse
import asyncio
import time

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial
from opentrons.hardware_control.types import CriticalPoint

MOUNT = OT3Mount.LEFT
AXIS = OT3Axis.Z_L

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    test_tag = input("Enter test tag:\n\t>> ")
    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "partial-tip-pick-up-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Deck Slot', 'Current (A)', 'Tip Count', 'Initial Dial 2 Read (mm)',
              'Initial Dial 1 Read (mm)', 'Tip Attached Dial 2 Reading (mm)',
              'Tip Attached Dial 1 Reading (mm)', 'Test Robot']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    current_list = [1.0] #, 1.5]# [0.5]#, 1.5] ### 1.0, 1.25, 1.5, 1.75, 2.0]
    ### 0.75 A for 8 tips, 1.5 A for 16 tips
    tip_count_list = [12] #, 24]#, 16] ### , 24, 32]
    deck_slot_list = ["D2", "C2", "B2", "A2"]

    for deck_slot in deck_slot_list:
        for i in range(len(tip_count_list)):
            # if deck_slot == "C2" and tip_count_list[i] == 8:
            #     print("skip 8 tips for C2\n")
            #     continue
            print(f"\n>>> Tip Count: {tip_count_list[i]} | Current: {current_list[i]} A <<<\n")
            print(f"Place dial indicator fixture onto slot {deck_slot}...")
            input("\t>> Press enter to continue...")
            print("\nMove to dial indicator fixture for initial measurement\n")
            fixture_position = await helpers_ot3.jog_mount_ot3(api, mount)
            # print(f"Jogged the mount to deck coordinate: {fixture_position}\n")

            # await api.move_rel(mount, delta=Point(z=-2))
            await asyncio.sleep(1)
            init_g1_read = gauge_one.read()
            print("Attempting to read dial 2...\n(Press Ctrl-C if script hangs to enter reading manually)\n")
            try:
                init_g2_read = gauge_two.read()
            except KeyboardInterrupt:
                print("\nEnter gauge 2 reading:\n")
                init_g2_read = input("\t>> ") #gauge_two.read() #
            print(f"Dial 1 reading: {init_g1_read}\nDial 2 reading: {init_g2_read}\n")

            await api.home([AXIS]) #api.move_rel(mount, delta=Point(z=100))
            print(f"Place tip rack in slot {deck_slot}...")
            input("\t>> Press enter to continue...")
            print("\nMove to tip rack to pick up tips\n")
            tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)

            # await helpers_ot3.update_pick_up_current(api, mount, current_list[i])
            pip = helpers_ot3._get_pipette_from_mount(api, mount)
            config_model = pip.pick_up_configurations
            print(f"Current value before update: {config_model.current} A\n")
            await helpers_ot3.update_pick_up_current(api, mount, current_list[i])
            print(f"Current value set to: {config_model.current} A\n")
            print(f"Pick up travel distance: {config_model.distance} mm\n")

            print("Picking up tips\n")
            tip_len = 85 # 57 for 50 uL tip, 85 for 1K uL tip
            await api.pick_up_tip(mount, tip_len)
            #await api.move_rel(mount, delta=Point(z=-19), speed=5.5)
            #await api.add_tip(mount, tip_len)
            # print("home axis\n")
            # await api.home([AXIS])
            # await api.move_to(mount, Point(tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[OT3Axis.Z_L]))
            # pos_after = await api.gantry_position(mount)
            # print(f"after pick up command, pos: {pos_after}\n")
            # await asyncio.sleep(0.5)
            # print("move_rel\n")
            # await api.move_rel(mount, delta=Point(z=100), speed=17.5)
            # await api.home([AXIS]) #api.move_rel(mount, delta=Point(z=100))

            # await helpers_ot3.jog_mount_ot3(api, mount)

            current_pos = await api.current_position_ot3(mount)
            enc_pos = await api.encoder_current_position_ot3(mount)
            print(f"current position: {current_pos}\n")
            print(f"current enc pos: {enc_pos}\n")

            update_flag = input("update robot position? (y/n)\n\t>> ")
            if update_flag.lower() == 'y':
                print("update robot position!\n")
                await api._update_position_estimation([OT3Axis.Z_L])
                current_pos = await api.current_position_ot3(mount)
                enc_pos = await api.encoder_current_position_ot3(mount)
                print(f"updated current position: {current_pos}\n")
                print(f"updated current enc pos: {enc_pos}\n")
                # await helpers_ot3.jog_mount_ot3(api, mount)

            # print("home axis\n")
            # await api.home([AXIS])

            print(f"Home Z-Axis...")
            input("\t>> Press enter to continue...")
            await api.home([AXIS])
            print(f"Place dial indicator fixture onto slot {deck_slot}...")
            input("\t>> Press enter to continue...")
            print("\nMove to dial indicator fixture for tip attach measurement\n")
            await api.move_to(mount, Point(fixture_position[OT3Axis.X], fixture_position[OT3Axis.Y], fixture_position[OT3Axis.Z_L]), critical_point=CriticalPoint.TIP)

            await asyncio.sleep(1)
            g1_read = gauge_one.read()
            print("Attempting to read dial 2...\n(Press Ctrl-C if script hangs to enter reading manually)\n")
            try:
                init_g2_read = gauge_two.read()
            except KeyboardInterrupt:
                print("\nEnter gauge 2 reading:\n")
                g2_read = input("\t>> ") #gauge_two.read() #
            print(f"Dial 1 reading: {g1_read}\nDial 2 reading: {g2_read}\n")

            #await api.home([AXIS])
            #print("Check levelling block? (y/n)\n")
            #level = input("\t>> ")
            #if level.lower() == "y":
            #    print("Jog pipette to levelling block...\n")
            #    await helpers_ot3.jog_mount_ot3(api, mount)

            await api.home([AXIS]) #api.move_rel(mount, delta=Point(z=100))
            print(f"Place tip rack in slot {deck_slot}...")
            input("\t>> Press enter to continue...")
            print("\nMove to tip rack to eject tips\n")
            await api.move_to(mount, Point(tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[OT3Axis.Z_L]))
            await api.drop_tip(mount)
            await api.home([AXIS]) #api.move_rel(mount, delta=Point(z=100))

            cycle_data = [deck_slot, current_list[i], tip_count_list[i], init_g2_read, init_g1_read, g2_read, g1_read, test_robot]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)

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

    gauge_two = dial.Mitutoyo_Digimatic_Indicator(port=args.port_two)
    gauge_two.connect()

    asyncio.run(_main(args.simulate, mount))

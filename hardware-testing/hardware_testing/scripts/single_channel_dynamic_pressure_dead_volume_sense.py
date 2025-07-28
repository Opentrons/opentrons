"""Single Channel Dynamic Dead Volume Test."""

import argparse
import asyncio
import time
from typing import Dict, Literal, List
import datetime
import os, sys
import termios
import tty
import json
from dataclasses import dataclass
from enum import Enum

from hardware_testing.opentrons_api.types import(
    OT3Mount,
    Axis,
    Point,
    CriticalPoint,
)
import csv
from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing import data
from hardware_testing.data import ui, get_testing_data_directory
from hardware_testing.drivers import mitutoyo_digimatic_indicator
from opentrons.config.types import(LiquidProbeSettings)
from opentrons.hardware_control.types import InstrumentProbeType
from opentrons.hardware_control.motion_utilities import (target_position_from_plunger)
from opentrons.hardware_control.types import (
    InstrumentProbeType,
    PipetteSensorId,
    OT3Mount,
    Axis,
    top_types,
    PipetteSensorResponseQueue,
    HardwareAction
)

response_queue: PipetteSensorResponseQueue = asyncio.Queue()

PRESS_DISTANCE = 15
NOZZLE_DIAMETER = 5
RADIUS = NOZZLE_DIAMETER/2+ 2.0
PREP_PRESS_DISTANCE = 2
TIP_PRESS_MOTOR_CURRENT = 0.15 

"""
DEFAULT_LIQUID_PROBE_SETTINGS: LiquidProbeSettings(
    mount_speed=5,
    plunger_speed=15,
    plunger_impulse_time=0.2,
    sensor_threshold_pascals=15,
    aspirate_while_sensing=False,
    z_overlap_between_passes_mm=0.1,
    plunger_reset_offset=2.0,
    samples_for_baselining=20,
    sample_time_sec=0.004,
)
"""

class LLDResult(Enum):
    """Result Strings."""

    success = "success"
    not_found = "not found"
    blockage = "blockage"

@dataclass
class TestConfig:
    """Test Config"""

    simulate: bool
    pipette: Literal[50, 200, 1000]

def load_config_(filename: str) -> Dict[str, str]:
    """This function loads a given config file"""
    try:
        with open(filename, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

def save_config_(filename: str, data: Dict[str, str]) -> Dict[str, str]:
    """This function saves a given config file with data"""
    try:
        with open(filename, 'w') as file:
            json.dump(
                data, file, sort_keys=True, indent=4, separators=(',', ': ')
                    )
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

def dict_keys_to_line(dict: Dict[str, str]) -> str:
    return str.join(",", list(dict.keys())) + "\n"

def file_setup(test_data: Dict[str, str], details: List):
    today = datetime.date.today()
    test_name = "{}-one-press-dynamic-tipoverlap-test-{}".format(
        details[0],  # Pipette model
        details[1],  # Motor Current
    )
    test_header = dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file, test_id

def _test_for_blockage(datafile: str, threshold: float) -> bool:
    with open(datafile, "r") as file:
        reader = csv.reader(file)
        reader_list = list(reader)
        for i in range(1, len(reader_list)):
            if i > 1 and abs(float(reader_list[i][1])) > threshold:
                return abs(float(reader_list[i][1]) - float(reader_list[i - 1][1])) > 40
    return False

def dial_indicator_setup(port):
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=port)
    gauge.connect()
    return gauge

def getch():
    """
    fd: file descriptor stdout, stdin, stderr
    This functions gets a single input keyboard character from the user
    """

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

async def jog(api, position, cp) -> Dict[Axis, float]:
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
    za_speed = 65
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
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            await api._update_position_estimation([Axis.by_mount(mount)])
            position = await api.encoder_current_position_ot3(
                mount, critical_point=cp, refresh=True
            )
            print("\r\n")
            return position
        await api._update_position_estimation([Axis.by_mount(mount)])
        position = await api.encoder_current_position_ot3(
            mount, critical_point=cp, refresh = True
        )

        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")

async def move_to_point(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    home_offset = 5
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    expect_stalls=False)
    
async def move_to_tip(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    home_offset = 0
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos-home_offset),
                    speed=None,
                    critical_point = cp,
                    expect_stalls=False,
                    )
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset),
                    speed=None,
                    critical_point = cp,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    critical_point = CriticalPoint.NOZZLE,
                    expect_stalls=False)

async def move_direct(api, mount, point, cp) -> None:
    offset = 5
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    # input("Presss Enter to Continue 0")
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        pos[Axis.by_mount(mount)] + offset),
                    speed=None,
                    expect_stalls=False)
    # input("Press Enter to continue 1")
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        pos[Axis.by_mount(mount)] + offset),
                    speed=None,
                    expect_stalls=False)
    # input("Press Enter to Continue 2")
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    expect_stalls=False
                    )

async def calibrate_tiprack(api, mount) -> Point:
    cp = CriticalPoint.NOZZLE
    tiprack_loc = Point(
                    deck_slot['deck_slot'][args.tiprack_slot]['X'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Y'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Z'])
    print(tiprack_loc)
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc_dict = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc_dict[Axis.X],
                        tiprack_loc_dict[Axis.Y],
                        tiprack_loc_dict[Axis.by_mount(mount)])
    return tiprack_loc

async def _main(args: argparse.Namespace, cfg: TestConfig) -> None:
    today = datetime.date.today()
    probe_settings = LiquidProbeSettings(
                            mount_speed=3,
                            plunger_speed=5,
                            plunger_impulse_time=0.4,
                            sensor_threshold_pascals=args.pressure_threshold,
                            aspirate_while_sensing=True,
                            z_overlap_between_passes_mm=0.1,
                            plunger_reset_offset=2.0,
                            samples_for_baselining=20,
                            sample_time_sec=0.004,
                            )
    hw_api = await helpers_ot3.build_async_ot3_hardware_api(
                                                    is_simulating=cfg.simulate,
                                                    pipette_left='p1000_96_v3.4',
                                                    stall_detection_enable=False,
                                                        )
    
    fw = hw_api.get_fw_version()
    print(f'fw version: {fw}')
    await hw_api.cache_instruments()
    
    attached_instr = hw_api.get_all_attached_instr()[mount]
    if attached_instr is not None and mount in attached_instr:
        pipette_model = attached_instr[mount.value]["pipette_id"]
    else:
        pipette_model = None
    instr = hw_api._pipette_handler.get_pipette(mount)
    try:
        await hw_api.home()
        await hw_api.set_lights(rails=True)
        home_position = await hw_api.current_position_ot3(mount)
        cp = CriticalPoint.NOZZLE
        details = [pipette_model, 'default-current']
        # test_n, test_f, test_ID = file_setup(dial_data, details)
        if (args.calibrate):
            pickup_loc = await calibrate_tiprack(hw_api, mount)
            deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pickup_loc.x
            deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pickup_loc.y
            deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pickup_loc.z
            save_config_(path+cal_fn, deck_slot)
            # Target should be the top of the side of the tip
            prep_target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z+PREP_PRESS_DISTANCE)
            await move_direct(hw_api, mount, prep_target, cp)
            # async with hw_api._backend.motor_current(run_currents=spec.tip_action_moves[0].currents):
            async with hw_api._backend.motor_current(run_currents={Axis.by_mount(mount): TIP_PRESS_MOTOR_CURRENT}):
                target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z-PRESS_DISTANCE)
                await hw_api.move_to(mount=mount, 
                                    abs_position=target, 
                                    speed=10, 
                                    critical_point=CriticalPoint.NOZZLE,
                                    max_speeds=None,
                                    expect_stalls=True)
            tip_overlap_measurements = []
            await hw_api._update_position_estimation([Axis.by_mount(mount)])
            init_tipoverlap = (await hw_api.encoder_current_position_ot3(mount, cp, refresh=True))[Axis.by_mount(mount)]
            # init_tipoverlap = init_tipoverlap[Axis.by_mount(mount)]
            print(f'init_tipoverlap: {init_tipoverlap}')
            pickup_location = Point(x=pickup_loc.x, y=pickup_loc.y,z=init_tipoverlap) 
            # Let's pressed onto the tip -> stall and measure the encoder position
            await move_direct(hw_api, mount, pickup_location, cp)
            # This would be my initial press position
            # the first tip overlap value passed to pickup tip is a placeholder
            tip_overlap_dict = await hw_api.pick_up_tip(
                                        mount, 
                                        tip_length=(tip_length[args.tip_size]-tip_overlap))
            print(f'Init Position: {init_tipoverlap}')
            print(f'tip_overlap_dict: {tip_overlap_dict}')
            enc_tipoverlap =  (tip_overlap_dict['init'] - tip_overlap_dict['final'])+args.press_comp
            print(f'TipOverlap(mm): {enc_tipoverlap}')
            tip_overlap_measurements.append(enc_tipoverlap)
            instr = hw_api._pipette_handler.get_pipette(mount)
            current_tipL = instr.current_tip_length
            print(f'current_tip end effector: {current_tipL}')
            current_position = await hw_api.current_position_ot3(mount)
            print(f'current end effector: {current_position}')
            new_tipL = instr.current_tip_length
            instr.remove_tip()
            print(f'new_current end effector: {new_tipL}')
            instr.add_tip((tip_length[args.tip_size]-enc_tipoverlap))

        else:
            x = deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] 
            y = deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] 
            z = deck_slot['deck_slot'][args.tiprack_slot]['Z']
            pickup_loc = Point(x= x, y=y, z=z)
            prep_target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z+PREP_PRESS_DISTANCE)
            await move_direct(hw_api, mount, prep_target, cp)
            
            async with hw_api._backend.motor_current(run_currents={Axis.by_mount(mount): TIP_PRESS_MOTOR_CURRENT}):
                target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z-PRESS_DISTANCE)
                await hw_api.move_to(mount=mount, 
                                    abs_position=target, 
                                    speed=10, 
                                    critical_point=CriticalPoint.NOZZLE,
                                    max_speeds=None,
                                    expect_stalls=True)
            await hw_api._update_position_estimation([Axis.by_mount(mount)])
            init_tipoverlap = (await hw_api.encoder_current_position_ot3(mount, cp, refresh=True))[Axis.by_mount(mount)]
            # init_tipoverlap = init_tipoverlap[Axis.by_mount(mount)]
            print(f'init_tipoverlap: {init_tipoverlap}')
            pickup_location = Point(x=pickup_loc.x, y=pickup_loc.y,z=init_tipoverlap) 
            # Let's pressed onto the tip -> stall and measure the encoder position
            await move_direct(hw_api, mount, pickup_location, cp)
            # This would be my initial press position
            # the first tip overlap value passed to pickup tip is a placeholder
            tip_overlap_dict = await hw_api.pick_up_tip(
                                        mount, 
                                        tip_length=(tip_length[args.tip_size]-tip_overlap))
            print(f'Init Position: {init_tipoverlap}')
            print(f'tip_overlap_dict: {tip_overlap_dict}')
            enc_tipoverlap =  (tip_overlap_dict['init'] - tip_overlap_dict['final'])+args.press_comp
            print(f'TipOverlap(mm): {enc_tipoverlap}')
            await hw_api.home([Axis.by_mount(mount)])

        cp = CriticalPoint.TIP
        current_position = await hw_api.current_position_ot3(mount, cp)
        await hw_api.home([Axis.by_mount(mount)])
        lw_point = Point(x = deck_slot['deck_slot']['C2'][Axis.X.name],
                        y = deck_slot['deck_slot']['C2'][Axis.Y.name],
                        z = deck_slot['deck_slot']['C2']['Z']
                        )
        await move_to_point(hw_api, mount, lw_point, cp)
        start_height_dict = await jog(hw_api, current_position, cp)
        start_height = Point(start_height_dict[Axis.X],
                        start_height_dict[Axis.Y],
                        start_height_dict[Axis.by_mount(mount)])
        deck_slot['deck_slot']['C2'][Axis.X.name] = start_height.x
        deck_slot['deck_slot']['C2'][Axis.Y.name] = start_height.y
        deck_slot['deck_slot']['C2']['Z'] = start_height.z
        save_config_(path+cal_fn, deck_slot)
        data_dir = get_testing_data_directory()
        probes: List[InstrumentProbeType] = [InstrumentProbeType.PRIMARY]
        probe_target: InstrumentProbeType = InstrumentProbeType.PRIMARY
        if args.nozzles > 1:
            probes.append(InstrumentProbeType.SECONDARY)
            probe_target = InstrumentProbeType.BOTH
        data_files: Dict[InstrumentProbeType, str] = {}
        data_capture: PipetteSensorResponseQueue = PipetteSensorResponseQueue()
        for probe in probes:
            data_filename = f"pressure_sensor_data-trial{1}-tip{1}-{probe.name}.csv"
            data_file = f"{data_dir}/dead_volume/1/{data_filename}"
            ui.print_info(f"logging pressure data to {data_file}")
            data_files[probe] = data_file
        # We need to use this probe function to find the bottom
        z_height= await hw_api.liquid_probe(mount=mount,
                                max_z_dist = 50,
                                probe_settings=probe_settings,
                                probe=InstrumentProbeType.PRIMARY,
                                force_both_sensors=False,
                                response_queue=data_capture
                                )
        result: LLDResult = LLDResult.success
        print(f"Deck Coordinate Z Height: {z_height}")
        for probe in probes:
                sensor_id = (
                    PipetteSensorId.S0
                    if probe == InstrumentProbeType.PRIMARY
                    else PipetteSensorId.S1
                )
                as_dict = data_capture.get_nowait()
                data = [d.to_float() for d in as_dict[sensor_id]]
                print(data)
                with open(data_files[probe], "w") as d_file:
                    writer = csv.writer(d_file)
                    writer.writerow(
                        [
                            "time(s)",
                            "Pressure(pascals)",
                            "z_velocity(mm/s)",
                            "plunger_velocity(mm/s)",
                            "threshold(pascals)",
                        ]
                    )
                    writer.writerow(
                        [
                            "0",
                            "0",
                            f"{probe_settings.mount_speed}",
                            f"{probe_settings.plunger_speed}",
                            f"{args.pressure_threshold}",
                        ]
                    )
                    for i in range(len(data)):
                        writer.writerow([f"{i*0.004}", f"{data[i]}"])
        for probe in data_files:
            if _test_for_blockage(data_files[probe], probe_settings.sensor_threshold_pascals):
                result = LLDResult.blockage
                break
        await hw_api._update_position_estimation()
        hw_api._pipette_handler.ready_for_tip_action(
            instr, HardwareAction.PREPARE_ASPIRATE, OT3Mount.from_mount(mount)
        )
        current_position = await hw_api.encoder_current_position_ot3(mount, 
                                                                    cp,
                                                                    refresh=True)
        z_position = current_position[Axis.by_mount(mount)]
        pip_position  = current_position[Axis.of_main_tool_actuator(mount)]
        print(f"Pipette Position: {pip_position}")
        print(f"Z position: {z_position}")
        aspirate_spec = hw_api._pipette_handler.plan_check_aspirate(
            mount = OT3Mount.from_mount(mount),
            volume = 10.0,
            rate=1.0,
            correction_volume = 0.0,
        )
        target_pos = target_position_from_plunger(
            OT3Mount.from_mount(mount),
            aspirate_spec.plunger_distance,
            hw_api._current_position,
        )
        offset = 20
        print(f"plunger_pos: {target_pos}")
        retract_point = Point(x = current_position[Axis.X], 
                                y = current_position[Axis.Y],
                                z = z_position + offset)
        await hw_api.move_to(mount = mount,
                             abs_position = retract_point,
                             speed= None,
                             critical_point=cp)
        
        input("Press Enter")
        bottom_offset = 0.1
        aspirate_pos = Point(x = current_position[Axis.X], 
                            y = current_position[Axis.Y],
                            z = z_position + bottom_offset)
        await hw_api.move_to(mount = mount,
                             abs_position = aspirate_pos,
                             speed = None,
                             critical_point=cp)
        ul_per_mm = instr.ul_per_mm(10, 'aspirate')
        c_volume = ul_per_mm*(instr.plunger_positions.bottom-pip_position)
        aspirate_spec.instr.set_current_volume(0)
        aspirate_spec.instr.add_current_volume(c_volume)
        print(f'current volume: {instr.current_volume}')
        await hw_api.refresh_positions()
        for num in range(1, 3): 
            await hw_api.aspirate(mount = mount,
                                volume = 20,
                                rate=1.0)
            input("Press Enter")
            # Retract from source well
            retract_point = Point(x = current_position[Axis.X], 
                                    y = current_position[Axis.Y],
                                    z = z_position + offset)
            await hw_api.move_to(mount = mount,
                                abs_position = retract_point,
                                speed= None,
                                critical_point=cp)
            # Move to next well
            move_to_next = Point(x = current_position[Axis.X], 
                                    y = current_position[Axis.Y] + 9,
                                    z = z_position + offset)
            await hw_api.move_to(mount = mount,
                                abs_position = move_to_next,
                                speed= None,
                                critical_point=cp)
            # Dispense to next well
            dispense_pos = Point(x = current_position[Axis.X], 
                            y = current_position[Axis.Y] + 9,
                            z = z_position + bottom_offset)
            await hw_api.move_to(mount = mount,
                                abs_position = dispense_pos,
                                speed= None,
                                critical_point=cp)
            await hw_api.dispense(mount = mount,
                                  volume=20+instr.current_volume,
                                  is_full_dispense = True)
            # Retact from destination well
            await hw_api.move_to(mount = mount,
                                abs_position = move_to_next,
                                speed= None,
                                critical_point=cp)
            # Move to Source Well
            retract_point = Point(x = current_position[Axis.X], 
                                    y = current_position[Axis.Y],
                                    z = z_position + offset)
            await hw_api.move_to(mount = mount,
                                abs_position = retract_point,
                                speed= None,
                                critical_point=cp)
            await hw_api.prepare_for_aspirate(mount)
            # Aspirate 
            aspirate_pos = Point(x = current_position[Axis.X], 
                                    y = current_position[Axis.Y],
                                    z = z_position + bottom_offset)
            await hw_api.move_to(mount = mount,
                                abs_position = aspirate_pos,
                                speed= None,
                                critical_point=cp)
            

            


    except Exception as e:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        raise("Error: {e}")
    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        raise("Error: {e}")
    finally:
        await hw_api.home()
        await hw_api.clean_up()    

if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--measure_nozzles", action="store_true")
    parser.add_argument("--columns", action="store_true")
    parser.add_argument("--num_cols", type=float, default=1)
    parser.add_argument("--rows", action="store_true")
    parser.add_argument("--num_rows", type=float, default=1)
    parser.add_argument("--tip_size", type=str, default="T50", help="Tip Size")
    parser.add_argument("--nozzles", type=int, default=1)
    parser.add_argument("--press_comp", type=float, default = 0.0)
    parser.add_argument("--pipette", type=int, choices=[50, 200, 1000], default=50)
    parser.add_argument("--method", type=str, choices=["one", "eight", "every"], default="every")
    parser.add_argument("--pressure_threshold", type=int, default=1000)
    parser.add_argument(
        "--dial_port", type=str, default="/dev/ttyUSB1", help="Dial indicator Port"
    )
    args = parser.parse_args()
    path = '/data/testing_data/'
    cal_fn = 'calibrations.json'
    if args.calibrate:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
            print(deck_slot)
    else:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
    tip_length = {"T1K": 95.6, "T200": 58.35, "T50": 57.9}
    tip_overlap = {"T1K": 9.651, "T200": 9.759, "T50": 10.088}
    tip_overlap = tip_overlap[args.tip_size]
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)

    _config = TestConfig(simulate=args.simulate, pipette=args.pipette)

    asyncio.run(_main(args, _config))
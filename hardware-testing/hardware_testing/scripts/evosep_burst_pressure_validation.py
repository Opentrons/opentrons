"""Test Plunger."""
import os
import time
import enum
import argparse
import csv
import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Tuple, Dict, Literal, Callable
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Axis, OT3Mount
from hardware_testing.drivers.honeywell_pressure_sensor import honeywell_pressure_driver

class TestSection(enum.Enum):
    """Test Section."""

    PLUNGER = "PLUNGER"

@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    pipette: Literal[200, 1000]

PLUNGER_MAX_SKIP_MM = 0.1
SPEEDS_TO_TEST: float= 25
CURRENTS_SPEEDS: Dict[float, float] = {
    0.7: SPEEDS_TO_TEST,
}
async def _is_plunger_still_aligned_with_encoder(
    api: OT3API,
) -> Tuple[float, float, bool]:
    enc_pos = await api.encoder_current_position_ot3(OT3Mount.LEFT)
    motor_pos = await api.current_position_ot3(OT3Mount.LEFT)
    p_enc = enc_pos[Axis.P_L]
    p_est = motor_pos[Axis.P_L]
    is_aligned = abs(p_est - p_enc) < PLUNGER_MAX_SKIP_MM
    return p_enc, p_est, is_aligned

async def read_pressure_sensor(p_sensor, test_time, cycle, volume) -> None:
    """Read Pressure Sensor."""
    p_time = time.time()
    global pipette_action
    pipette_action = True
    global test_state
    today = datetime.now().strftime("%m-%d-%y_%H-%M")
    with open(f'burst_pressure_test_{volume}_{cycle}_{today}.csv', 'w', newline='') as csvfile:
        test_data = {'Time(s)': None, 'Pressure(Pa)': None, 'State': None, 'Error': None}
        writer = csv.DictWriter(csvfile, test_data)
        writer.writeheader()
        try:
            while test_time > (time.time() - p_time):
                pressure = await p_sensor.start_reading()
                test_data['Time(s)'] = (time.time() - p_time)
                test_data['Pressure(Pa)'] = pressure
                test_data['State'] = test_state
                writer.writerow({'Time(s)': time.time() - p_time,
                                 'Pressure(Pa)': pressure,
                                 'State': test_state})
                print(test_data)
                csvfile.flush()
        except Exception as e:
            writer['Error'] = str(e)
            csvfile.flush()
            raise Exception(f'Error in pressure sensor function: {e}')
        
async def plunger_test():
    """Plunger Test."""""
    pass



async def main(args, cfg ) -> None:
    """Run."""
    folder_path = "/data/evosep_burst_pressure_test"  # Replace with the desired folder path
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"Folder '{folder_path}' created.")
    else:
        print(f"Folder '{folder_path}' already exists.")
    pipette_string = "p1000_96_v3.4" if cfg.pipette == 1000 else "p200_96_v3.0"
    pressure_sensor = honeywell_pressure_driver.HoneywellPressureDriver()
    await pressure_sensor.connect()
    await pressure_sensor.zero_gauge()
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left=pipette_string,
        stall_detection_enable=False,
    )
    ax = Axis.P_L
    mount = OT3Mount.LEFT
    # settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
    # settings.max_speed = 10
    # settings.acceleration = 30
    # settings.run_current = 0.8
    # default_current = settings.run_current
    # default_speed = settings.max_speed
    # default_acceleration = 100
    test_time = 60
    volume_tested = args.volume
    total_volume = 1000
    test_rate = 2.0
    top, bottom, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    # print(f"Settings: {settings}")
    async def position_check() -> bool:
        est, enc, aligned = await _is_plunger_still_aligned_with_encoder(api)
        print(f"Estimate: {est}, Encoder: {enc}, Aligned: {aligned}")
        return aligned
    await api.cache_instruments()
    await api.home()
    await api.home_plunger(OT3Mount.LEFT)
    home_pos = await api.gantry_position(OT3Mount.LEFT)
    api.add_tip(OT3Mount.LEFT, 95.7)
    # ~rate=2.0 is 20mm/s
    await api.prepare_for_aspirate(OT3Mount.LEFT)
    aspirate_and_dispense_spec = api._pipette_handler.plan_check_aspirate(
        mount = OT3Mount.LEFT,
        volume = volume_tested,
        rate= test_rate,
    )
    print(f'Aspirate/Dispense Spec: {aspirate_and_dispense_spec}')
    today = datetime.now().strftime("%m-%d-%y_%H-%M")
    with open(f'/data/evosep_burst_pressure_test/P1H_burst_pressure_test_{today}.csv', 'w', newline='') as csvfile:
        test_data = {'time(s)': None, 
                     'cycle': None, 
                     'stall': None, 
                     'position': None,
                     'position_check': None,
                     'Error': None}
        writer = csv.DictWriter(csvfile, test_data)
        writer.writeheader()
        start_time = time.time()
        try:
            for cycle in range(1, args.cycles+1):
                print(f'Cycle: {cycle}')
                print(f"moving up {1000} uL at {aspirate_and_dispense_spec.speed} mm/s")
                position_checked = await position_check()
                print(f"position checked: {position_checked}")
                if cycle == 1:
                    await api.aspirate(OT3Mount.LEFT, total_volume)
                    input("Install pressure sensor and press Enter to continue...")
                    # await pressure_sensor.zero_gauge()
                    global test_state
                    test_state = f'Aspirate Position {total_volume}uL'
                    await read_pressure_sensor(pressure_sensor, test_time, cycle, volume_tested)
                else:
                    await api.prepare_for_aspirate(OT3Mount.LEFT)
                    await api.aspirate(OT3Mount.LEFT, volume_tested)
                if cycle % 50 == 0:
                    # input("Install pressure sensor and press Enter to continue...")
                    global pipette_action
                    await read_pressure_sensor(pressure_sensor, test_time, cycle, volume_tested)
                try:
                    down_passed = await position_check()
                    test_data['time(s)'] = time.time() - start_time
                    test_data['cycle'] = cycle
                    test_data['position'] = 'bottom'
                    test_data['position_check'] = down_passed
                    test_data['stall'] = 'NONE'
                    print(test_data)
                    writer.writerow(test_data)
                    csvfile.flush()
                except Exception as e:
                    print('STALL DETECTION')
                    down_passed = await position_check()
                    test_data['position_check'] = down_passed
                    test_data['stall'] = str('Failed to move plunger down')
                    test_data['Error'] = str(e)
                    print(test_data)
                    writer.writerow(test_data)
                    csvfile.flush()
                print(f"moving to dispense")
                position_checked = await position_check()
                print(f"position checked: {position_checked}")
                try:
                    await api.dispense(OT3Mount.LEFT, volume_tested, rate=test_rate)
                    if cycle == 1:
                        input("press Enter to continue...")
                        test_state = f'Dispense Position {volume_tested}uL'
                        await read_pressure_sensor(pressure_sensor, test_time, cycle, volume_tested)
                    up_passed = await position_check()
                    test_data['time(s)'] = time.time() - start_time
                    test_data['cycle'] = cycle
                    test_data['position'] = 'top'
                    test_data['position_check'] = up_passed
                    print(test_data)
                    writer.writerow(test_data)
                    test_data['stall'] = 'NONE'
                    csvfile.flush()
                except Exception as e:
                    print('STALL DETECTION')
                    up_passed = await position_check()
                    test_data['stall'] = str('Failed to move plunger down')
                    test_data['position_check'] = up_passed
                    test_data['Error'] = str(e)
                    print(test_data)
                    writer.writerow(test_data)
                    csvfile.flush()
                if cycle % 50 == 0:
                    # input("Install pressure sensor and press Enter to continue...")
                    global pipette_action
                    await read_pressure_sensor(pressure_sensor, test_time, cycle, volume_tested)
        except Exception as e:
            writer['Error'] = str(e)
            writer.writerow(test_data)
            csvfile.flush()
            raise Exception(f"Error StallDetection: {e}")
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=500)
    parser.add_argument("--volume", type=int, default=500)
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=1000)
    args = parser.parse_args()
    _config = TestConfig(
        simulate=args.simulate, tests=['PLUNGER'], pipette=args.pipette
    )
    asyncio.run(main(args, _config))
        

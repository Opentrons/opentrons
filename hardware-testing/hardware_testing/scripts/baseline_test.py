from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.drivers.honeywell_pressure_sensor import honeywell_pressure_driver
from hardware_testing.opentrons_api.types import Axis, OT3Mount
from opentrons_hardware.firmware_bindings.constants import SensorId
import asyncio
import argparse
from dataclasses import dataclass
from typing import Tuple, Dict, Literal, Callable
import enum
import time
from datetime import datetime
import csv

class TestSection(enum.Enum):
    """Test Section."""

    PLUNGER = "PLUNGER"

@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    pipette: Literal[200, 1000]

async def main(args, cfg ) -> None:
    """Run."""
    pipette_string = "p1000_96_v3.4" if cfg.pipette == 1000 else "p200_96_v3.0"
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False,
        pipette_left=pipette_string,
        stall_detection_enable=False,
    )
    ax = Axis.P_L
    mount = OT3Mount.LEFT
    await api.cache_instruments()
    await api.home()
    await api.home_plunger(OT3Mount.LEFT)
    api.add_tip(OT3Mount.LEFT, 95.7)
    await api.prepare_for_aspirate(OT3Mount.LEFT)

    input("Install a tip on the pipette and press Enter to continue...")
    p_time = time.time()
    test_time = 120
    today  = datetime.now().strftime("%m-%d-%y_%H-%M")
    test_state = "Baseline Test"
    test_data = {'Time(s)': None, 'Pressure(Pa)': None, 'State': None, 'Error': None}
    with open(f'baseline_test_{cfg.pipette}_{today}.csv', 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, test_data)
        writer.writeheader()
        try:
            await api.aspirate(OT3Mount.LEFT, 1000)
            while test_time > (time.time() - p_time):
                pressure = await helpers_ot3.get_pressure_ot3(api, OT3Mount.LEFT,SensorId.S0)
                test_data['Time(s)'] = (time.time() - p_time)
                test_data['Pressure(Pa)'] = pressure
                test_data['State'] = test_state
                writer.writerow({'Time(s)': time.time() - p_time,
                                 'Pressure(Pa)': pressure,
                                 'State': test_state})
                csvfile.flush()
                print(test_data)
        except Exception as e:
            test_data['Error'] = str(e)
            writer.writerow(test_data)
            csvfile.flush()
            print(f"Error: {e}")
            raise Exception(f"Error in pressure sensor function: {e}")
        
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=50)
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=1000)
    args = parser.parse_args()
    _config = TestConfig(
        simulate=args.simulate, tests=['PLUNGER'], pipette=args.pipette
    )
    asyncio.run(main(args, _config))
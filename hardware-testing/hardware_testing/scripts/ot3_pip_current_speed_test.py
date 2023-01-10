"""OT3 Pipette Current and Speed Test."""
""" WORK IN PROGRESS """
import argparse
import asyncio
import os, time, random, sys

from datetime import datetime
from typing import Any, Dict, Union, List, Optional, Tuple
import serial
# Opentrons Libraries
from opentrons.config import pipette_config
from opentrons.hardware_control import *
from opentrons.hardware_control.types import Axis, CriticalPoint
from opentrons import types as top_types

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis

from hardware_testing import data
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
)

CYCLES = 10

# mounts = {"left": "ZB", "right": "AC"}
Current_list = [0.5, 0.4, 0.25, 0.2, 0.1]

Current_dic = {
    'p1000_single_v3.1': [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2],
    'p1000_multi_v3.1': [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2],
    'p50_single_v3.1': [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2],
    'p50_multi_v3.1': [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2]
}
# Maybe we can change ths parameter to perform more speeds
move_speed = 30

sus_str = "----_----"

Tolerances = {
    'p50_single_v3.1': 0.4,
    'p50_multi_v3.1': 0.4,
    'p1000_single_v3.1': 0.4,
    'p1000_multi_v3.1': 0.4
}


data_format = "||{0:^12}|{1:^12}|{2:^12}||"

async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating, use_defaults=True)

    while True:
        try:
            await api.cache_instruments()
            pipettes_attached = api.get_attached_pipette(MOUNT)
            print(pipettes_attached)
            api.home_plunger(MOUNT)
            D = datetime.now().strftime("%Y-%m-%d")
            T = datetime.now().strftime('%H:%M')
            res = input("\n    Enter 'q' to exit")
            if res == "q":
                break

            pip_info = api.get_attached_pipette(MOUNT)
            pipette_model = pip_info['model']
            version = pipette_model[-3:]
            if 'p1000' in pipette_model:
                if 'single' in pipette_model:
                    pipette = 'P1KS'
                    SN = pipette + 'V' + version.replace('.', '')  + pip_info['pipette_id']
                else:
                    pipette = 'P1KM'
                    SN = pipette + 'V' + version.replace('.', '') + pip_info['pipette_id']
            elif 'p50' in pipette_model:
                if 'single' in pipette_model:
                    pipette = 'P50S'
                    SN = pipette + 'V' + version.replace('.', '')  + pip_info['pipette_id']
                else:
                    pipette = 'P50M'
                    SN = pipette + 'V' + version.replace('.', '') + pip_info['pipette_id']

            pip_config = pipette_config.load(pipette_model)

            drop_tip_pos = pip_config.drop_tip
            bottom_pos = pip_config.bottom
            home_pos = pip_config.top
            plunger_current = pip_config.plunger_current
            point = home_pos
            results = {}
            for i in Current_dic[pipette_model]:
                results["{}A".format(i)] = sus_str

            for current in Current_dic[pipette_model]:
                print("    Current test current is {}".format(current))
                print(Current_dic[pipette_model])
                await home_ot3(api, [PLUNGER]) ### pipette_home(mounts[mount])
                print(point - 10)
                move_plunger_absolute_ot3(api, MOUNT, point - 10, current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], point - 10, speed=move_speed, current=plunger_current)
                try:
                    for t in range(1, CYCLES+1):
                        move_plunger_absolute_ot3(api, MOUNT, drop_tip_pos, current=current, speed=move_speed) ### move_plunger(mounts[mount], drop_tip_pos, speed=move_speed, current=current)
                        move_plunger_absolute_ot3(api, MOUNT, point, current=current, speed=move_speed) ### move_plunger(mounts[mount], point, speed=move_speed, current=current)
                except Exception as e: ### except SmoothieError as e:
                    print(e)
                    results["{}A".format(current)] = "Fail_Stuck"
                    ### robot._smoothie_reset() # not sure what the OT3 equivalent would be/if it is even needed
                    break

                move_plunger_absolute_ot3(api, MOUNT, drop_tip_pos, current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], drop_tip_pos, speed=move_speed, current=plunger_current)

                try:
                    print("    moving to ", point - Tolerances[pipette_model])
                    move_plunger_absolute_ot3(api, MOUNT, point - Tolerances[pipette_model], current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], point - Tolerances[pipette_model], speed=move_speed, current=plunger_current)
                except Exception as e: ### except SmoothieError as e:
                    results["{}A".format(current)] = "Fail_Lose Step"
                    ### robot._smoothie_reset() # not sure what the OT3 equivalent would be/if it is even needed
                    break

                move_plunger_absolute_ot3(api, MOUNT, drop_tip_pos, current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], drop_tip_pos, speed=move_speed, current=plunger_current)

                try:
                    print("    moving to ",point + Tolerances[pipette_model])
                    move_plunger_absolute_ot3(api, MOUNT, point + Tolerances[pipette_model], current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], point + Tolerances[pipette_model], speed=move_speed, current=plunger_current)
                except Exception as e: ### except SmoothieError as e:
                    ### robot._smoothie_reset()
                else:
                    results["{}A".format(current)] = "Fail_Lose Step"
                    break

                if sus_str is results["{}A".format(current)]:
                    results["{}A".format(current)] = "Pass_ ----"

            try:
                print(data_format.format("Type", "result", "reason"))
                for i in results:
                    result = results[i].split("_")[0]
                    reason = results[i].split("_")[1]
                    print(data_format.format(i, result, reason))
            except IndexError:
                pass
            with open('{}.csv'.format(D), 'a', newline='') as f:
                writer = csv.writer(f, delimiter=',', quoting=csv.QUOTE_NONE)
                li = []
                for i in results:
                    li.append(i)
                    li.append(results[i].split("_")[0])
                    li.append(results[i].split("_")[1])
                writer.writerow([pipette, "V"+version, SN,D,T]+li)
                await home_ot3(api, [PLUNGER]) ### pipette_home(mounts[mount])
                move_plunger_absolute_ot3(api, MOUNT, bottom_pos, current=plunger_current, speed=move_speed) ### move_plunger(mounts[mount], pip_config.bottom, speed=move_speed, current=plunger_current)

        except TypeError:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--mount", "-m", type=str, required=False, default="right")
    args = parser.parse_args()

    CYCLES = args.cycles
    if args.mount == "right":
        MOUNT = OT3Mount.RIGHT
        PLUNGER = OT3Axis.P_R
    else:
        MOUNT = OT3Mount.LEFT
        PLUNGER = OT3Axis.P_L

    asyncio.run(_main(args.simulate))

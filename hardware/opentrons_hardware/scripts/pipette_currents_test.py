import os
import argparse
import asyncio
import json
import logging
from logging.config import dictConfig
from typing import Dict, Tuple
import subprocess

from opentrons.config import pipette_config

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import build, CanMessenger,  WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)
from opentrons_hardware.firmware_bindings.constants import NodeId,PipetteName

from opentrons_hardware.hardware_control.current_settings import set_currents


from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    MoveStopCondition,
    create_home_step,
)

from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from opentrons_hardware.drivers.gpio import OT3GPIO


Current_dic = {
    'p1000_single_v3.3':[0.6, 0.5,0.4, 0.3, 0.2,0.15,0.1,0.05],
    'p50_single_v4.3':[0.6, 0.5,0.4, 0.3, 0.2,0.15,0.1,0.05],

    'p1000_multi_v3.3':[0.6, 0.5,0.4, 0.3, 0.2,0.15,0.1,0.05],
    'p50_multi_v3.3':[0.6, 0.5,0.4, 0.3, 0.2,0.15,0.1,0.05]
}
Tolerances = {
    'p1000_single_v3.3':0.4,
    'p50_single_v4.3':0.4,
    'p1000_multi_v3.3':0.4,
    'p50_multi_v3.3':0.4

}

CYCLES = 10
move_speed = 30
sus_str = "----_----"

async def set_pipette_current(run_current) -> None:

    currents: Dict[NodeId, Tuple[float, float]] = {}
    currents[NodeId.pipette_left] = (float(0), float(run_current))

    async with build.can_messenger(build_settings(args)) as messenger:
        try:
            await set_currents(messenger, currents)
        except asyncio.CancelledError:
            pass
async def home(messenger, node):
    home_runner = MoveGroupRunner(
        move_groups=[
            [
                create_home_step(
                    {node: float64(100.0)},
                    {node: float64(-5)}
                )
            ]
        ]
    )
    await home_runner.run(can_messenger = messenger)

async def move_to(messenger: CanMessenger, node, distance, velocity):
    move_runner = MoveGroupRunner(
        # Group 0
        move_groups=[
            [
                {
                    node: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict= await move_runner.run(can_messenger = messenger)
    return axis_dict

def determine_abbreviation(pipette_name):
    if pipette_name == 'p1000_single':
        return 'P1KS'
    elif pipette_name == 'p1000_multi':
        return 'P1KM'
    elif pipette_name == 'p50_single':
        return 'P50S'
    elif pipette_name == 'p50_multi':
        return 'P50M'
    elif pipette_name == 'P1000_96':
        return 'P1KH'
    else:
        raise('Unknown Pipette')

async def read_epprom(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = PipetteName(message.payload.name.value).name
                pipette_version = str(message.payload.model.value)
                serial_number = determine_abbreviation(pipette_name) + \
                            pipette_version + \
                            str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return serial_number
    except asyncio.TimeoutError:
        pass

async def get_pipette_model(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = PipetteName(message.payload.name.value).name
                pipette_version = str(message.payload.model.value)
                pipette_model = '{}_{}'.format(pipette_name,pipette_version)
                # serial_number = determine_abbreviation(pipette_name) + \
                #             pipette_version + \
                #             str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return pipette_model
    except asyncio.TimeoutError:
        pass

def main() -> None:
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    position = {'pipette': 0}
    node = NodeId.pipette_left
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()

    print('-----------------Read EPPROM--------------')
    serial_number = await read_epprom(messenger, node)
    print(f'SN: {serial_number}')

    print('-----------------Get pipette model--------------')
    pipette_model = await get_pipette_model(messenger, node)
    print(f'Model: {pipette_model}')

    print('-------------------Test Homing--------------------------')
    await home(messenger, node)
    print('Homed')
    while True:
        try:
            D = datetime.now().strftime("%Y-%m-%d")
            T = datetime.now().strftime('%H:%M')
            res = input("\n    Enter 'q' to exit")
            if res == "q":
                break

            results = {}
            for i in Current_dic[pipette_model]:
                results["{}A".format(i)] = sus_str

            for current in Current_dic[pipette_model]:
                await set_pipette_current(current)
                print("    Current test current is {}".format(current))
                print(Current_dic[pipette_model])
                await move_to(messenger, node, 10, move_speed)
                try:
                    for t in range(1, CYCLES + 1):
                        await move_to(messenger, node, 60, move_speed)
                        await move_to(messenger, node, 60, -move_speed)
                except Exception as e:
                    print(e)
                    results["{}A".format(current)] = "Fail_Stuck"
                    break

                try:
                    print("    moving to ", Tolerances[pipette_model])
                    step = 60 - Tolerances[pipette_model]
                    await move_to(messenger, node, step, move_speed)
                except Exception as e:
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
            # with open('{}.csv'.format(D), 'a', newline='') as f:
            #     writer = csv.writer(f, delimiter=',', quoting=csv.QUOTE_NONE)
            #     li = []
            #     for i in results:
            #         li.append(i)
            #         li.append(results[i].split("_")[0])
            #         li.append(results[i].split("_")[1])
            #     writer.writerow([pipette, "V" + version, SN, D, T] + li)

        except:
            pass




if __name__ == "__main__":
    main()
"""Plunger overshoot."""
import argparse
from asyncio import run, sleep as async_sleep
from contextlib import asynccontextmanager
from random import random
from threading import Thread, Event
import time
from typing import Optional, AsyncIterator

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing import data
from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
    Mitutoyo_Digimatic_Indicator,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.data import ui


CSV_HEADER = "time\tdial-still\tdial-moving\tplunger-still\tplunger-moving"
TEST_NAME = "plunger-overshoot"
RUN_ID = ""
PIP_SN = ""

MNT = OT3Mount.LEFT
DIAL_THREAD = Optional[Thread]
DIAL_THREAD_RUNNING = Event()

DIAL_INDICATOR_READ_SECONDS = 0.05

ZERO_ON_NEXT_WRITE = False

SPEED = 5.0
MAX_DIST_MM = 5.0

PLUNGER_POS: float = 0.0
DIAL_ZERO_POS: float = 0.0
MOVING: bool = False


def _dial_thread(simulate: bool, csv_file_name: str) -> None:
    global ZERO_ON_NEXT_WRITE
    dial: Optional[Mitutoyo_Digimatic_Indicator] = None
    if not simulate:
        dial = Mitutoyo_Digimatic_Indicator(list_ports_and_select("dial-indicator"))
        dial.connect()
    DIAL_THREAD_RUNNING.set()  # set the flag
    start_timestamp = time.time()
    read_timestamp = start_timestamp
    dial_zero = 0.0
    plunger_zero = 0.0
    data_buffer = []
    while DIAL_THREAD_RUNNING.is_set():  # continue until flag is cleared
        time.sleep(0.01)  # give time to main thread
        if read_timestamp + DIAL_INDICATOR_READ_SECONDS < time.time():
            read_timestamp = time.time()
            if simulate:
                dial_pos = random()
            else:
                dial_pos = dial.read()
            if ZERO_ON_NEXT_WRITE:
                ZERO_ON_NEXT_WRITE = False
                dial_zero = dial_pos
                plunger_zero = PLUNGER_POS
            plunger_pos_zeroed = round(PLUNGER_POS - plunger_zero, 3) * -1
            dial_pos_zeroed = round(dial_pos - dial_zero, 3)
            t = read_timestamp - start_timestamp
            if MOVING:
                new_data_line = f"{t}\t\t{dial_pos_zeroed}\t\t{plunger_pos_zeroed}"
            else:
                new_data_line = f"{t}\t{dial_pos_zeroed}\t\t{plunger_pos_zeroed}\t"
            data_buffer.append(new_data_line)
        if len(data_buffer) > 100:
            lines_str = "\n".join(data_buffer)
            data.append_data_to_file(TEST_NAME, RUN_ID, csv_file_name, f"{lines_str}\n")
            data_buffer = []


def _start_indicator_thread(simulate: bool, csv_file_name: str) -> None:
    global DIAL_THREAD
    DIAL_THREAD = Thread(target=_dial_thread, args=[simulate, csv_file_name])
    DIAL_THREAD_RUNNING.clear()
    DIAL_THREAD.start()
    DIAL_THREAD_RUNNING.wait(timeout=60)  # wait for thread to set the flag


def _stop_indicator_thread() -> None:
    if DIAL_THREAD_RUNNING.is_set():
        DIAL_THREAD_RUNNING.clear()  # clear the flag
        DIAL_THREAD.join()  # wait for thread to complete


def _zero_indicator_and_plunger() -> None:
    global ZERO_ON_NEXT_WRITE
    ZERO_ON_NEXT_WRITE = True
    time.sleep(1)


@asynccontextmanager
async def _set_move_flags(simulate: bool) -> AsyncIterator[None]:
    global MOVING
    MOVING = True
    try:
        yield
        if simulate:
            await async_sleep(0.5)  # allow data to accumulate in the CSV
    finally:
        MOVING = False


async def _run_test_loop(api: OT3API) -> None:
    global PLUNGER_POS
    overshoot = 0.0
    bottom = api.hardware_pipettes[MNT.to_mount()].plunger_positions.bottom
    min_pos = bottom - MAX_DIST_MM
    max_pos = bottom + MAX_DIST_MM
    prev_inp = ""
    while True:
        inp_str = input("enter command, or ENTER to repeat: ")
        if not inp_str:
            inp_str = prev_inp
        prev_inp = inp_str
        inputs = [i for i in inp_str.strip().lower().split(" ") if i]
        for inp in inputs:
            if inp == "p":
                async with _set_move_flags(api.is_simulator):
                    await api._move_to_plunger_bottom(MNT, rate=1.0)
                    PLUNGER_POS = bottom
            elif inp == "z":
                _zero_indicator_and_plunger()
            elif inp[0] == "o":
                try:
                    overshoot = float(inp[1:])
                    assert 0 <= overshoot <= 1
                    print("new overshoot value:", overshoot)
                except ValueError as e:
                    print(e)
            elif inp[0] == "d":
                try:
                    time.sleep(float(inp[1:]))
                except ValueError as e:
                    print(e)
            elif inp[0] in ["j", "a"]:
                cmd = inp[0]
                try:
                    delta = float(inp[1:]) * -1.0  # UP is negative
                    if cmd == "a":
                        pip = api.hardware_pipettes[MNT.to_mount()]
                        delta = delta / pip.ul_per_mm(delta, "aspirate")
                    new_pos = max(min(PLUNGER_POS + delta, max_pos), min_pos)
                    use_overshoot = new_pos < PLUNGER_POS  # if closer to endstop (up)

                    async def _run_move() -> None:
                        global PLUNGER_POS
                        if use_overshoot and overshoot > 0:
                            print("Overshoot:", round(new_pos + overshoot, 3))
                            await helpers_ot3.move_plunger_absolute_ot3(
                                api, MNT, new_pos - overshoot, speed=SPEED
                            )
                        print("Plunger:", round(new_pos, 3))
                        await helpers_ot3.move_plunger_absolute_ot3(
                            api, MNT, new_pos, speed=SPEED
                        )
                        PLUNGER_POS = new_pos

                    async with _set_move_flags(api.is_simulator):
                        if cmd == "a":
                            async with api.restore_system_constrants():
                                await api.set_system_constraints_for_plunger_acceleration(
                                    MNT, (16000.0 / 15.904)
                                )
                                await _run_move()
                        else:
                            await _run_move()
                except ValueError as e:
                    print(e)


async def _main(simulate: bool):
    global PIP_SN, PLUNGER_POS

    # create OT3API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, pipette_left="p1000_96_v3.5"
    )
    pip = api.hardware_pipettes[MNT.to_mount()]
    await api.add_tip(MNT, 60)
    pip.working_volume = 50  # 50ul tip
    api.set_pipette_speed(MNT, aspirate=SPEED, dispense=SPEED, blow_out=SPEED)

    # very carefully home
    if ui.get_user_answer("home plunger"):
        if ui.get_user_answer("are you SURE you want to HOME?"):
            if ui.get_user_answer("did you REMOVE the DIAL-INDICATOR?"):
                if ui.get_user_answer("ready (last chance!)?"):
                    async with _set_move_flags(simulate):
                        await api.home_plunger(MNT)
                        PLUNGER_POS = pip.plunger_positions.bottom

    # create CSV file
    PIP_SN = helpers_ot3.get_pipette_serial_ot3(pip)
    csv = data.create_file_name(TEST_NAME, RUN_ID, f"{PIP_SN}")
    data.dump_data_to_file(TEST_NAME, RUN_ID, csv, f"{CSV_HEADER}\n")

    # start thread which reads from dial-indicator in a loop
    # while this thread continues on to running a basic UI for jogging
    if not simulate:
        ui.get_user_ready("install dial-indicator and connect to OT3")
    try:
        _start_indicator_thread(simulate, csv)
        await _run_test_loop(api)
    finally:
        _stop_indicator_thread()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    RUN_ID = data.create_run_id()
    run(_main(args.simulate))

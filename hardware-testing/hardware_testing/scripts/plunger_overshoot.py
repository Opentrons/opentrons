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


CSV_HEADER = "time,dial,plunger,moving"
TEST_NAME = "plunger-overshoot"
RUN_ID = ""
PIP_SN = ""

MNT = OT3Mount.LEFT
DIAL_THREAD = Optional[Thread]
DIAL_THREAD_RUNNING = Event()

DIAL_INDICATOR_READ_SECONDS = 0.1

SPEED = 5.0
MAX_DIST_MM = 5.0

PLUNGER_POS: float = 0.0
PLUNGER_ZERO_POS: float = 0.0
MOVING: bool = False


def _dial_thread(simulate: bool, csv_file_name: str) -> None:
    dial: Optional[Mitutoyo_Digimatic_Indicator] = None
    if not simulate:
        dial = Mitutoyo_Digimatic_Indicator(list_ports_and_select("dial-indicator"))
        dial.connect()
    DIAL_THREAD_RUNNING.set()  # set the flag
    read_timestamp = time.time()
    while DIAL_THREAD_RUNNING.is_set():  # continue until flag is cleared
        time.sleep(0.01)  # give time to main thread
        if read_timestamp + DIAL_INDICATOR_READ_SECONDS < time.time():
            read_timestamp = time.time()
            if simulate:
                dial_value = random()
            else:
                dial_value = dial.read()
            pos = PLUNGER_POS - PLUNGER_ZERO_POS
            new_data_line = f"{read_timestamp}.{dial_value},{pos},{MOVING}"
            data.append_data_to_file(
                TEST_NAME, RUN_ID, csv_file_name, f"{new_data_line}\n"
            )


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


def _zero_indicator() -> None:
    global PLUNGER_ZERO_POS
    PLUNGER_ZERO_POS = PLUNGER_POS


@asynccontextmanager
async def _set_move_flags(new_pos: float, simulate: bool) -> AsyncIterator[None]:
    global MOVING, PLUNGER_POS
    MOVING = True
    PLUNGER_POS = new_pos
    try:
        yield
        if simulate:
            await async_sleep(0.5)  # allow data to accumulate in the CSV
    finally:
        MOVING = False


async def _run_test_loop(api: OT3API) -> None:
    bottom = api.hardware_pipettes[MNT.to_mount()].plunger_positions.bottom
    min_pos = bottom - MAX_DIST_MM
    max_pos = bottom + MAX_DIST_MM
    prev_inp = ""
    while True:
        inp = input("p=PREP, number=JOG, z=ZERO, enter=REPEAT: ").strip().lower()
        if not inp:
            inp = prev_inp
        prev_inp = inp
        if inp == "p":
            await api._move_to_plunger_bottom(MNT, rate=1.0)
        elif inp == "z":
            _zero_indicator()
        else:
            try:
                delta = float(inp)
                new_pos = max(min(PLUNGER_POS + delta, max_pos), min_pos)
                async with _set_move_flags(new_pos, api.is_simulator):
                    await helpers_ot3.move_plunger_absolute_ot3(
                        api, MNT, new_pos, speed=SPEED
                    )
            except ValueError as e:
                print(e)


async def _main(simulate: bool):
    global PIP_SN
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, pipette_left="p1000_96_v3.5"
    )
    pip = api.hardware_pipettes[MNT.to_mount()]
    await api.add_tip(MNT, 60)
    api.set_pipette_speed(MNT, aspirate=SPEED, dispense=SPEED, blow_out=SPEED)
    if ui.get_user_answer("home plunger"):
        async with _set_move_flags(pip.plunger_positions.bottom, simulate):
            await api.home_plunger(MNT)
    PIP_SN = helpers_ot3.get_pipette_serial_ot3(pip)
    csv = data.create_file_name(TEST_NAME, RUN_ID, f"{PIP_SN}")
    data.dump_data_to_file(TEST_NAME, RUN_ID, csv, f"{CSV_HEADER}\n")

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

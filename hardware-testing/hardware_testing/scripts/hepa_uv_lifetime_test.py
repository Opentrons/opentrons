"""This is the life-time testing script for the Hepa/UV module."""

import asyncio
import argparse
import datetime

from typing import Optional

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import (
    SubSystem,
    HepaFanState,
    HepaUVState,
)


# Default constants
DEFAULT_DUTY_CYCLE: int = 75
MAX_DUTY_CYCLE: int = 100
DEFAULT_UV_DOSAGE_DURATION: int = 900  # 15m
MAX_UV_DOSAGE = 60 * 60  # 1hr max dosage
DEFAULT_CYCLES = 1


async def _turn_off_hepa_uv(api: OT3API) -> None:
    """Set and Make sure that the Hepa fan and UV light are off."""

    print("Turning off Hepa fan.")
    await api.set_hepa_fan_state(turn_on=False, duty_cycle=0)
    hepa_fan_state: Optional[HepaFanState] = await api.get_hepa_fan_state()
    if hepa_fan_state:
        assert hepa_fan_state.fan_on == False, "Hepa Fan did not turn OFF!"
        assert hepa_fan_state.duty_cycle == 0, "Hepa Fan Duty cycle is not 0!"

    print("Turning off UV light.")
    await api.set_hepa_uv_state(turn_on=False, uv_duration_s=0)
    hepa_uv_state: Optional[HepaUVState] = await api.get_hepa_uv_state()
    if hepa_uv_state:
        assert hepa_uv_state.light_on == False, "Hepa UV did not turn OFF!"
        assert hepa_uv_state.uv_duration_s == 0, "Hepa UV dosage duration is not 0!"
        assert (
            hepa_uv_state.remaining_time_s == 0
        ), "Hepa UV remaining on time is not 0!"


async def run_hepa_fan(
    event: asyncio.Event, api, duty_cycle: int, on_time: int, off_time: int, cycles: int
) -> None:
    """Coroutine that will run the hepa fan."""

    fan_duty_cycle = max(min(0, duty_cycle), MAX_DUTY_CYCLE)
    fan_on_time = on_time * 60 if on_time > 0 else 0
    fan_off_time = off_time * 60 if off_time > 0 else 0
    run_forever = on_time == -1
    start_time = datetime.datetime.now()

    print(
        f"Hepa Task: Starting - duty_cycle={fan_duty_cycle}, "
        f"on_time={fan_on_time}(s), off_time={fan_off_time}(s), cycles={cycles}"
        f"run_forever: {run_forever}, start={start_time}"
    )

    fan_on: bool = False
    cycle: int = 0
    while not event.is_set():
        if not run_forever and cycle >= cycles:
            print(f"Fan Task: Reached target cycles={cycles}.")
            break

        # on time
        if not fan_on:
            fan_on = True
            print(f"Hepa Task: cycle number={cycle}")
            msg = "forever" if run_forever else f"for {fan_on_time} seconds"
            print(f"Hepa Fan Task: Turning on fan {msg}.")
            await api.set_hepa_fan_state(turn_on=True, duty_cycle=fan_duty_cycle)
            await asyncio.sleep(fan_on_time)

        # off time
        if fan_off_time:
            print(f"Hepa Task: Turning off fan for {fan_off_time} seconds.")
            await api.set_hepa_fan_state(turn_on=False, duty_cycle=0)
            fan_on = False

        # sleep and increment the cycle
        await asyncio.sleep(fan_off_time or 1)
        if not run_forever:
            cycles += 1

    print("Hepa Task: Finished - Turning off Fan ")
    await api.set_hepa_fan_state(turn_on=False, duty_cycle=0)

    elapsed_time = start_time - datetime.datetime.now()
    print(f"Hepa Task: Elapsed time={elapsed_time}")


async def run_hepa_uv(
    event: asyncio.Event, api: OT3API, on_time: int, off_time: int, cycles: int
) -> None:
    """Coroutine that will run the hepa uv light."""

    on_time_s = max(min(0, on_time), MAX_UV_DOSAGE) * 60
    off_time_s = off_time * 60
    start_time = datetime.datetime.now()

    print(
        f"Hepa UV Task: Starting - on_time={on_time_s}(s), "
        f"off_time={off_time_s}(s), cycles={cycles}, start={start_time}"
    )

    uv_light_on: bool = False
    cycle: int = 0
    while not event.is_set():
        if cycle >= cycles:
            print(f"Hepa UV Task: Reached target cycles={cycles}.")
            break

        # on time
        if not uv_light_on:
            uv_light_on = True
            print(f"Hepa UV Task: cycle number={cycle}")
            print(f"Turning on the UV Light for {on_time_s} seconds.")
            await api.set_hepa_uv_state(turn_on=True, uv_duration_s=on_time_s)
            await asyncio.sleep(on_time)

        # off time
        if off_time_s:
            print(f"Turning off the UV Light for {off_time_s} seconds.")
            await api.set_hepa_uv_state(turn_on=False, uv_duration_s=0)

        # Sleep and increment the cycle
        await asyncio.sleep(off_time or 1)
        cycles += 1

    print("UV Task: Finished - Turning off UV Light ")
    await api.set_hepa_uv_state(turn_on=False, uv_duration_s=0)

    elapsed_time = start_time - datetime.datetime.now()
    print(f"UV Task: Elapsed time={elapsed_time}")


async def _control_task(event: asyncio.Event) -> None:
    """This task is responsible for handling keyboard interrupts and such."""
    while True:
        try:
            await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("User keyboard interrupt!")
        except Exception:
            print("Unhandled exception!")
        finally:
            print("Setting control event True")
            event.set()
            break


async def _main(args: argparse.Namespace) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=args.is_simulating
    )

    # scan for subsystems
    await cast(OT3Controller, api._backend).probe_network()

    # Make sure we have a hepa/uv module
    assert SubSystem.hepa_uv in api.attached_subsystems, "No Hepa/UV module detected!"

    # Lets default the settings and make sure everything is off before we start testing
    await _turn_off_hepa_uv(api)

    # synchronization event
    event = asyncio.Event()

    # create coroutines
    control_coroutine = _control_task(event)
    hepa_fan_coroutine = run_hepa_fan(
        event, api, args.duty_cycle, args.fan_on_time, args.fan_off_time, args.cycles
    )
    hepa_uv_coroutine = run_hepa_uv(
        event, api, args.uv_on_time, args.uv_off_time, args.cycles
    )

    # start the tasks
    await asyncio.gather(control_coroutine, hepa_fan_coroutine, hepa_uv_coroutine)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Hepa/UV Life-Time Test",
        description="Program to test the lifetime of the Hepa/UV module.",
    )
    parser.add_argument(
        "--is_simulating",
        action="store_true",
        help="Whether this is a simulation or not.",
    )
    parser.add_argument(
        "--fan-duty-cycle",
        type=int,
        default=DEFAULT_DUTY_CYCLE,
        help="What the duty cycle of the hepa fan should be.",
    )
    parser.add_argument(
        "--fan-on-time",
        type=int,
        default=0,
        help="The time in minutes the fan should stay on for. "
        "0 turns off fan (default), -1 stays on indefinitely.",
    )
    parser.add_argument(
        "--fan-off-time",
        type=int,
        default=0,
        help="The time in minutes the fan should stay on for. " "ignored if not set",
    )
    parser.add_argument(
        "--uv-on-time",
        type=int,
        default=0,
        help="The time in minutes the UV light will be turned on for. "
        "0 turns off uv light (default), "
        f"The max value is {MAX_UV_DOSAGE} minutes.",
    )
    parser.add_argument(
        "--uv-off-time",
        type=int,
        default=0,
        help="The time in minutes the UV light will be turned off for. "
        "if 0 DONT turn off the uv light explictly but wait for "
        "the hepa/uv to turn off on its on based on --uv-on-time.",
    )
    parser.add_argument(
        "--cycles",
        type=int,
        default=DEFAULT_CYCLES,
        help="The number of cycles to run.",
    )

    args = parser.parse_args()
    try:
        asyncio.run(_main(args))
    except Exception as e:
        print(e)
    finally:
        print("Exiting.")

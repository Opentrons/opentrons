"""This is the life-time testing script for the Hepa/UV module."""

import asyncio
import argparse
import datetime
import logging
import logging.config
import subprocess

from typing import Any, Optional, Dict

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import (
    SubSystem,
    HepaFanState,
    HepaUVState,
    DoorState,
)


# Default constants
DEFAULT_DUTY_CYCLE: int = 75
MAX_DUTY_CYCLE: int = 100
DEFAULT_UV_DOSAGE_DURATION: int = 900  # 15m
MAX_UV_DOSAGE: int = 60 * 60  # 1hr max dosage
DEFAULT_CYCLES: int = 1


# Get the name of the robot
try:
    ROBOT_NAME = subprocess.check_output(["hostnamectl", "--pretty"]).decode().strip()
except Exception:
    ROBOT_NAME = "HepaLifetime"


log = logging.getLogger(ROBOT_NAME)


async def _turn_off_hepa_uv(api: OT3API) -> None:
    """Set and Make sure that the Hepa fan and UV light are off."""
    log.info("Turning off Hepa Fan and UV Light.")
    await api.set_hepa_uv_state(turn_on=False)
    await api.set_hepa_fan_state(turn_on=False)

    # Confirm that they are off
    hepa_uv_state: Optional[HepaUVState] = await api.get_hepa_uv_state()
    if hepa_uv_state:
        assert not hepa_uv_state.light_on, "Hepa UV did not turn OFF!"

    hepa_fan_state: Optional[HepaFanState] = await api.get_hepa_fan_state()
    if hepa_fan_state:
        assert not hepa_fan_state.fan_on, "Hepa Fan did not turn OFF!"


async def run_hepa_fan(
    api: OT3API,
    duty_cycle: int,
    on_time: int,
    off_time: int,
    cycles: int,
) -> Optional[Dict[str, Any]]:
    """Coroutine that will run the hepa fan."""
    fan_duty_cycle = max(0, min(duty_cycle, MAX_DUTY_CYCLE))
    fan_on_time = on_time if on_time > 0 else 0
    fan_off_time = off_time if off_time > 0 else 0
    run_forever = on_time == -1
    start_time = datetime.datetime.now()

    # Dont run task if there are no valid parameters
    if not fan_on_time and not fan_off_time and not run_forever:
        return None

    log.info(
        f"Hepa Task: Starting - duty_cycle={fan_duty_cycle}, "
        f"on_time={fan_on_time}s, off_time={fan_off_time}s, cycles={cycles}, "
        f"run_forever: {run_forever}"
    )

    # record the result
    RESULT = {
        "HEPA": {cycle + 1: None for cycle in range(cycles)}
    }
    fan_on: bool = False
    cycle: int = 1
    while True:
        try:
            if not run_forever and cycle > cycles:
                log.info(f"Hepa Task: Reached target cycles={cycles}")
                break

            # on time
            if not fan_on or fan_on_time:
                fan_on = True
                log.info(f"Hepa Task: cycle {cycle}")
                msg = "forever" if run_forever else f"for {fan_on_time} seconds"
                log.info(f"Hepa Task: Turning on fan {msg}")
                success = await api.set_hepa_fan_state(
                    turn_on=True, duty_cycle=fan_duty_cycle
                )
                RESULT["HEPA"][cycle] = success  # type: ignore
                if not success:
                    log.error("Hepa Task: FAILED to turn ON fan.")
                    break
                await asyncio.sleep(fan_on_time)

            # off time
            if fan_off_time:
                log.info(f"Hepa Task: Turning off fan for {fan_off_time} seconds")
                success = await api.set_hepa_fan_state(turn_on=False, duty_cycle=0)
                RESULT["HEPA"][cycle] = success  # type: ignore
                if not success:
                    log.error("Hepa Task: FAILED to turn OFF fan.")
                    break
                fan_on = False

            # sleep and increment the cycle
            await asyncio.sleep(fan_off_time or 1)
            if not run_forever:
                # record result
                cycle += 1
        except asyncio.CancelledError:
            break

    log.info("Hepa Task: Finished - Turning off Fan")
    await api.set_hepa_fan_state(turn_on=False, duty_cycle=DEFAULT_DUTY_CYCLE)

    elapsed_time = datetime.datetime.now() - start_time
    log.info(f"Hepa Task: Elapsed time={elapsed_time}")
    return RESULT


async def run_hepa_uv(
    api: OT3API, on_time: int, off_time: int, cycles: int
) -> Optional[Dict[str, Any]]:
    """Coroutine that will run the hepa uv light."""
    light_on_time = max(0, min(on_time, MAX_UV_DOSAGE))
    light_off_time = off_time if off_time > 0 else 0
    start_time = datetime.datetime.now()

    # Dont run task if there are no valid parameters
    if not light_on_time and not light_off_time:
        return None

    if api.door_state == DoorState.OPEN:
        log.warning("UV Task: Flex Door must be closed to operate the UV light")
        return None

    log.info(
        f"Hepa UV Task: Starting - on_time={light_on_time}s, "
        f"off_time={light_off_time}s, cycles={cycles}"
    )

    # record the result
    RESULT = {
        "UV": {cycle + 1: None for cycle in range(cycles)}
    }
    uv_light_on: bool = False
    cycle: int = 1
    while True:
        try:
            if cycle > cycles:
                log.info(f"UV Task: Reached target cycles={cycles}")
                break

            # on time
            if not uv_light_on or light_on_time:
                uv_light_on = True
                log.info(f"UV Task: cycle number={cycle}")
                log.info(
                    f"UV Task: Turning on the UV Light for {light_on_time} seconds"
                )
                success = await api.set_hepa_uv_state(
                    turn_on=True, uv_duration_s=light_on_time
                )
                RESULT["UV"][cycle] = success  # type: ignore
                if not success:
                    log.error("UV Task: FAILED to turned ON uv light.")
                    break
                await asyncio.sleep(light_on_time)

            # off time
            if light_off_time:
                log.info(
                    f"UV Task: Turning off the UV Light for {light_off_time} seconds"
                )
                success = await api.set_hepa_uv_state(turn_on=False, uv_duration_s=0)
                RESULT["UV"][cycle] = success  # type: ignore
                if not success:
                    log.error("UV Task: FAILED to turned OFF uv light.")
                    break
                uv_light_on = False

            # Sleep and increment the cycle
            await asyncio.sleep(light_off_time or 1)
            cycle += 1
        except asyncio.CancelledError:
            break

    log.info("UV Task: Finished - Turning off UV Light ")
    await api.set_hepa_uv_state(turn_on=False, uv_duration_s=DEFAULT_UV_DOSAGE_DURATION)

    elapsed_time = datetime.datetime.now() - start_time
    log.info(f"UV Task: Elapsed time={elapsed_time}")
    return RESULT


async def _control_task(
    api: OT3API, hepa_task: asyncio.Task, uv_task: asyncio.Task
) -> None:
    """Checks robot status and cancels tasks."""
    while True:
        # Make sure the door is closed
        if api.door_state == DoorState.OPEN:
            if not uv_task.done():
                log.warning("Control Task: Flex Door Opened, stopping UV task")
                uv_task.cancel()

        if uv_task.done() and hepa_task.done():
            log.info("Control Task: No more running tasks")
            break

        await asyncio.sleep(1)


async def _main(args: argparse.Namespace) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=args.is_simulating,
        reset_ot3_api=False,
    )

    # Make sure we have a hepa/uv module if not simulating
    if not args.is_simulating:
        assert (
            SubSystem.hepa_uv in api.attached_subsystems
        ), "No Hepa/UV module detected!"

    log.info(f"=============== {ROBOT_NAME} ==========================")
    # Make sure everything is off before we start testing
    await _turn_off_hepa_uv(api)

    # create tasks
    hepa_fan_task = asyncio.create_task(
        run_hepa_fan(
            api, args.fan_duty_cycle, args.fan_on_time, args.fan_off_time, args.cycles
        )
    )
    hepa_uv_task = asyncio.create_task(
        run_hepa_uv(api, args.uv_on_time, args.uv_off_time, args.cycles)
    )
    control_task = asyncio.create_task(_control_task(api, hepa_fan_task, hepa_uv_task))

    # start the tasks
    results = []
    try:
        results = await asyncio.gather(control_task, hepa_fan_task, hepa_uv_task)
    finally:
        # Make sure we always turn OFF everything!
        await _turn_off_hepa_uv(api)
        log.info("===================== RESULT ======================")
        for result in results:
            if result is None:
                continue
            for task, data in result.items():
                for cycle, success in data.items():
                    msg = "PASSED" if success else "FAILED"
                    log.info(f"{task}: cycle={cycle} result={msg}")
        log.info("===================== RESULT =======================")


def log_config(log_level: int) -> Dict:
    """Configure logging."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"},
            "production_trace": {"format": "%(asctime)s %(message)s"},
        },
        "handlers": {
            "main_log_handler": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "basic",
                "filename": "/var/log/hepauv_lifetime.log",
                "maxBytes": 5000000,
                "level": log_level,
                "backupCount": 3,
            },
            "stream_handler": {
                "class": "logging.StreamHandler",
                "formatter": "basic",
                "level": log_level,
            },
        },
        "loggers": {
            "": {
                "handlers": (
                    ["main_log_handler"]
                    if log_level > logging.INFO
                    else ["main_log_handler", "stream_handler"]
                ),
                "level": log_level,
            },
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Hepa/UV Life-Time Test",
        description="Program to test the lifetime of the Hepa/UV module.",
    )
    parser.add_argument(
        "--log-level",
        help=(
            "Developer logging level. At DEBUG or below, logs are written "
            "to console; at INFO or above, logs are only written to "
            "/var/log/hepauv_lifetime.log"
        ),
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
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
        help="The duty cycle of the hepa fan 0-100%.",
    )
    parser.add_argument(
        "--fan-on-time",
        type=int,
        default=0,
        help="The time in seconds the fan should stay on for. "
        "0 turns off fan (default), -1 stays on until program is stopped",
    )
    parser.add_argument(
        "--fan-off-time",
        type=int,
        default=0,
        help="The time in seconds the fan should stay on for. ignored if not set",
    )
    parser.add_argument(
        "--uv-on-time",
        type=int,
        default=0,
        help="The time in seconds the UV light will be turned on for. "
        "0 turns off uv light (default), "
        f"The max value is {MAX_UV_DOSAGE} seconds.",
    )
    parser.add_argument(
        "--uv-off-time",
        type=int,
        default=0,
        help="The time in seconds the UV light will be turned off for. "
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
    logging.config.dictConfig(log_config(getattr(logging, args.log_level)))

    try:
        asyncio.run(_main(args))
    except KeyboardInterrupt:
        log.warning("KeyBoard Interrupt")
    finally:
        log.info("Exiting...")

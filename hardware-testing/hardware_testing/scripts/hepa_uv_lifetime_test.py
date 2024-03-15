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
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ErrorMessage,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.errors import raise_from_error_message
from opentrons_shared_data.errors.exceptions import HepaUVFailedError


# Default constants
DEFAULT_DUTY_CYCLE: int = 75
MAX_DUTY_CYCLE: int = 100
DEFAULT_UV_DOSAGE_DURATION: int = 900  # 15m
MAX_UV_DOSAGE: int = 60 * 60  # 1hr max dosage
DEFAULT_CYCLES: int = 1
MAX_RUN_TIME: int = 86400  # 24hrs

# Get the name of the robot
try:
    ROBOT_NAME = subprocess.check_output(["hostnamectl", "--pretty"]).decode().strip()
except Exception:
    ROBOT_NAME = "HepaLifetime"


log = logging.getLogger(ROBOT_NAME)


async def _turn_off_fan(api: OT3API) -> None:
    """Turn off fan if on."""
    hepa_fan_state: Optional[HepaFanState] = await api.get_hepa_fan_state()
    if not hepa_fan_state or hepa_fan_state.fan_on:
        log.info("Turning off Hepa Fan.")
        await api.set_hepa_fan_state(turn_on=False)

    hepa_fan_state: Optional[HepaFanState] = await api.get_hepa_fan_state()
    if hepa_fan_state:
        assert not hepa_fan_state.fan_on, "Hepa Fan did not turn OFF!"


async def _turn_off_uv(api: OT3API) -> None:
    """Turn off UV if on."""
    hepa_uv_state: Optional[HepaUVState] = await api.get_hepa_uv_state()
    if not hepa_uv_state or hepa_uv_state.light_on:
        log.info("Turning off Hepa UV Light.")
        await api.set_hepa_uv_state(turn_on=False)

    hepa_uv_state: Optional[HepaUVState] = await api.get_hepa_uv_state()
    if hepa_uv_state:
        assert not hepa_uv_state.light_on, "Hepa UV did not turn OFF!"


async def _turn_off_hepa_uv(api: OT3API) -> None:
    """Set and Make sure that the Hepa fan and UV light are off."""
    await _turn_off_uv(api)
    await _turn_off_fan(api)


async def run_hepa_fan(
    api: OT3API,
    duty_cycle: int,
    on_time: int,
    off_time: int,
    cycles: int,
    result: Dict[str, Any],
    event: asyncio.Event,
) -> None:
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

    fan_on: bool = False
    cycle: int = 1
    sleep_time: int = 0
    while not event.is_set():
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
                result["HEPA"][cycle] = success  # type: ignore
                if not success:
                    log.error("Hepa Task: FAILED to turn ON fan.")
                    break
                await asyncio.sleep(fan_on_time)

            # off time
            if fan_off_time:
                log.info(f"Hepa Task: Turning off fan for {fan_off_time} seconds")
                success = await api.set_hepa_fan_state(turn_on=False, duty_cycle=0)
                result["HEPA"][cycle] = success  # type: ignore
                if not success:
                    log.error("Hepa Task: FAILED to turn OFF fan.")
                    break
                fan_on = False

            # sleep and increment the cycle
            await asyncio.sleep(fan_off_time or 1)
            if not run_forever:
                # record result
                cycle += 1
            else:
                sleep_time += 1
            
            # report elasped time every 10 minutes
            if sleep_time == 600:
                elapsed_time = datetime.datetime.now() - start_time
                log.info(f"Hepa Task: Elapsed time={elapsed_time}")
                sleep_time = 0
        except asyncio.CancelledError:
            break

    log.info("Hepa Task: Finished - Turning off Fan")
    await asyncio.shield(_turn_off_fan(api))

    elapsed_time = datetime.datetime.now() - start_time
    log.info(f"Hepa Task: Elapsed time={elapsed_time}")


async def run_hepa_uv(
    api: OT3API, on_time: int, off_time: int, cycles: int, result: Dict[str, Any], event: asyncio.Event,
) -> None:
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

    uv_light_on: bool = False
    cycle: int = 1
    while not event.is_set():
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
                result["UV"][cycle] = success  # type: ignore
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
                result["UV"][cycle] = success  # type: ignore
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
    await asyncio.shield(_turn_off_uv(api))

    elapsed_time = datetime.datetime.now() - start_time
    log.info(f"UV Task: Elapsed time={elapsed_time}")


async def _control_task(
    api: OT3API,
    hepa_task: asyncio.Task,
    run_forever: bool,
    uv_task: asyncio.Task,
    event: asyncio.Event,
) -> None:
    """Checks robot status and cancels tasks."""

    def _handle_hepa_error(message: MessageDefinition, arbitration_id: ArbitrationId):
        if isinstance(message, ErrorMessage):
            try:
                raise_from_error_message(message)
            except HepaUVFailedError as e:
                log.info(f"HepaUV Failed, stopping UV task: {e}")
                uv_task.cancel()

    try:
        api._backend._messenger.add_listener(_handle_hepa_error)
        while not event.is_set():
            # Make sure the door is closed
            if api.door_state == DoorState.OPEN:
                if not uv_task.done():
                    log.warning("Control Task: Flex Door Opened, stopping UV task")
                    uv_task.cancel()

            if uv_task.done():
                if hepa_task.done():
                    log.info("Control Task: No more running tasks")
                    event.set()
                    return
                elif run_forever:
                    log.info(f"Leave FAN on for {MAX_RUN_TIME} before ending script")
                    await asyncio.sleep(MAX_RUN_TIME)
                    event.set()
                    return

            await asyncio.sleep(1)
    finally:
        api._backend._messenger.remove_listener(_handle_hepa_error)


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

    stop_event = asyncio.Event()

    RESULT = {
        "HEPA": {},
        "UV": {},
    }

    # create tasks
    hepa_fan_task = asyncio.create_task(
        run_hepa_fan(
            api, args.fan_duty_cycle, args.fan_on_time, args.fan_off_time, args.cycles, RESULT, stop_event
        )
    )
    hepa_uv_task = asyncio.create_task(
        run_hepa_uv(api, args.uv_on_time, args.uv_off_time, args.cycles, RESULT, stop_event)
    )
    control_task = asyncio.create_task(
        _control_task(
            api,
            hepa_fan_task,
            args.fan_on_time == -1,
            hepa_uv_task,
            stop_event
        )
    )

    # start the tasks
    try:
        task = asyncio.gather(control_task, hepa_fan_task, hepa_uv_task)
        await task
    finally:
        log.info("===================== RESULT ======================")
        for task, data in RESULT.items():
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

"""Test Jogging."""
import argparse
import asyncio
import logging
from opentrons_hardware.scripts.can_args import add_can_args
from opentrons_hardware.scripts import provision_pipette
from opentrons_hardware.drivers.can_bus import build, CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from typing import Tuple
from opentrons_hardware.instruments.pipettes import serials


async def run(
    args: argparse.Namespace, base_log: logging.Logger, trace_log: logging.Logger
) -> None:
    """Script entrypoint."""
    which_pipette = {"left": NodeId.pipette_left, "right": NodeId.pipette_right}[
        args.which
    ]
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:
        await flash_serials(messenger, which_pipette, base_log, trace_log)

async def flash_serials(
    messenger: CanMessenger,
    which_pipette: NodeId,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Flash serials in a loop."""
    while True:
        rect = await get_and_update_serial_once(
            messenger, which_pipette, base_log, trace_log
        )
        try:
            if rect != []:
                print("flash_serials_pass--name:{}, model:{}, data:{}".format(rect[0], rect[1], str(rect[2],"UTF-8")))
            else:
                print("flash_serials_err")
        except:
            print("flash_serials_err")

async def get_and_update_serial_once(
    messenger: CanMessenger,
    which_pipette: NodeId,
    base_log: logging.Logger,
    trace_log: logging.Logger,
) -> None:
    """Read and update a single serial."""
    name, model, data = await get_serial(
        f'Enter serial for pipette on {which_pipette.name.split("_")[-1]}: ', base_log
    )
    try:
        rect = await provision_pipette.update_serial_and_confirm(
            messenger, which_pipette, name, model, data, base_log, trace_log
        )
        if rect:
            trace_log.info(f"SUCCESS,{name.name},{model},{data!r}")
            return [name, model, data]
        else:
            return []
    except Exception:
        base_log.exception("Update failed")
        trace_log.info(f"FAILURE,{name.name},{model},{data!r}")
        raise

async def get_serial(
    prompt: str, base_log: logging.Logger
) -> Tuple[PipetteName, int, bytes]:
    """Get a serial number that is correct and parseable."""
    loop = asyncio.get_running_loop()
    while True:
        serial = await loop.run_in_executor(None, lambda: input(prompt))
        try:
            name, model, data = serials.info_from_serial_string(serial)
        except Exception as e:
            base_log.exception("invalid serial")
            if isinstance(Exception, KeyboardInterrupt):
                raise
            print("flash_serials_tryerr")
        else:
            base_log.info(
                f"parsed name {name} model {model} datecode {data!r} from {serial}"
            )
            return name, model, data
def flash_pipette() -> None:
    i = 0 
    while i == 0:
        """Entry point."""
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument(
            "-l",
            "--log-level",
            help=(
                "Developer logging level. At DEBUG or below, logs are written "
                "to console; at INFO or above, logs are only written to "
                "provision_pipettes_debug.log"
            ),
            type=str,
            choices=["DEBUG", "INFO", "WARNING", "ERROR"],
            default="WARNING",
        )
        parser.add_argument(
            "--once",
            action="store_true",
            help="Run just once and quit instead of staying in a loop",
        )
        parser.add_argument(
            "-w",
            "--which",
            type=str,
            choices=["left", "right"],
            help="Which pipette to flash",
        )
        add_can_args(parser)

        args = parser.parse_args()
        base_log, trace_log = provision_pipette.log_config(getattr(logging, args.log_level))
        asyncio.run(run(args, base_log, trace_log))

if __name__ == "__main__":
    flash_pipette()

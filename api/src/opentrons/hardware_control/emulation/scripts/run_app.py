"""Script for starting up emulation up with module emulators."""

import asyncio
import logging
from argparse import ArgumentParser
from typing import List

from .run_module_emulator import run as run_module_by_name
from opentrons.hardware_control.emulation.app import Application
from opentrons.hardware_control.emulation.scripts.run_module_emulator import (
    emulator_builder,
)
from opentrons.hardware_control.emulation.settings import Settings


async def run(settings: Settings, modules: List[str]) -> None:
    """Run the emulator app with connected module emulators.

    Args:
        settings: App settings.
        modules: The module emulators to start.

    Returns:
        None

    """
    loop = asyncio.get_event_loop()

    app_task = loop.create_task(Application(settings=settings).run())
    module_tasks = [
        loop.create_task(
            run_module_by_name(settings=settings, emulator_name=n, host="localhost")
        )
        for n in modules
    ]
    await asyncio.gather(app_task, *module_tasks)


def main() -> None:
    """Entry point."""
    a = ArgumentParser()
    a.add_argument(
        "--m",
        action="append",
        choices=emulator_builder.keys(),
        help="which module(s) to emulate.",
    )
    args = a.parse_args()

    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    asyncio.run(run(Settings(), args.m))


if __name__ == "__main__":
    main()

import logging
import asyncio
from argparse import ArgumentParser
from typing import Dict, Callable

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.run_emulator import run_emulator_client
from opentrons.hardware_control.emulation.settings import Settings, ProxySettings
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator

emulator_builder: Dict[str, Callable[[Settings], AbstractEmulator]] = {
    "magdeck": lambda s: MagDeckEmulator(Parser()),
    "temperature": lambda s: TempDeckEmulator(Parser()),
    "thermocycler": lambda s: ThermocyclerEmulator(Parser()),
}

emulator_port: Dict[str, Callable[[Settings], ProxySettings]] = {
    "magdeck": lambda s: s.magdeck_proxy,
    "temperature": lambda s: s.temperature_proxy,
    "thermocycler": lambda s: s.thermocycler_proxy,
}


def run(emulator_name: str, host: str) -> None:
    """Run an emulator.

    Args:
        emulator_name: Name of emulator. This must be a key in emulator_builder
        host: host to connect to.

    Returns:
        None
    """
    settings = Settings()

    e = emulator_builder[emulator_name](settings)
    proxy_settings = emulator_port[emulator_name](settings)

    asyncio.run(run_emulator_client(host, proxy_settings.emulator_port, e))


if __name__ == "__main__":
    a = ArgumentParser()
    a.add_argument("emulator", type=str, choices=emulator_builder.keys())
    a.add_argument("host", type=str)
    args = a.parse_args()

    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    run(args.emulator, args.host)

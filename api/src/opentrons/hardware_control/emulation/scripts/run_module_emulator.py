"""Script for starting up a python module emulator."""
import logging
import asyncio
from argparse import ArgumentParser
from typing import Dict, Callable
from typing_extensions import Final

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator
from opentrons.hardware_control.emulation.heater_shaker import HeaterShakerEmulator
from opentrons.hardware_control.emulation.types import ModuleType
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator


from opentrons.hardware_control.emulation.run_emulator import run_emulator_client
from opentrons.hardware_control.emulation.settings import Settings, ProxySettings

emulator_builder: Final[Dict[str, Callable[[Settings], AbstractEmulator]]] = {
    ModuleType.Magnetic.value: lambda s: MagDeckEmulator(Parser(), s.magdeck),
    ModuleType.Temperature.value: lambda s: TempDeckEmulator(Parser(), s.tempdeck),
    ModuleType.Thermocycler.value: lambda s: ThermocyclerEmulator(
        Parser(), s.thermocycler
    ),
    ModuleType.Heatershaker.value: lambda s: HeaterShakerEmulator(
        Parser(), s.heatershaker
    ),
}

emulator_port: Final[Dict[str, Callable[[Settings], ProxySettings]]] = {
    ModuleType.Magnetic.value: lambda s: s.magdeck_proxy,
    ModuleType.Temperature.value: lambda s: s.temperature_proxy,
    ModuleType.Thermocycler.value: lambda s: s.thermocycler_proxy,
    ModuleType.Heatershaker.value: lambda s: s.heatershaker_proxy,
}


async def run(settings: Settings, emulator_name: str, host: str) -> None:
    """Run an emulator.

    Args:
        settings: emulator settings
        emulator_name: Name of emulator. This must be a key in emulator_builder
        host: host to connect to.

    Returns:
        None
    """
    e = emulator_builder[emulator_name](settings)
    proxy_settings = emulator_port[emulator_name](settings)
    await run_emulator_client(host, proxy_settings.emulator_port, e)


def main() -> None:
    """Entry point."""
    a = ArgumentParser()
    a.add_argument(
        "emulator",
        type=str,
        choices=emulator_builder.keys(),
        help="which module to emulate.",
    )
    a.add_argument("host", type=str, help="the emulator host")
    args = a.parse_args()

    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    asyncio.run(run(Settings(), args.emulator, args.host))


if __name__ == "__main__":
    main()

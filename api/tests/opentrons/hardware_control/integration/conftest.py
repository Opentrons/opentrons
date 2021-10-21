from time import sleep
from typing import Iterator

import pytest
import threading
import asyncio
from opentrons.hardware_control.emulation.app import Application
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.run_emulator import run_emulator_client
from opentrons.hardware_control.emulation.settings import (
    Settings,
    SmoothieSettings,
    PipetteSettings,
)
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator


@pytest.fixture(scope="session")
def emulator_settings() -> Settings:
    """Emulator settings"""
    return Settings(
        host="0.0.0.0",
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_multi_v2.0", id="P3HMV202020041605"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        ),
    )


@pytest.fixture(scope="session")
def emulation_app(emulator_settings: Settings) -> Iterator[None]:
    """Run the emulators"""

    async def _run_emulation_environment() -> None:
        await asyncio.gather(
            # Start application
            Application(settings=emulator_settings).run(),
            # Add magdeck emulator
            run_emulator_client(
                host="localhost",
                port=emulator_settings.magdeck_proxy.emulator_port,
                emulator=MagDeckEmulator(Parser()),
            ),
            # Add temperature emulator
            run_emulator_client(
                host="localhost",
                port=emulator_settings.temperature_proxy.emulator_port,
                emulator=TempDeckEmulator(Parser()),
            ),
            # Add thermocycler emulator
            run_emulator_client(
                host="localhost",
                port=emulator_settings.thermocycler_proxy.emulator_port,
                emulator=ThermocyclerEmulator(Parser()),
            ),
        )

    def runit() -> None:
        asyncio.run(_run_emulation_environment())

    # TODO 20210219
    #  The emulators must be run in a separate thread because our serial
    #  drivers block the main thread. Remove this thread when that is no
    #  longer true.
    t = threading.Thread(target=runit)
    t.daemon = True
    t.start()
    yield

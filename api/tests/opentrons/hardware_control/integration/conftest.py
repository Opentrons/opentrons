from typing import Iterator

import pytest
import threading
import asyncio
from opentrons.hardware_control.emulation.scripts import run_app
from opentrons.hardware_control.emulation.types import ModuleType
from opentrons.hardware_control.emulation.settings import (
    Settings,
    SmoothieSettings,
    PipetteSettings,
)


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

    def runit() -> None:
        asyncio.run(
            run_app.run(
                settings=emulator_settings,
                modules=[
                    ModuleType.Magnetic,
                    ModuleType.Temperature,
                    ModuleType.Thermocycler,
                ],
            )
        )

    # TODO 20210219
    #  The emulators must be run in a separate thread because our serial
    #  drivers block the main thread. Remove this thread when that is no
    #  longer true.
    t = threading.Thread(target=runit)
    t.daemon = True
    t.start()
    yield

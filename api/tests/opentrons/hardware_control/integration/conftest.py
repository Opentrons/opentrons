import pytest
import threading
import asyncio
from opentrons.hardware_control.emulation.app import run


@pytest.fixture(scope="session")
def emulation_app():
    """Run the emulators"""
    def runit():
        asyncio.run(run())
    # TODO 20210219
    #  The emulators must be run in a separate thread because our serial
    #  drivers block the main thread. Remove this thread when that is no
    #  longer true.
    t = threading.Thread(target=runit)
    t.daemon = True
    t.start()
    yield t

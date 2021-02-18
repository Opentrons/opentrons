import pytest
import threading
import asyncio
from opentrons.hardware_control.emulation.app import run


@pytest.fixture(scope="session")
def emulation_app():
    """"""
    def runit():
        asyncio.run(run())
    t = threading.Thread(target=runit)
    t.daemon = True
    t.start()
    yield t
    # t.join()

import asyncio
import sys

import pytest


@pytest.fixture
def loop():
    if sys.platform == 'win32':
        _loop = asyncio.ProactorEventLoop()
    else:
        _loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_loop)
    return asyncio.get_event_loop()

import asyncio
from typing import AsyncIterator

import pytest

from opentrons.hardware_control.emulation.proxy import Proxy, ProxySettings


@pytest.fixture
def setting() -> ProxySettings:
    """Proxy settings fixture."""
    return ProxySettings(emulator_port=12345, driver_port=12346)


@pytest.fixture
async def subject(
    loop: asyncio.AbstractEventLoop, setting: ProxySettings
) -> AsyncIterator[Proxy]:
    """Test subject."""
    p = Proxy("proxy")
    task = loop.create_task(p.run(setting))
    yield p
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


async def test_driver_route_message(subject: Proxy, setting: ProxySettings) -> None:
    """It should route a message to an emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver[1].write(b"abc")
    r = await emulator[0].read(3)
    assert r == b"abc"


async def test_emulator_route_message(subject: Proxy, setting: ProxySettings) -> None:
    """It should route a message to a driver."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].write(b"abc")
    r = await driver[0].read(3)
    assert r == b"abc"


async def test_driver_route_message_two_connections(
    subject: Proxy, setting: ProxySettings
) -> None:
    """It should route messages to correct emulator."""
    emulator1 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    emulator2 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver1[1].write(b"abc")
    driver2[1].write(b"cba")
    r1 = await emulator1[0].read(3)
    r2 = await emulator2[0].read(3)
    assert r1 == b"abc"
    assert r2 == b"cba"


async def test_emulator_route_message_two_connections(
    subject: Proxy, setting: ProxySettings
) -> None:
    """It should route messages to correct driver."""
    emulator1 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    emulator2 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator1[1].write(b"abc")
    emulator2[1].write(b"cba")
    r1 = await driver1[0].read(3)
    r2 = await driver2[0].read(3)
    assert r1 == b"abc"
    assert r2 == b"cba"


async def test_driver_and_no_emulator(subject: Proxy, setting: ProxySettings) -> None:
    """It should fail to read if no emulator."""
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    assert b"" == await driver[0].read(n=1)


async def test_two_driver_and_one_emulator(
    subject: Proxy, setting: ProxySettings
) -> None:
    """It should fail to read if no emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].write(b"abc")
    assert b"abc" == await driver1[0].read(n=3)
    assert b"" == await driver2[0].read(n=3)


async def test_driver_reconnect(subject: Proxy, setting: ProxySettings) -> None:
    """It should allow a second driver to claim a formerly used emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].write(b"abc")
    assert b"abc" == await driver[0].read(n=3)

    driver[1].close()

    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].write(b"abc")
    assert b"abc" == await driver[0].read(n=3)


async def test_emulator_disconnects(subject: Proxy, setting: ProxySettings) -> None:
    """It should disconnect driver when emulator disconnects."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].close()

    driver[1].write(b"123")
    assert b"" == await driver[0].read(n=3)

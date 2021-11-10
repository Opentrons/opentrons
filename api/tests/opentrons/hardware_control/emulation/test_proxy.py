import asyncio
from typing import AsyncIterator

import pytest

from opentrons.hardware_control.emulation.proxy import (
    Proxy,
    ProxySettings,
    ProxyListener,
)


@pytest.fixture
def setting() -> ProxySettings:
    """Proxy settings fixture."""
    return ProxySettings(emulator_port=12345, driver_port=12346)


class SimpleProxyListener(ProxyListener):
    def __init__(self) -> None:
        self._count = 0

    def on_server_connected(
        self, server_type: str, client_uri: str, identifier: str
    ) -> None:
        self._count += 1

    def on_server_disconnected(self, identifier: str) -> None:
        self._count -= 1

    async def wait_count(self, count: int) -> None:
        while count != self._count:
            await asyncio.sleep(0.01)


@pytest.fixture
def proxy_listener() -> SimpleProxyListener:
    """A proxy listener."""
    return SimpleProxyListener()


@pytest.fixture
async def subject(
    loop: asyncio.AbstractEventLoop,
    setting: ProxySettings,
    proxy_listener: SimpleProxyListener,
) -> AsyncIterator[Proxy]:
    """Test subject."""
    p = Proxy("proxy", proxy_listener, setting)
    task = loop.create_task(p.run())
    yield p
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


async def test_driver_route_message(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should route a message to an emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(1)
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver[1].write(b"abc\n")
    r = await emulator[0].readline()
    assert r == b"abc\n"


async def test_emulator_route_message(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should route a message to a driver."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(1)
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)

    test_data = b"abc\n"
    emulator[1].write(test_data)
    r = await driver[0].readline()
    assert r == test_data


async def test_driver_route_message_two_connections(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should route messages to correct emulator."""
    emulator1 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    emulator2 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(2)
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)

    test_data1 = b"abc\n"
    test_data2 = b"cba\n"
    driver1[1].write(test_data1)
    driver2[1].write(test_data2)
    r1 = await emulator1[0].readline()
    r2 = await emulator2[0].readline()
    assert r1 == test_data1
    assert r2 == test_data2


async def test_emulator_route_message_two_connections(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should route messages to correct driver."""
    emulator1 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    emulator2 = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(2)
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)

    test_data1 = b"abc\n"
    test_data2 = b"cba\n"
    emulator1[1].write(test_data1)
    emulator2[1].write(test_data2)
    r1 = await driver1[0].readline()
    r2 = await driver2[0].readline()
    assert r1 == test_data1
    assert r2 == test_data2


async def test_driver_and_no_emulator(subject: Proxy, setting: ProxySettings) -> None:
    """It should fail to read if no emulator."""
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    assert b"" == await driver[0].readline()


async def test_two_driver_and_one_emulator(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should fail to read if no emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(1)
    driver1 = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    driver2 = await asyncio.open_connection(host="localhost", port=setting.driver_port)

    test_data1 = b"abc\n"
    emulator[1].write(test_data1)
    assert test_data1 == await driver1[0].readline()
    assert b"" == await driver2[0].readline()


async def test_driver_reconnect(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should allow a second driver to claim a formerly used emulator."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(1)
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)

    test_data = b"abc\n"
    emulator[1].write(test_data)
    assert test_data == await driver[0].readline()

    driver[1].close()

    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].write(test_data)
    assert test_data == await driver[0].readline()


async def test_emulator_disconnects(
    subject: Proxy, setting: ProxySettings, proxy_listener: SimpleProxyListener
) -> None:
    """It should disconnect driver when emulator disconnects."""
    emulator = await asyncio.open_connection(
        host="localhost", port=setting.emulator_port
    )
    await proxy_listener.wait_count(1)
    driver = await asyncio.open_connection(host="localhost", port=setting.driver_port)
    emulator[1].close()

    driver[1].write(b"123\n")
    assert b"" == await driver[0].readline()

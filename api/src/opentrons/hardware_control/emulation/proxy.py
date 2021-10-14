import asyncio
import logging
from typing import Tuple, List

from opentrons.hardware_control.emulation.settings import ProxySettings, Settings

log = logging.getLogger(__name__)


class Proxy:
    def __init__(self, name: str) -> None:
        """Constructor."""
        self._name = name
        self._cons: List[Tuple[asyncio.StreamReader, asyncio.StreamWriter]] = []

    async def run(self, settings: ProxySettings) -> None:
        """

        Args:
            settings:

        Returns:

        """
        await asyncio.gather(
            self._run_emulator__server(settings), self._run_driver_server(settings)
        )

    async def _run_emulator__server(self, settings: ProxySettings) -> None:
        """

        Args:
            settings:

        Returns:

        """
        log.info(
            f"starting {self._name} emulator server at "
            f"{settings.host}:{settings.emulator_port}"
        )
        server = await asyncio.start_server(
            self.em_conn, settings.host, settings.emulator_port
        )
        await server.serve_forever()

    async def _run_driver_server(self, settings: ProxySettings) -> None:
        """

        Args:
            settings:

        Returns:

        """
        log.info(
            f"starting {self._name} driver server at "
            f"{settings.host}:{settings.driver_port}"
        )
        server = await asyncio.start_server(
            self.driver_conn, settings.host, settings.driver_port
        )
        await server.serve_forever()

    async def em_conn(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """

        Args:
            reader:
            writer:

        Returns:

        """
        log.info(f"{self._name} emulator connected.")
        self._cons.append(
            (
                reader,
                writer,
            )
        )

    async def driver_conn(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """

        Args:
            reader:
            writer:

        Returns:

        """
        log.info(f"{self._name} driver connected.")

        # Pop an emulator connection.
        r, w = self._cons.pop()

        async def _read_from_driver(
            driver_in: asyncio.StreamReader, em_out: asyncio.StreamWriter
        ) -> None:
            while True:
                d = await driver_in.read(1)
                if not d:
                    log.info(f"{self._name} driver disconnected.")
                    break
                em_out.write(d)

        async def _read_from_em(
            em_in: asyncio.StreamReader, driver_out: asyncio.StreamWriter
        ) -> None:
            while True:
                d = await em_in.read(1)
                if not d:
                    log.info(f"{self._name} emulator disconnected.")
                    break
                driver_out.write(d)

        t1 = asyncio.get_event_loop().create_task(_read_from_driver(reader, w))
        t2 = asyncio.get_event_loop().create_task(_read_from_em(r, writer))
        await t1
        t2.cancel()
        try:
            await t2
        except asyncio.CancelledError:
            pass

        # Return the emulator connection to the pool.
        self._cons.append((r, w))

        log.info("done")


async def em_server(proxy: Proxy) -> None:
    """

    Args:
        proxy:

    Returns:

    """
    server = await asyncio.start_server(proxy.em_conn, "localhost", 1234)
    await server.serve_forever()


async def driver_server(proxy: Proxy) -> None:
    """

    Args:
        proxy:

    Returns:

    """
    server = await asyncio.start_server(proxy.driver_conn, "localhost", 1235)
    await server.serve_forever()


async def run() -> None:
    """

    Returns:

    """
    settings = Settings()

    await asyncio.gather(
        Proxy("smoothie_proxy").run(settings.smoothie_proxy),
        Proxy("magdeck_proxy").run(settings.magdeck_proxy),
        Proxy("temperature_proxy").run(settings.temperature_proxy),
        Proxy("thermocycler_proxy").run(settings.thermocycler_proxy),
        Proxy("heatershaker_proxy").run(settings.heatershaker_proxy),
    )
    pass


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    asyncio.run(run())

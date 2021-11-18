import asyncio
import logging
from typing import Optional

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator
from opentrons.hardware_control.emulation.connection_handler import ConnectionHandler

log = logging.getLogger(__name__)


async def run_emulator_client(
    host: str,
    port: int,
    emulator: AbstractEmulator,
    retries: int = 3,
    interval_seconds: float = 0.1,
) -> None:
    """Run an emulator as a client.

    Args:
        host: Host to connect to.
        port: Port to connect on.
        emulator: The emulator instance.
        retries: Number of retries on a failed connection attempt.
        interval_seconds: How long to wait between retries.

    Returns:
        None
    """
    log.info(f"Connecting to {emulator.__class__.__name__} at {host}:{port}")

    r: Optional[asyncio.StreamReader] = None
    w: Optional[asyncio.StreamWriter] = None
    for i in range(retries):
        try:
            r, w = await asyncio.open_connection(host, port)
            break
        except IOError:
            log.error(
                f"{emulator.__class__.__name__} failed to connect on "
                f"try {i + 1}. Retrying in {interval_seconds} seconds."
            )
            await asyncio.sleep(interval_seconds)

    if r is None or w is None:
        raise IOError(
            f"Failed to connect to {emulator.__class__.__name__} at "
            f"{host}:{port} after {retries} retries."
        )

    connection = ConnectionHandler(emulator)
    await connection(r, w)


async def run_emulator_server(host: str, port: int, emulator: AbstractEmulator) -> None:
    """Run an emulator as a server.

    Args:
        host: Host to listen on.
        port: Port to listen on.
        emulator: Emulator instance.

    Returns:
        None
    """
    log.info(f"Starting {emulator.__class__.__name__} at {host}:{port}")
    server = await asyncio.start_server(ConnectionHandler(emulator), host, port)
    await server.serve_forever()

import asyncio
import logging

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator
from opentrons.hardware_control.emulation.connection_handler import ConnectionHandler

log = logging.getLogger(__name__)


async def run_emulator_client(host: str, port: int, emulator: AbstractEmulator) -> None:
    """Run an emulator as a client."""
    log.info(f"Connecting to {emulator.__class__.__name__} at {host}:{port}")
    r, w = await asyncio.open_connection(host, port)
    connection = ConnectionHandler(emulator)
    await connection(r, w)


async def run_emulator_server(host: str, port: int, emulator: AbstractEmulator) -> None:
    """Run an emulator as a server."""
    log.info(f"Starting {emulator.__class__.__name__} at {host}:{port}")
    server = await asyncio.start_server(ConnectionHandler(emulator), host, port)
    await server.serve_forever()

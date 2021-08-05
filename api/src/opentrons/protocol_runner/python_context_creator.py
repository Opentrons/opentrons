"""Factory for Python Protocol API instances."""
import asyncio
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.clients import SyncClient, ChildThreadTransport
from opentrons.protocol_api_experimental import ProtocolContext


class PythonContextCreator:
    """A factory to build Python ProtocolContext instances."""

    @staticmethod
    def create(protocol_engine: ProtocolEngine) -> ProtocolContext:
        """Create a fresh ProtocolContext wired to a ProtocolEngine."""
        loop = asyncio.get_running_loop()
        transport = ChildThreadTransport(engine=protocol_engine, loop=loop)
        client = SyncClient(transport=transport)

        return ProtocolContext(engine_client=client)

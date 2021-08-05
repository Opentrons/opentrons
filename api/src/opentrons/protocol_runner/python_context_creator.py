"""Factory for Python Protocol API instances."""
import asyncio
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.clients import SyncClient, ChildThreadTransport
from opentrons.protocol_api_experimental import ProtocolContext


class ContextCreator:
    """A factory to build Python ProtocolContext instances."""

    def __init__(
        self,
        engine: ProtocolEngine,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        """Initialize the factory with access to a ProtocolEngine.

        Arguments:
            engine: ProtocolEngine instance the context should be using.
            loop: Event loop where the ProtocolEngine is running.
        """
        self._engine = engine
        self._loop = loop

    def create(self) -> ProtocolContext:
        """Create a fresh ProtocolContext wired to a ProtocolEngine."""
        transport = ChildThreadTransport(engine=self._engine, loop=self._loop)
        client = SyncClient(transport=transport)

        return ProtocolContext(engine_client=client)

"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation as LegacyContextImplementation,
)
from opentrons.protocol_api import ProtocolContext as LegacyProtocolContext
from opentrons.protocols.parse import parse
from opentrons.protocols.execution.execute import run_protocol
from opentrons.protocols.types import (
    Protocol as LegacyProtocol,
    JsonProtocol as LegacyJsonProtocol,
    PythonProtocol as LegacyPythonProtocol,
)

from .protocol_file import ProtocolFile as ProtocolSource


class LegacyFileReader:
    """Interface to read Protocol API v2 protocols prior to execution."""

    @staticmethod
    def read(protocol_source: ProtocolSource) -> LegacyProtocol:
        """Read a PAPIv2 protocol into a datastructure."""
        # TODO(mc, 2021-08-25): validate files list length before access
        protocol_file_path = protocol_source.files[0]
        protocol_contents = protocol_file_path.read_text()

        return parse(
            protocol_file=protocol_contents,
            filename=protocol_file_path.name,
        )


class LegacyContextCreator:
    """Interface to contruct Protocol API v2 contexts."""

    def __init__(self, hardware_api: HardwareAPI) -> None:
        self._hardware_api = hardware_api

    def create(
        self,
        api_version: APIVersion,
    ) -> LegacyProtocolContext:
        context_impl = LegacyContextImplementation(
            api_version=api_version,
            hardware=self._hardware_api,
        )

        return LegacyProtocolContext(
            api_version=api_version,
            implementation=context_impl,
        )


class LegacyExecutor:
    """Interface to execute Protocol API v2 protocols in a child thread."""

    @staticmethod
    async def execute(protocol: LegacyProtocol, context: LegacyProtocolContext) -> None:
        """Execute a PAPIv2 protocol with a given ProtocolContext in a child thread."""
        loop = asyncio.get_running_loop()

        with ThreadPoolExecutor(max_workers=1) as executor:
            await loop.run_in_executor(
                executor=executor,
                func=partial(run_protocol, protocol=protocol, context=context),
            )


__all__ = [
    "LegacyPythonProtocol",
    "LegacyProtocolContext",
    "LegacyProtocol",
    "LegacyJsonProtocol",
    "LegacyPythonProtocol",
]

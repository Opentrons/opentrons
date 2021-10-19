"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from opentrons.config import feature_flags
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation as LegacyProtocolContextImplementation,
)
from opentrons.protocols.context.simulator.protocol_context import (
    ProtocolContextSimulation as LegacyProtocolContextSimulation,
)
from opentrons.protocol_api import (
    ProtocolContext as LegacyProtocolContext,
    InstrumentContext as LegacyPipetteContext,
)
from opentrons.protocol_api.labware import Labware as LegacyLabware
from opentrons.protocol_api.protocol_context import (
    InstrumentLoadInfo as LegacyInstrumentLoadInfo,
    LabwareLoadInfo as LegacyLabwareLoadInfo,
)
from opentrons.protocol_api.contexts import ModuleContext as LegacyModuleContext


from opentrons.protocols.parse import parse
from opentrons.protocols.execution.execute import run_protocol
from opentrons.protocols.types import (
    Protocol as LegacyProtocol,
    JsonProtocol as LegacyJsonProtocol,
    PythonProtocol as LegacyPythonProtocol,
)

from .protocol_source import ProtocolSource


LEGACY_PYTHON_API_VERSION_CUTOFF = APIVersion(3, 0)

# TODO(mc, 2021-09-21): remove this condition, cut off before 6 always
LEGACY_JSON_SCHEMA_VERSION_CUTOFF = 5 if feature_flags.enable_protocol_engine() else 6


class LegacyFileReader:
    """Interface to read Protocol API v2 protocols prior to execution."""

    @staticmethod
    def read(protocol_source: ProtocolSource) -> LegacyProtocol:
        """Read a PAPIv2 protocol into a datastructure."""
        # TODO(mc, 2021-09-17): access the "main file" in a more
        # explicit way than the first entry in the files list
        protocol_file_path = protocol_source.files[0]
        protocol_contents = protocol_file_path.read_text()

        return parse(
            protocol_file=protocol_contents,
            filename=protocol_file_path.name,
        )


class LegacyContextCreator:
    """Interface to contruct Protocol API v2 contexts."""

    def __init__(
        self,
        hardware_api: HardwareAPI,
        use_simulating_implementation: bool,
    ) -> None:
        """Prepare the LegacyContextCreator.

        Args:
            hardware_api: The interface to the hardware API that the created
                Protocol API v2 contexts will use.
            use_simulating_implementation: Whether the created Protocol API v2 contexts
                should use a simulating implementation. See
                `opentrons.protocols.context.simulator`.
        """
        self._hardware_api = hardware_api
        self._use_simulating_implementation = use_simulating_implementation

    def create(
        self,
        api_version: APIVersion,
    ) -> LegacyProtocolContext:
        """Create a Protocol API v2 context."""
        if self._use_simulating_implementation:
            return LegacyProtocolContext(
                api_version=api_version,
                implementation=LegacyProtocolContextSimulation(
                    api_version=api_version, hardware=self._hardware_api
                ),
            )
        else:
            return LegacyProtocolContext(
                api_version=api_version,
                implementation=LegacyProtocolContextImplementation(
                    api_version=api_version,
                    hardware=self._hardware_api,
                ),
            )


class LegacyExecutor:
    """Interface to execute Protocol API v2 protocols in a child thread."""

    def __init__(self, hardware_api: HardwareAPI) -> None:
        self._hardware_api = hardware_api

    async def execute(
        self,
        protocol: LegacyProtocol,
        context: LegacyProtocolContext,
    ) -> None:
        """Execute a PAPIv2 protocol with a given ProtocolContext in a child thread."""
        loop = asyncio.get_running_loop()

        # NOTE: this initial home is to match the previous behavior of the
        # RPC session, which called `ctx.home` before calling `run_protocol`
        await self._hardware_api.home()

        with ThreadPoolExecutor(max_workers=1) as executor:
            await loop.run_in_executor(
                executor=executor,
                func=partial(run_protocol, protocol=protocol, context=context),
            )


__all__ = [
    # Re-exports of main public API stuff:
    "LegacyProtocolContext",
    "LegacyLabware",
    "LegacyPipetteContext",
    "LegacyModuleContext",
    # Re-exports of internal stuff:
    "LegacyProtocol",
    "LegacyJsonProtocol",
    "LegacyPythonProtocol",
    "LegacyLabwareLoadInfo",
    "LegacyInstrumentLoadInfo",
]

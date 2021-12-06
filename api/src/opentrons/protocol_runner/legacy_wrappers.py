"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
from anyio import to_thread

from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.modules.types import (
    ModuleModel as LegacyModuleModel,
    TemperatureModuleModel as LegacyTemperatureModuleModel,
    MagneticModuleModel as LegacyMagneticModuleModel,
    ThermocyclerModuleModel as LegacyThermocyclerModuleModel,
)
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
from opentrons.protocol_api.labware import Labware as LegacyLabware, Well as LegacyWell
from opentrons.protocol_api.load_info import (
    InstrumentLoadInfo as LegacyInstrumentLoadInfo,
    LabwareLoadInfo as LegacyLabwareLoadInfo,
    ModuleLoadInfo as LegacyModuleLoadInfo,
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
from .legacy_labware_offset_provider import LegacyLabwareOffsetProvider

# The earliest Python Protocol API version ("apiLevel") where the protocol's simulation
# and execution will be handled by Protocol Engine, rather than the legacy machinery.
#
# Note that even when simulation and execution are handled by the legacy machinery,
# Protocol Engine still has some involvement for analyzing the simulation and
# monitoring the execution.
LEGACY_PYTHON_API_VERSION_CUTOFF = APIVersion(3, 0)


# The earliest JSON protocol schema version where the protocol is executed directly by
# Protocol Engine, rather than going through Python Protocol API v2.
LEGACY_JSON_SCHEMA_VERSION_CUTOFF = 6


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
    """Interface to construct Protocol API v2 contexts."""

    def __init__(
        self,
        hardware_api: HardwareAPI,
        labware_offset_provider: LegacyLabwareOffsetProvider,
        use_simulating_implementation: bool,
    ) -> None:
        """Prepare the LegacyContextCreator.

        Args:
            hardware_api: The interface to the hardware API that the created
                Protocol API v2 contexts will use. Regardless of
                ``use_simulating_implementation``, this can either be a real hardware
                API to actually control the robot, or a simulating hardware API.
            labware_offset_provider: Interface for the context to load labware offsets.
            use_simulating_implementation: Whether the created Protocol API v2 contexts
                should use a simulating implementation, avoiding some calls to
                `hardware_api` for performance. See
                `opentrons.protocols.context.simulator`.
        """
        self._hardware_api = hardware_api
        self._use_simulating_implementation = use_simulating_implementation
        self._labware_offset_provider = labware_offset_provider

    def create(
        self,
        api_version: APIVersion,
    ) -> LegacyProtocolContext:
        """Create a Protocol API v2 context."""
        if self._use_simulating_implementation:
            return LegacyProtocolContext(
                api_version=api_version,
                labware_offset_provider=self._labware_offset_provider,
                implementation=LegacyProtocolContextSimulation(
                    api_version=api_version,
                    hardware=self._hardware_api,
                ),
            )
        else:
            return LegacyProtocolContext(
                api_version=api_version,
                labware_offset_provider=self._labware_offset_provider,
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
        # NOTE: this initial home is to match the previous behavior of the
        # RPC session, which called `ctx.home` before calling `run_protocol`
        await self._hardware_api.home()
        await to_thread.run_sync(run_protocol, protocol, context)


__all__ = [
    # Re-exports of main public API stuff:
    "LegacyProtocolContext",
    "LegacyLabware",
    "LegacyWell",
    "LegacyPipetteContext",
    "LegacyModuleContext",
    # Re-exports of internal stuff:
    "LegacyProtocol",
    "LegacyJsonProtocol",
    "LegacyPythonProtocol",
    "LegacyLabwareLoadInfo",
    "LegacyInstrumentLoadInfo",
    "LegacyModuleLoadInfo",
    "LegacyModuleModel",
    "LegacyMagneticModuleModel",
    "LegacyTemperatureModuleModel",
    "LegacyThermocyclerModuleModel",
]

"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
from anyio import to_thread
from typing import cast

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LegacyLabwareDefinition,
)

from opentrons.calibration_storage.helpers import uri_from_details

from opentrons.hardware_control import (
    HardwareControlAPI,
    ThreadManager,
    SynchronousAdapter,
)
from opentrons.hardware_control.modules.types import (
    ModuleModel as LegacyModuleModel,
    TemperatureModuleModel as LegacyTemperatureModuleModel,
    MagneticModuleModel as LegacyMagneticModuleModel,
    ThermocyclerModuleModel as LegacyThermocyclerModuleModel,
    HeaterShakerModuleModel as LegacyHeaterShakerModuleModel,
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
    LoadInfo as LegacyLoadInfo,
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

from opentrons.protocol_reader import ProtocolSource
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
        protocol_file_path = protocol_source.main_file
        protocol_contents = protocol_file_path.read_text(encoding="utf-8")

        return parse(
            protocol_file=protocol_contents,
            filename=protocol_file_path.name,
            extra_labware={
                uri_from_details(
                    namespace=lw.namespace,
                    load_name=lw.parameters.loadName,
                    version=lw.version,
                ): cast(LegacyLabwareDefinition, lw.dict(exclude_none=True))
                for lw in protocol_source.labware_definitions
            },
        )


class LegacyContextCreator:
    """Interface to construct Protocol API v2 contexts."""

    _ContextImplementation = LegacyProtocolContextImplementation

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        labware_offset_provider: LegacyLabwareOffsetProvider,
    ) -> None:
        """Prepare the LegacyContextCreator.

        Args:
            hardware_api: The hardware control interface.
                Will be wrapped in a `SynchronousAdapter`.
                May be real hardware or a simluator.
            labware_offset_provider: Interface for the context to load labware offsets.
        """
        self._hardware_api = hardware_api
        self._labware_offset_provider = labware_offset_provider

    def create(self, protocol: LegacyProtocol) -> LegacyProtocolContext:
        """Create a Protocol API v2 context."""
        api_version = protocol.api_level
        extra_labware = (
            protocol.extra_labware
            if isinstance(protocol, LegacyPythonProtocol)
            else None
        )

        if isinstance(self._hardware_api, ThreadManager):
            sync_hardware = self._hardware_api.sync
        else:
            sync_hardware = SynchronousAdapter(self._hardware_api)

        return LegacyProtocolContext(
            api_version=api_version,
            labware_offset_provider=self._labware_offset_provider,
            implementation=self._ContextImplementation(
                sync_hardware=sync_hardware,
                api_version=api_version,
                extra_labware=extra_labware,
            ),
        )


class LegacySimulatingContextCreator(LegacyContextCreator):
    """Interface to construct PAPIv2 contexts using simulating implementations.

    Avoids some calls to the hardware API for performance.
    See `opentrons.protocols.context.simulator`.
    """

    _ContextImplementation = LegacyProtocolContextSimulation


class LegacyExecutor:
    """Interface to execute Protocol API v2 protocols in a child thread."""

    @staticmethod
    async def execute(protocol: LegacyProtocol, context: LegacyProtocolContext) -> None:
        """Execute a PAPIv2 protocol with a given ProtocolContext in a child thread."""
        await to_thread.run_sync(run_protocol, protocol, context)


__all__ = [
    # Re-exports of user-facing Python Protocol APIv2 stuff:
    "LegacyProtocolContext",
    "LegacyLabware",
    "LegacyWell",
    "LegacyPipetteContext",
    "LegacyModuleContext",
    # Re-exports of internal stuff:
    "LegacyProtocol",
    "LegacyJsonProtocol",
    "LegacyPythonProtocol",
    "LegacyLoadInfo",
    "LegacyLabwareLoadInfo",
    "LegacyInstrumentLoadInfo",
    "LegacyModuleLoadInfo",
    "LegacyModuleModel",
    "LegacyMagneticModuleModel",
    "LegacyTemperatureModuleModel",
    "LegacyThermocyclerModuleModel",
    "LegacyHeaterShakerModuleModel",
    # legacy typed dicts
    "LegacyLabwareDefinition",
]

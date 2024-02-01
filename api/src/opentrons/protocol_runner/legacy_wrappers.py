"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
import asyncio
from typing import Dict, Iterable, Optional, cast

from anyio import to_thread

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LegacyLabwareDefinition,
)
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules.types import (
    ModuleModel as LegacyModuleModel,
    TemperatureModuleModel as LegacyTemperatureModuleModel,
    MagneticModuleModel as LegacyMagneticModuleModel,
    ThermocyclerModuleModel as LegacyThermocyclerModuleModel,
    HeaterShakerModuleModel as LegacyHeaterShakerModuleModel,
)
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_reader import ProtocolSource, ProtocolFileRole
from opentrons.util.broker import Broker

from opentrons.protocol_api import (
    ProtocolContext as LegacyProtocolContext,
    InstrumentContext as LegacyPipetteContext,
    ModuleContext as LegacyModuleContext,
    Labware as LegacyLabware,
    Well as LegacyWell,
    create_protocol_context,
)
from opentrons.protocol_api.core.engine import ENGINE_CORE_API_VERSION
from opentrons.protocol_api.core.legacy.load_info import (
    LoadInfo as LegacyLoadInfo,
    InstrumentLoadInfo as LegacyInstrumentLoadInfo,
    LabwareLoadInfo as LegacyLabwareLoadInfo,
    ModuleLoadInfo as LegacyModuleLoadInfo,
)

from opentrons.protocols.parse import PythonParseMode, parse
from opentrons.protocols.execution.execute import run_protocol
from opentrons.protocols.types import (
    Protocol as LegacyProtocol,
    JsonProtocol as LegacyJsonProtocol,
    PythonProtocol as LegacyPythonProtocol,
)

# The earliest Python Protocol API version ("apiLevel") where the protocol's simulation
# and execution will be handled by Protocol Engine, rather than the legacy machinery.
#
# Note that even when simulation and execution are handled by the legacy machinery,
# Protocol Engine still has some involvement for analyzing the simulation and
# monitoring the execution.
LEGACY_PYTHON_API_VERSION_CUTOFF = ENGINE_CORE_API_VERSION


# The earliest JSON protocol schema version where the protocol is executed directly by
# Protocol Engine, rather than going through Python Protocol API v2.
LEGACY_JSON_SCHEMA_VERSION_CUTOFF = 6


class LegacyFileReader:
    """Interface to read Protocol API v2 protocols prior to execution."""

    @staticmethod
    def read(
        protocol_source: ProtocolSource,
        labware_definitions: Iterable[LabwareDefinition],
        python_parse_mode: PythonParseMode,
    ) -> LegacyProtocol:
        """Read a PAPIv2 protocol into a data structure."""
        protocol_file_path = protocol_source.main_file
        protocol_contents = protocol_file_path.read_text(encoding="utf-8")
        legacy_labware_definitions: Dict[str, LegacyLabwareDefinition] = {
            uri_from_details(
                namespace=lw.namespace,
                load_name=lw.parameters.loadName,
                version=lw.version,
            ): cast(LegacyLabwareDefinition, lw.dict(exclude_none=True))
            for lw in labware_definitions
        }
        data_file_paths = [
            data_file.path
            for data_file in protocol_source.files
            if data_file.role == ProtocolFileRole.DATA
        ]

        return parse(
            protocol_file=protocol_contents,
            filename=protocol_file_path.name,
            extra_labware=legacy_labware_definitions,
            extra_data={
                data_path.name: data_path.read_bytes() for data_path in data_file_paths
            },
            python_parse_mode=python_parse_mode,
        )


# TODO (spp, 2023-04-05): Remove 'legacy' wording since this is the context we are using
#  for all python protocols.
class LegacyContextCreator:
    """Interface to construct Protocol API v2 contexts."""

    _USE_SIMULATING_CORE = False

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        protocol_engine: ProtocolEngine,
    ) -> None:
        """Prepare the LegacyContextCreator.

        Args:
            hardware_api: The hardware control interface.
                Will be wrapped in a `SynchronousAdapter`.
                May be real hardware or a simulator.
            protocol_engine: Interface for the context to load labware offsets.
        """
        self._hardware_api = hardware_api
        self._protocol_engine = protocol_engine

    def create(
        self,
        protocol: LegacyProtocol,
        broker: Optional[LegacyBroker],
        equipment_broker: Optional[Broker[LegacyLoadInfo]],
    ) -> LegacyProtocolContext:
        """Create a Protocol API v2 context."""
        extra_labware = (
            protocol.extra_labware
            if isinstance(protocol, LegacyPythonProtocol)
            else None
        )

        bundled_data = (
            protocol.bundled_data
            if isinstance(protocol, LegacyPythonProtocol)
            else None
        )

        return create_protocol_context(
            api_version=protocol.api_level,
            hardware_api=self._hardware_api,
            deck_type=self._protocol_engine.state_view.config.deck_type.value,
            protocol_engine=self._protocol_engine,
            protocol_engine_loop=asyncio.get_running_loop(),
            broker=broker,
            equipment_broker=equipment_broker,
            extra_labware=extra_labware,
            use_simulating_core=self._USE_SIMULATING_CORE,
            bundled_data=bundled_data,
        )


class LegacySimulatingContextCreator(LegacyContextCreator):
    """Interface to construct PAPIv2 contexts using simulating implementations.

    Avoids some calls to the hardware API for performance.
    See `opentrons.protocols.context.simulator`.
    """

    _USE_SIMULATING_CORE = True


class LegacyExecutor:
    """Interface to execute Protocol API v2 protocols in a child thread."""

    @staticmethod
    async def execute(protocol: LegacyProtocol, context: LegacyProtocolContext) -> None:
        """Execute a PAPIv2 protocol with a given ProtocolContext in a child thread."""
        await to_thread.run_sync(run_protocol, protocol, context)


__all__ = [
    # Re-exports of user-facing Python Protocol APIv2 stuff:
    # TODO(mc, 2022-08-22): remove, no longer "legacy", so re-exports unnecessary
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

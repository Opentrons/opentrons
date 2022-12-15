"""Wrappers for the legacy, Protocol API v2 execution pipeline."""
import asyncio
from typing import Dict, Iterable, Optional, cast

from anyio import to_thread

from opentrons_shared_data.labware.dev_types import (
    LabwareDefinition as LegacyLabwareDefinition,
)
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.broker import Broker
from opentrons.equipment_broker import EquipmentBroker
from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.modules.types import (
    ModuleModel as LegacyModuleModel,
    TemperatureModuleModel as LegacyTemperatureModuleModel,
    MagneticModuleModel as LegacyMagneticModuleModel,
    ThermocyclerModuleModel as LegacyThermocyclerModuleModel,
    HeaterShakerModuleModel as LegacyHeaterShakerModuleModel,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_reader import ProtocolSource

from opentrons.protocol_api import (
    ProtocolContext as LegacyProtocolContext,
    InstrumentContext as LegacyPipetteContext,
    ModuleContext as LegacyModuleContext,
    Labware as LegacyLabware,
    Well as LegacyWell,
    create_protocol_context,
)
from opentrons.protocol_api.core.protocol_api.load_info import (
    LoadInfo as LegacyLoadInfo,
    InstrumentLoadInfo as LegacyInstrumentLoadInfo,
    LabwareLoadInfo as LegacyLabwareLoadInfo,
    ModuleLoadInfo as LegacyModuleLoadInfo,
)

from opentrons.protocols.parse import parse
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
LEGACY_PYTHON_API_VERSION_CUTOFF = APIVersion(3, 0)


# The earliest JSON protocol schema version where the protocol is executed directly by
# Protocol Engine, rather than going through Python Protocol API v2.
LEGACY_JSON_SCHEMA_VERSION_CUTOFF = 6


class LegacyFileReader:
    """Interface to read Protocol API v2 protocols prior to execution."""

    @staticmethod
    def read(
        protocol_source: ProtocolSource,
        labware_definitions: Iterable[LabwareDefinition],
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

        return parse(
            protocol_file=protocol_contents,
            filename=protocol_file_path.name,
            extra_labware=legacy_labware_definitions,
        )


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
        broker: Optional[Broker],
        equipment_broker: Optional[EquipmentBroker[LegacyLoadInfo]],
    ) -> LegacyProtocolContext:
        """Create a Protocol API v2 context."""
        extra_labware = (
            protocol.extra_labware
            if isinstance(protocol, LegacyPythonProtocol)
            else None
        )

        return create_protocol_context(
            api_version=protocol.api_level,
            hardware_api=self._hardware_api,
            protocol_engine=self._protocol_engine,
            protocol_engine_loop=asyncio.get_running_loop(),
            broker=broker,
            equipment_broker=equipment_broker,
            extra_labware=extra_labware,
            use_simulating_core=self._USE_SIMULATING_CORE,
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

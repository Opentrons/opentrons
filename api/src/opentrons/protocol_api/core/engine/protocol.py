"""ProtocolEngine-based Protocol API core implementation."""
from typing import Dict, Optional

from opentrons_shared_data.labware.dev_types import LabwareDefinition

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons.types import Mount, MountType, Location, DeckLocation
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.modules.types import ModuleModel
from opentrons.protocols.api_support.util import AxisMaxSpeeds
from opentrons.protocols.geometry.deck import Deck
from opentrons.protocols.geometry.deck_item import DeckItem

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient

from ..protocol import AbstractProtocol, LoadModuleResult
from .labware import LabwareCore
from .instrument import InstrumentCore


# TODO(mc, 2022-08-24): many of these methods are likely unnecessary
# in a ProtocolEngine world. As we develop this core, we should remove
# and consolidate logic as we need to across all cores rather than
# necessarily try to support every one of these behaviors in the engine.
class ProtocolCore(AbstractProtocol[InstrumentCore, LabwareCore]):
    """Protocol API core using a ProtocolEngine.

    Args:
        engine_client: A synchronous client to the ProtocolEngine
            that is executing the protocol.
    """

    def __init__(self, engine_client: ProtocolEngineClient) -> None:
        self._engine_client = engine_client

    def get_bundled_data(self) -> Dict[str, bytes]:
        """Get a map of file names to byte contents.

        Deprecated method for past experiment with ZIP protocols.
        """
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_bundled_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        """Get a map of labware names to definition dicts.

        Deprecated method used for past experiment with ZIP protocols.
        """
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_extra_labware(self) -> Optional[Dict[str, LabwareDefinition]]:
        """Get a map of extra labware names to definition dicts.

        Used to assist load custom labware definitions.
        """
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_max_speeds(self) -> AxisMaxSpeeds:
        """Get a control interface for maximum move speeds."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_hardware(self) -> SyncHardwareAPI:
        """Get direct access to a hardware control interface."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def is_simulating(self) -> bool:
        """Get whether the protocol is being analyzed or actually run."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def load_labware_from_definition(
        self,
        labware_def: LabwareDefinition,
        location: DeckLocation,
        label: Optional[str],
    ) -> LabwareCore:
        """Load a labware using its definition dictionary."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def load_labware(
        self,
        load_name: str,
        location: DeckLocation,
        label: Optional[str],
        namespace: Optional[str],
        version: Optional[int],
    ) -> LabwareCore:
        """Load a labware using its identifying parameters."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def load_module(
        self,
        model: ModuleModel,
        location: Optional[DeckLocation],
        configuration: Optional[str],
    ) -> Optional[LoadModuleResult]:
        """Load a module into the protocol."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_loaded_modules(self) -> Dict[int, LoadModuleResult]:
        """Get all loaded modules by deck slot number."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def load_instrument(
        self, instrument_name: PipetteName, mount: Mount
    ) -> InstrumentCore:
        """Load an instrument into the protocol.

        Args:
            instrument_name: Load name of the instrument.
            mount: Mount the instrument is attached to.

        Returns:
            An instrument core configured to use the requested instrument.
        """
        engine_mount = MountType[mount.name]
        load_result = self._engine_client.load_pipette(instrument_name, engine_mount)

        return InstrumentCore(pipette_id=load_result.pipetteId)

    def get_loaded_instruments(self) -> Dict[Mount, Optional[InstrumentCore]]:
        """Get all loaded instruments by mount."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def pause(self, msg: Optional[str]) -> None:
        """Pause the protocol."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def resume(self) -> None:
        """Resume the protocol."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def comment(self, msg: str) -> None:
        """Create a comment in the protocol to be shown in the log."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def delay(self, seconds: float, msg: Optional[str]) -> None:
        """Wait for a period of time before proceeding."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def home(self) -> None:
        """Move all axes to their home positions."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_deck(self) -> Deck:
        """Get an interface to get and modify the deck layout."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_fixed_trash(self) -> DeckItem:
        """Get the fixed trash labware."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def set_rail_lights(self, on: bool) -> None:
        """Set the device's rail lights."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_rail_lights_on(self) -> bool:
        """Get whether the device's rail lights are on."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def door_closed(self) -> bool:
        """Get whether the device's front door is closed."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def get_last_location(
        self,
        mount: Optional[Mount] = None,
    ) -> Optional[Location]:
        """Get the last accessed location."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

    def set_last_location(
        self,
        location: Optional[Location],
        mount: Optional[Mount] = None,
    ) -> None:
        """Set the last accessed location."""
        raise NotImplementedError("ProtocolEngine PAPI core not implemented")

"""ProtocolEngine-based InstrumentContext core implementation."""
from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from opentrons.types import Location, Mount
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, FlowRates
from opentrons.protocol_engine import DeckPoint, WellLocation
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from ..instrument import AbstractInstrument
from .well import WellCore

if TYPE_CHECKING:
    from .protocol import ProtocolCore


class InstrumentCore(AbstractInstrument[WellCore]):
    """Instrument API core using a ProtocolEngine.

    Args:
        pipette_id: ProtocolEngine ID of the loaded instrument.
    """

    def __init__(
        self,
        pipette_id: str,
        engine_client: EngineClient,
        sync_hardware_api: SyncHardwareAPI,
        protocol_core: ProtocolCore,
    ) -> None:
        self._pipette_id = pipette_id
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api
        self._protocol_core = protocol_core

        # TODO(jbl 2022-11-09) clearances should be move out of the core
        self._well_bottom_clearances = Clearances(
            default_aspirate=1.0, default_dispense=1.0
        )
        # TODO(jbl 2022-11-03) flow_rates should not live in the cores, and should be moved to the protocol context
        #   along with other rate related refactors (for the hardware API)
        self._flow_rates = FlowRates(self)
        self._flow_rates.set_defaults(MAX_SUPPORTED_VERSION)

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        raise NotImplementedError("InstrumentCore.get_default_speed not implemented")

    def set_default_speed(self, speed: float) -> None:
        raise NotImplementedError("InstrumentCore.set_default_speed not implemented")

    def aspirate(
        self,
        location: Location,
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
    ) -> None:
        if well_core is None:
            raise NotImplementedError(
                "InstrumentCore.aspirate with well_core value of None not implemented"
            )

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = self._engine_client.state.geometry.get_relative_well_location(
            labware_id=labware_id,
            well_name=well_name,
            absolute_point=location.point,
        )

        self._engine_client.aspirate(
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            volume=volume,
            flow_rate=flow_rate,
        )

    def dispense(self, volume: float, rate: float) -> None:
        raise NotImplementedError("InstrumentCore.dispense not implemented")

    def blow_out(self) -> None:
        raise NotImplementedError("InstrumentCore.blow_out not implemented")

    def touch_tip(
        self,
        location: WellCore,
        radius: float,
        v_offset: float,
        speed: float,
    ) -> None:
        raise NotImplementedError("InstrumentCore.touch_tip not implemented")

    def pick_up_tip(
        self,
        location: Location,
        well_core: WellCore,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        """Move to and pick up a tip from a given well.

        Args:
            location: The location of the well we're picking up from.
                Used to calculate the relative well offset for the pick up command.
            well_core: The "well" to pick up from.
            presses: Customize the number of presses the pipette does.
            increment: Customize the movement "distance" of the pipette to press harder.
            prep_after: Not used by this core, pipette preparation will always happen.
        """
        if presses is not None or increment is not None:
            raise NotImplementedError(
                "InstrumentCore.pick_up_tip with custom presses or increment not implemented"
            )

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = self._engine_client.state.geometry.get_relative_well_location(
            labware_id=labware_id,
            well_name=well_name,
            absolute_point=location.point,
        )

        self._engine_client.pick_up_tip(
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

    def drop_tip(
        self, location: Optional[Location], well_core: WellCore, home_after: bool
    ) -> None:
        """Move to and drop a tip into a given well.

        Args:
            location: The location of the well we're picking up from.
                Used to calculate the relative well offset for the drop command.
            well_core: The well we're dropping into
            home_after: Whether to home the pipette after the tip is dropped.
        """
        if location is not None:
            raise NotImplementedError(
                "InstrumentCore.drop_tip with non-default drop location not implemented"
            )

        if home_after is False:
            raise NotImplementedError(
                "InstrumentCore.drop_tip with home_after=False not implemented"
            )

        well_name = well_core.get_name()
        labware_id = well_core.labware_id
        well_location = WellLocation()

        self._engine_client.drop_tip(
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

    def home(self) -> None:
        raise NotImplementedError("InstrumentCore.home not implemented")

    def home_plunger(self) -> None:
        raise NotImplementedError("InstrumentCore.home_plunger not implemented")

    def move_to(
        self,
        location: Location,
        well_core: Optional[WellCore],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        if speed is not None:
            raise NotImplementedError(
                "InstrumentCore.move_to with explicit speed not implemented"
            )

        if well_core is not None and (
            force_direct is True or minimum_z_height is not None
        ):
            raise NotImplementedError(
                "InstrumentCore.move_to with well and extra move parameters not implemented"
            )

        if well_core is not None:
            if force_direct is True or minimum_z_height is not None:
                raise NotImplementedError(
                    "InstrumentCore.move_to with well and extra move parameters not implemented"
                )

            labware_id = well_core.labware_id
            well_name = well_core.get_name()
            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            self._engine_client.move_to_well(
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
        else:
            self._engine_client.move_to_coordinates(
                pipette_id=self._pipette_id,
                coordinates=DeckPoint(
                    x=location.point.x, y=location.point.y, z=location.point.z
                ),
                minimum_z_height=minimum_z_height,
                force_direct=force_direct,
            )
        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def get_mount(self) -> Mount:
        """Get the mount the pipette is attached to."""
        return self._engine_client.state.pipettes.get(
            self._pipette_id
        ).mount.to_hw_mount()

    def get_pipette_name(self) -> str:
        """Get the pipette's load name as a string.

        Will match the load name of the actually loaded pipette,
        which may differ from the requested load name.
        """
        return self._engine_client.state.pipettes.get(
            self._pipette_id
        ).pipetteName.value

    def get_model(self) -> str:
        raise NotImplementedError("InstrumentCore.get_model not implemented")

    def get_min_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_min_volume not implemented")

    def get_max_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_max_volume not implemented")

    def get_current_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_current_volume not implemented")

    def get_available_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_available_volume not implemented")

    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
        return self._sync_hardware_api.get_attached_instrument(self.get_mount())  # type: ignore[no-any-return]

    def get_channels(self) -> int:
        raise NotImplementedError("InstrumentCore.get_channels not implemented")

    def has_tip(self) -> bool:
        return self.get_hardware_state()["has_tip"]

    def is_ready_to_aspirate(self) -> bool:
        raise NotImplementedError("InstrumentCore.is_ready_to_aspirate not implemented")

    def prepare_for_aspirate(self) -> None:
        raise NotImplementedError("InstrumentCore.prepare_for_aspirate not implemented")

    def get_return_height(self) -> float:
        raise NotImplementedError("InstrumentCore.get_return_height not implemented")

    def get_well_bottom_clearance(self) -> Clearances:
        return self._well_bottom_clearances

    def get_speed(self) -> PlungerSpeeds:
        raise NotImplementedError("InstrumentCore.get_speed not implemented")

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rates

    def get_absolute_aspirate_flow_rate(self, rate: float) -> float:
        return self._flow_rates.aspirate * rate

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        self._sync_hardware_api.set_flow_rate(
            mount=self.get_mount(),
            aspirate=aspirate,
            dispense=dispense,
            blow_out=blow_out,
        )

    def set_pipette_speed(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        raise NotImplementedError("InstrumentCore.set_pipette_speed not implemented")

"""ProtocolEngine-based InstrumentContext core implementation."""
from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from opentrons.types import Location, Mount
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import PlungerSpeeds, FlowRates
from opentrons.protocol_engine import DeckPoint, WellLocation
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from opentrons_shared_data.pipette.dev_types import PipetteNameType

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
        default_movement_speed: float,
    ) -> None:
        self._pipette_id = pipette_id
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api
        self._protocol_core = protocol_core

        # TODO(jbl 2022-11-03) flow_rates should not live in the cores, and should be moved to the protocol context
        #   along with other rate related refactors (for the hardware API)
        self._flow_rates = FlowRates(self)
        self._flow_rates.set_defaults(MAX_SUPPORTED_VERSION)

        self.set_default_speed(speed=default_movement_speed)

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        speed = self._engine_client.state.pipettes.get_movement_speed(
            pipette_id=self._pipette_id
        )
        assert speed is not None, "Pipette loading should have set a default speed."
        return speed

    def set_default_speed(self, speed: float) -> None:
        self._engine_client.set_pipette_movement_speed(
            pipette_id=self._pipette_id, speed=speed
        )

    def aspirate(
        self,
        location: Location,
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
    ) -> None:
        """Aspirate a given volume of liquid from the specified location.
        Args:
            volume: The volume of liquid to aspirate, in microliters.
            location: The exact location to aspirate from.
            well_core: The well to aspirate from, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to aspirate at.
        """
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

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def dispense(
        self,
        location: Location,
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
    ) -> None:
        """Dispense a given volume of liquid into the specified location.
        Args:
            volume: The volume of liquid to dispense, in microliters.
            location: The exact location to dispense to.
            well_core: The well to dispense to, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to dispense at.
        """
        if well_core is None:
            raise NotImplementedError(
                "InstrumentCore.dispense with well_core value of None not implemented"
            )

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = self._engine_client.state.geometry.get_relative_well_location(
            labware_id=labware_id, well_name=well_name, absolute_point=location.point
        )

        self._engine_client.dispense(
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            volume=volume,
            flow_rate=flow_rate,
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def blow_out(
        self, location: Location, well_core: Optional[WellCore], move_to_well: bool
    ) -> None:
        """Blow liquid out of the tip.

        Args:
            location: The location to blow out into.
            well_core: The well to blow out into.
            move_to_well: Unused by engine core.
        """
        if well_core is None:
            raise NotImplementedError("In-place blow-out is not implemented")

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = self._engine_client.state.geometry.get_relative_well_location(
            labware_id=labware_id,
            well_name=well_name,
            absolute_point=location.point,
        )

        self._engine_client.blow_out(
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            # TODO(jbl 2022-11-07) PAPIv2 does not have an argument for rate and
            #   this also needs to be refactored along with other flow rate related issues
            flow_rate=self.get_absolute_blow_out_flow_rate(1.0),
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

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

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

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

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def home(self) -> None:
        z_axis = self._engine_client.state.pipettes.get_z_axis(self._pipette_id)
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.home([z_axis, plunger_axis])

    def home_plunger(self) -> None:
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.home([plunger_axis])

    def move_to(
        self,
        location: Location,
        well_core: Optional[WellCore],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:

        if well_core is not None:
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
                minimum_z_height=minimum_z_height,
                force_direct=force_direct,
                speed=speed,
            )
        else:
            self._engine_client.move_to_coordinates(
                pipette_id=self._pipette_id,
                coordinates=DeckPoint(
                    x=location.point.x, y=location.point.y, z=location.point.z
                ),
                minimum_z_height=minimum_z_height,
                force_direct=force_direct,
                speed=speed,
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
        # TODO (tz, 11-23-22): revert this change when merging
        # https://opentrons.atlassian.net/browse/RLIQ-251
        pipette = self._engine_client.state.pipettes.get(self._pipette_id)
        return (
            pipette.pipetteName.value
            if isinstance(pipette.pipetteName, PipetteNameType)
            else pipette.pipetteName
        )

    def get_model(self) -> str:
        return self._engine_client.state.pipettes.get_model_name(self._pipette_id)

    def get_min_volume(self) -> float:
        return self._engine_client.state.pipettes.get_minimum_volume(self._pipette_id)

    def get_max_volume(self) -> float:
        return self._engine_client.state.pipettes.get_maximum_volume(self._pipette_id)

    def get_current_volume(self) -> float:
        # TODO(mc, 2022-11-11): https://opentrons.atlassian.net/browse/RCORE-381
        return self.get_hardware_state()["current_volume"]

    def get_available_volume(self) -> float:
        # TODO(mc, 2022-11-11): https://opentrons.atlassian.net/browse/RCORE-381
        return self.get_hardware_state()["available_volume"]

    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
        return self._sync_hardware_api.get_attached_instrument(self.get_mount())  # type: ignore[no-any-return]

    def get_channels(self) -> int:
        return self._engine_client.state.tips.get_pipette_channels(self._pipette_id)

    def has_tip(self) -> bool:
        return self.get_hardware_state()["has_tip"]

    def is_ready_to_aspirate(self) -> bool:
        raise NotImplementedError("InstrumentCore.is_ready_to_aspirate not implemented")

    def prepare_for_aspirate(self) -> None:
        raise NotImplementedError("InstrumentCore.prepare_for_aspirate not implemented")

    def get_return_height(self) -> float:
        raise NotImplementedError("InstrumentCore.get_return_height not implemented")

    def get_speed(self) -> PlungerSpeeds:
        raise NotImplementedError("InstrumentCore.get_speed not implemented")

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rates

    def get_absolute_aspirate_flow_rate(self, rate: float) -> float:
        return self._flow_rates.aspirate * rate

    def get_absolute_dispense_flow_rate(self, rate: float) -> float:
        return self._flow_rates.dispense * rate

    def get_absolute_blow_out_flow_rate(self, rate: float) -> float:
        return self._flow_rates.blow_out * rate

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

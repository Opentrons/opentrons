from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

from opentrons import types
from opentrons.hardware_control import NoTipAttachedError, TipAttachedError
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import HardwareAction
from opentrons.protocols.api_support import instrument as instrument_support
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.util import FlowRates, PlungerSpeeds, Clearances
from opentrons.protocols.geometry import planning

from ..instrument import AbstractInstrument
from ..protocol_api.well import WellImplementation


if TYPE_CHECKING:
    from .protocol_context import ProtocolContextSimulation


_log = logging.getLogger()

_PRE_2_2_TIP_DROP_HEIGHT_MM = 10
"""In PAPIv2.1 and below, tips are always dropped 10 mm from the bottom of the well."""


class InstrumentContextSimulation(AbstractInstrument[WellImplementation]):
    """A simulation of an instrument context."""

    def __init__(
        self,
        protocol_interface: ProtocolContextSimulation,
        pipette_dict: PipetteDict,
        mount: types.Mount,
        instrument_name: str,
        default_speed: float = 400.0,
        api_version: Optional[APIVersion] = None,
    ):
        """Constructor."""
        self._protocol_interface = protocol_interface
        self._mount = mount
        self._pipette_dict = pipette_dict
        self._instrument_name = instrument_name
        self._default_speed = default_speed
        self._api_version = api_version or MAX_SUPPORTED_VERSION
        self._flow_rate = FlowRates(self)
        self._flow_rate.set_defaults(api_level=self._api_version)
        self._plunger_speeds = PlungerSpeeds(self)
        # Cache the maximum instrument height
        self._instrument_max_height = (
            protocol_interface.get_hardware().get_instrument_max_height(self._mount)
        )

    def get_default_speed(self) -> float:
        return self._default_speed

    def set_default_speed(self, speed: float) -> None:
        self._default_speed = speed

    def aspirate(
        self,
        location: types.Location,
        well_core: Optional[WellImplementation],
        volume: float,
        rate: float,
        flow_rate: float,
    ) -> None:
        if self.get_current_volume() == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration
            if self._api_version < APIVersion(2, 3) or not self.is_ready_to_aspirate():
                if location.labware.is_well:
                    self.move_to(
                        location=location.labware.as_well().top(), well_core=well_core
                    )
                else:
                    # TODO(seth,2019/7/29): This should be a warning exposed
                    #  via rpc to the runapp
                    _log.warning(
                        "When aspirate is called on something other than a "
                        "well relative position, we can't move to the top of"
                        " the well to prepare for aspiration. This might "
                        "cause over aspiration if the previous command is a "
                        "blow_out."
                    )
                self.prepare_for_aspirate()
            self.move_to(location=location, well_core=well_core)
        elif location != self._protocol_interface.get_last_location():
            self.move_to(location=location, well_core=well_core)

        self._raise_if_no_tip(HardwareAction.ASPIRATE.name)
        new_volume = self.get_current_volume() + volume
        assert (
            new_volume <= self._pipette_dict["working_volume"]
        ), "Cannot aspirate more than pipette max volume"
        self._pipette_dict["ready_to_aspirate"] = True
        self._update_volume(new_volume)

    def dispense(self, volume: float, rate: float) -> None:
        self._raise_if_no_tip(HardwareAction.DISPENSE.name)
        self._update_volume(self.get_current_volume() - volume)

    def blow_out(self) -> None:
        self._raise_if_no_tip(HardwareAction.BLOWOUT.name)
        self._update_volume(0)
        self._pipette_dict["ready_to_aspirate"] = False

    def _update_volume(self, vol: float) -> None:
        self._pipette_dict["current_volume"] = vol
        self._pipette_dict["available_volume"] = (
            self._pipette_dict["working_volume"] - vol
        )

    def touch_tip(
        self, location: WellImplementation, radius: float, v_offset: float, speed: float
    ) -> None:
        pass

    def pick_up_tip(
        self,
        location: types.Location,
        well_core: WellImplementation,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        geometry = well_core.get_geometry()
        tip_rack_core = geometry.parent
        tip_length = instrument_support.tip_length_for(
            pipette=self._pipette_dict,
            tip_rack_definition=tip_rack_core.get_definition(),
        )

        self.move_to(location=location)
        self._raise_if_tip("pick up tip")
        self._pipette_dict["has_tip"] = True
        self._pipette_dict["tip_length"] = tip_length
        self._pipette_dict["current_volume"] = 0
        self._pipette_dict["working_volume"] = min(
            geometry.max_volume, self.get_max_volume()
        )
        self._pipette_dict["available_volume"] = self._pipette_dict["working_volume"]
        if prep_after:
            self._pipette_dict["ready_to_aspirate"] = True

        tip_rack_core.get_tip_tracker().use_tips(
            start_well=well_core,
            num_channels=self.get_channels(),
            fail_if_full=self._api_version < APIVersion(2, 2),
        )

    def drop_tip(
        self,
        location: Optional[types.Location],
        well_core: WellImplementation,
        home_after: bool,
    ) -> None:
        labware_core = well_core.get_geometry().parent

        if location is None:
            from opentrons.protocol_api.labware import Labware, Well

            labware = Labware(
                implementation=labware_core, api_version=self._api_version
            )
            well = Well(
                parent=labware,
                well_implementation=well_core,
                api_version=self._api_version,
            )

            if LabwareLike(labware).is_fixed_trash():
                location = well.top()
            elif self._api_version < APIVersion(2, 2):
                location = well.bottom(z=_PRE_2_2_TIP_DROP_HEIGHT_MM)
            else:
                assert (
                    labware_core.is_tip_rack()
                ), "Expected tip drop target to be a tip rack."

                return_height = self.get_return_height()
                location = well.top(z=-return_height * labware_core.get_tip_length())

        self.move_to(location=location)
        self._raise_if_no_tip(HardwareAction.DROPTIP.name)
        self._pipette_dict["has_tip"] = False
        self._pipette_dict["tip_length"] = 0.0
        self._update_volume(0)

        if self._api_version < APIVersion(2, 2) and labware_core.is_tip_rack():
            # If this is a tiprack we can try and add the dirty tip back to the tracker
            try:
                labware_core.get_tip_tracker().return_tips(
                    start_well=well_core,
                    num_channels=self.get_channels(),
                )
            except AssertionError:
                # Similarly to :py:meth:`return_tips`, the failure case here
                # just means the tip can't be reused, so don't actually stop
                # the protocol
                _log.warning(
                    f"Could not return tip to {labware_core.get_display_name()}"
                )

    def home(self) -> None:
        self._protocol_interface.set_last_location(None)

    def home_plunger(self) -> None:
        pass

    def move_to(
        self,
        location: types.Location,
        well_core: Optional[WellImplementation] = None,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> None:
        """Simulation of only the motion planning portion of move_to."""
        last_location = self._protocol_interface.get_last_location()
        if last_location:
            from_loc = last_location
        else:
            from_loc = types.Location(types.Point(0, 0, 0), LabwareLike(None))

        # We just want to catch planning errors.
        planning.plan_moves(
            from_loc,
            location,
            self._protocol_interface.get_deck(),
            self._instrument_max_height,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
        )

        self._protocol_interface.set_last_location(location)

    def get_mount(self) -> types.Mount:
        return self._mount

    def get_requested_as_name(self) -> str:
        return self._instrument_name

    def get_pipette_name(self) -> str:
        return self._pipette_dict["name"]

    def get_model(self) -> str:
        return self._pipette_dict["model"]

    def get_min_volume(self) -> float:
        return self._pipette_dict["min_volume"]

    def get_max_volume(self) -> float:
        return self._pipette_dict["max_volume"]

    def get_current_volume(self) -> float:
        return self._pipette_dict["current_volume"]

    def get_available_volume(self) -> float:
        return self._pipette_dict["available_volume"]

    def get_hardware_state(self) -> PipetteDict:
        return self._pipette_dict

    def get_channels(self) -> int:
        return self._pipette_dict["channels"]

    def has_tip(self) -> bool:
        return self._pipette_dict["has_tip"]

    def is_ready_to_aspirate(self) -> bool:
        return self._pipette_dict["ready_to_aspirate"]

    def prepare_for_aspirate(self) -> None:
        self._raise_if_no_tip(HardwareAction.PREPARE_ASPIRATE.name)

    def get_return_height(self) -> float:
        return self._pipette_dict["return_tip_height"]

    def get_well_bottom_clearance(self) -> Clearances:
        return Clearances(default_aspirate=1, default_dispense=1)

    def get_speed(self) -> PlungerSpeeds:
        return self._plunger_speeds

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rate

    def get_absolute_aspirate_flow_rate(self, rate: float) -> float:
        return self._flow_rate.aspirate * rate

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        self._protocol_interface.get_hardware().set_flow_rate(
            mount=self._mount,
            aspirate=aspirate,
            dispense=dispense,
            blow_out=blow_out,
        )
        self._update_flow_rate()

    def set_pipette_speed(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        self._protocol_interface.get_hardware().set_pipette_speed(
            mount=self._mount,
            aspirate=aspirate,
            dispense=dispense,
            blow_out=blow_out,
        )
        self._update_flow_rate()

    def _update_flow_rate(self) -> None:
        """Update cached speed and flow rates from hardware controller pipette."""
        p = self._protocol_interface.get_hardware().get_attached_instrument(
            self.get_mount()
        )
        self._pipette_dict["aspirate_flow_rate"] = p["aspirate_flow_rate"]
        self._pipette_dict["dispense_flow_rate"] = p["dispense_flow_rate"]
        self._pipette_dict["blow_out_flow_rate"] = p["blow_out_flow_rate"]
        self._pipette_dict["aspirate_speed"] = p["aspirate_speed"]
        self._pipette_dict["dispense_speed"] = p["dispense_speed"]
        self._pipette_dict["blow_out_speed"] = p["blow_out_speed"]

    def _raise_if_no_tip(self, action: str) -> None:
        """Raise NoTipAttachedError if no tip."""
        if not self.has_tip():
            raise NoTipAttachedError(f"Cannot perform {action} without a tip attached")

    def _raise_if_tip(self, action: str) -> None:
        """Raise TipAttachedError if tip."""
        if self.has_tip():
            raise TipAttachedError(f"Cannot {action} with a tip attached")

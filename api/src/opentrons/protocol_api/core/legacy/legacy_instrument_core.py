from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

from opentrons import types
from opentrons.hardware_control import CriticalPoint
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support import instrument as instrument_support
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import (
    build_edges,
    FlowRates,
    PlungerSpeeds,
    APIVersionError,
)
from opentrons.protocols.geometry import planning

from ..instrument import AbstractInstrument
from .legacy_well_core import LegacyWellCore
from .legacy_module_core import LegacyThermocyclerCore, LegacyHeaterShakerCore

if TYPE_CHECKING:
    from .legacy_protocol_core import LegacyProtocolCore


_log = logging.getLogger()

_PRE_2_2_TIP_DROP_HEIGHT_MM = 10
"""In PAPIv2.1 and below, tips are always dropped 10 mm from the bottom of the well."""


class LegacyInstrumentCore(AbstractInstrument[LegacyWellCore]):
    """Implementation of the InstrumentContext interface."""

    def __init__(
        self,
        protocol_interface: LegacyProtocolCore,
        mount: types.Mount,
        instrument_name: str,
        default_speed: float,
        api_version: Optional[APIVersion] = None,
    ):
        self._api_version = api_version or MAX_SUPPORTED_VERSION
        self._protocol_interface = protocol_interface
        self._mount = mount
        self._instrument_name = instrument_name
        self._default_speed = default_speed
        self._speeds = PlungerSpeeds(self)

        pipette_state = self.get_hardware_state()
        self._flow_rates = FlowRates(self)
        self._flow_rates.set_defaults(
            aspirate_defaults=pipette_state["default_aspirate_flow_rates"],
            dispense_defaults=pipette_state["default_dispense_flow_rates"],
            blow_out_defaults=pipette_state["default_blow_out_flow_rates"],
            api_level=self._api_version,
        )

    def get_default_speed(self) -> float:
        """Gets the speed at which the robot's gantry moves."""
        return self._default_speed

    def set_default_speed(self, speed: float) -> None:
        """Sets the speed at which the robot's gantry moves."""
        self._default_speed = speed

    def aspirate(
        self,
        location: types.Location,
        well_core: Optional[LegacyWellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
    ) -> None:
        """Aspirate a given volume of liquid from the specified location.
        Args:
            volume: The volume of liquid to aspirate, in microliters.
            location: The exact location to aspirate from.
            well_core: The well to aspirate from, if applicable.
            rate: The rate in µL/s to aspirate at.
            flow_rate: Not used in this core.
            in_place: Whether we should move_to location.
        """
        if self.get_current_volume() == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration
            if self._api_version < APIVersion(2, 3) or not self.is_ready_to_aspirate():
                if location.labware.is_well:
                    self.move_to(location=location.labware.as_well().top())
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
            self.move_to(location=location)
        elif not in_place:
            self.move_to(location=location)

        self._protocol_interface.get_hardware().aspirate(self._mount, volume, rate)

    def dispense(
        self,
        location: types.Location,
        well_core: Optional[LegacyWellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
    ) -> None:
        """Dispense a given volume of liquid into the specified location.
        Args:
            volume: The volume of liquid to dispense, in microliters.
            location: The exact location to dispense to.
            well_core: The well to dispense to, if applicable.
            rate: The rate in µL/s to dispense at.
            flow_rate: Not used in this core.
            in_place: Whether we should move_to location.
        """
        if not in_place:
            self.move_to(location=location)

        self._protocol_interface.get_hardware().dispense(self._mount, volume, rate)

    def blow_out(
        self,
        location: types.Location,
        well_core: Optional[LegacyWellCore],
        in_place: bool,
    ) -> None:
        """Blow liquid out of the tip.

        Args:
            location: The location to blow out into.
            well_core: Unused by legacy core.
            in_place: Whether we should move_to location.
        """
        if not in_place:
            self.move_to(location=location)
        self._protocol_interface.get_hardware().blow_out(self._mount)

    def touch_tip(
        self,
        location: types.Location,
        well_core: LegacyWellCore,
        radius: float,
        z_offset: float,
        speed: float,
    ) -> None:
        """
        Touch the pipette tip to the sides of a well, with the intent of
        removing left-over droplets
        """
        # TODO al 20201110 - build_edges relies on where being a Well. This is
        #  an unpleasant compromise until refactoring build_edges to support
        #  LegacyWellCore.
        #  Also, build_edges should not require api_version.
        from opentrons.protocol_api.labware import Labware, Well

        self.move_to(location=location)

        edges = build_edges(
            where=Well(
                parent=Labware(
                    core=well_core.geometry.parent,
                    api_version=self._api_version,
                    protocol_core=None,  # type: ignore[arg-type]
                    core_map=None,  # type: ignore[arg-type]
                ),
                core=well_core,
                api_version=self._api_version,
            ),
            offset=z_offset,
            mount=self._mount,
            deck=self._protocol_interface.get_deck(),
            radius=radius,
            version=self._api_version,
        )
        for edge in edges:
            self._protocol_interface.get_hardware().move_to(self._mount, edge, speed)

    def pick_up_tip(
        self,
        location: types.Location,
        well_core: LegacyWellCore,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        """Pick up a tip for the pipette to run liquid-handling commands."""
        hw = self._protocol_interface.get_hardware()
        geometry = well_core.geometry
        tip_rack_core = geometry.parent
        tip_length = instrument_support.tip_length_for(
            pipette=self.get_hardware_state(),
            tip_rack_definition=tip_rack_core.get_definition(),
        )

        self.move_to(location=location, well_core=well_core)
        hw.set_current_tiprack_diameter(self._mount, geometry.diameter)
        hw.pick_up_tip(self._mount, tip_length, presses, increment, prep_after)
        hw.set_working_volume(self._mount, geometry.max_volume)
        tip_rack_core.get_tip_tracker().use_tips(
            start_well=well_core,
            num_channels=self.get_channels(),
            fail_if_full=self._api_version < APIVersion(2, 2),
        )

    def drop_tip(
        self,
        location: Optional[types.Location],
        well_core: LegacyWellCore,
        home_after: Optional[bool],
        randomize_drop_location: Optional[bool] = False,
    ) -> None:
        """Move to and drop a tip into a given well.

        Args:
            location: An absolute location to drop the tip at.
                If unspecified, use the default drop height of the well.
            well_core: The well we're dropping into
            home_after: Whether to home the pipette after the tip is dropped.
        """
        if randomize_drop_location:
            raise APIVersionError(
                "Tip drop randomization is not supported in this API version."
            )
        labware_core = well_core.geometry.parent

        if location is None:
            from opentrons.protocol_api.labware import Labware, Well

            labware = Labware(
                core=labware_core,
                api_version=self._api_version,
                protocol_core=None,  # type: ignore[arg-type]
                core_map=None,  # type: ignore[arg-type]
            )
            well = Well(parent=labware, core=well_core, api_version=self._api_version)

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

        hw = self._protocol_interface.get_hardware()
        self.move_to(location=location)
        hw.drop_tip(self._mount, home_after=True if home_after is None else home_after)

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
        """Home the mount"""
        self._protocol_interface.get_hardware().home_z(
            mount=self._mount,
            # preserve buggy behavior in <= 2.12 for strict back. compat.
            # https://github.com/Opentrons/opentrons/issues/7499
            allow_home_other=self._api_version >= APIVersion(2, 13),
        )
        self.home_plunger()

    def home_plunger(self) -> None:
        """Home the plunger associated with this mount."""
        self._protocol_interface.get_hardware().home_plunger(self._mount)

    def move_to(
        self,
        location: types.Location,
        well_core: Optional[LegacyWellCore] = None,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> None:
        """Move the instrument.

        Args:
            location: The movement destination.
            well_core: Unused in the legacy instrument core.
            force_direct: Force a direct movement instead of an arc.
            minimum_z_height: Set a minimum travel height for a movement arc.
            speed: Override the travel speed in mm/s.

        Raises:
            LabwareHeightError: An item on the deck is taller than
                the computed safe travel height.
        """
        self.flag_unsafe_move(location)

        # prevent direct movement bugs in PAPI version >= 2.10
        location_cache_mount = (
            self._mount if self._api_version >= APIVersion(2, 10) else None
        )

        last_location = self._protocol_interface.get_last_location(
            mount=location_cache_mount
        )

        if last_location:
            from_lw = last_location.labware
        else:
            from_lw = LabwareLike(None)

        if not speed:
            speed = self.get_default_speed()

        hardware = self._protocol_interface.get_hardware()

        from_center = from_lw.center_multichannel_on_wells() if from_lw else False
        cp_override = CriticalPoint.XY_CENTER if from_center else None

        from_loc = types.Location(
            hardware.gantry_position(self._mount, critical_point=cp_override), from_lw
        )

        instr_max_height = hardware.get_instrument_max_height(self._mount)
        moves = planning.plan_moves(
            from_loc,
            location,
            self._protocol_interface.get_deck(),
            instr_max_height,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
        )

        try:
            for move in moves:
                hardware.move_to(
                    self._mount,
                    move[0],
                    critical_point=move[1],
                    speed=speed,
                    max_speeds=self._protocol_interface.get_max_speeds().data,
                )
        except Exception:
            self._protocol_interface.set_last_location(None)
            raise
        else:
            self._protocol_interface.set_last_location(
                location=location, mount=location_cache_mount
            )

    def get_mount(self) -> types.Mount:
        """Get the mount this pipette is attached to."""
        return self._mount

    def get_instrument_name(self) -> str:
        """Get the instrument name."""
        return self._instrument_name

    def get_pipette_name(self) -> str:
        """Get the pipette name."""
        return self.get_hardware_state()["name"]

    def get_model(self) -> str:
        """Get the model name."""
        return self.get_hardware_state()["model"]

    def get_display_name(self) -> str:
        """Get the display name"""
        return self.get_hardware_state()["display_name"]

    def get_min_volume(self) -> float:
        """Get the min volume."""
        return self.get_hardware_state()["min_volume"]

    def get_max_volume(self) -> float:
        """Get the max volume."""
        return self.get_hardware_state()["max_volume"]

    def get_working_volume(self) -> float:
        """Get the working volume."""
        return self.get_hardware_state()["working_volume"]

    def get_current_volume(self) -> float:
        """Get the current volume."""
        return self.get_hardware_state()["current_volume"]

    def get_available_volume(self) -> float:
        """Get the available volume."""
        return self.get_hardware_state()["available_volume"]

    def get_hardware_state(self) -> PipetteDict:
        """Get the hardware pipette dictionary."""
        sync_hw_api = self._protocol_interface.get_hardware()
        pipette: Optional[PipetteDict] = sync_hw_api.get_attached_instrument(
            self._mount
        )

        if pipette is None:
            raise types.PipetteNotAttachedError()

        return pipette

    def get_channels(self) -> int:
        """Number of channels."""
        return self.get_hardware_state()["channels"]

    def has_tip(self) -> bool:
        """Whether a tip is attached."""
        return self.get_hardware_state()["has_tip"]

    def is_ready_to_aspirate(self) -> bool:
        return self.get_hardware_state()["ready_to_aspirate"]

    def prepare_for_aspirate(self) -> None:
        self._protocol_interface.get_hardware().prepare_for_aspirate(self._mount)

    def get_return_height(self) -> float:
        """The height to return a tip to its tiprack."""
        return self.get_hardware_state().get("return_tip_height", 0.5)

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rates

    def get_aspirate_flow_rate(self, rate: float = 1.0) -> float:
        return self.get_hardware_state()["aspirate_flow_rate"] * rate

    def get_dispense_flow_rate(self, rate: float = 1.0) -> float:
        return self.get_hardware_state()["dispense_flow_rate"] * rate

    def get_blow_out_flow_rate(self, rate: float = 1.0) -> float:
        return self.get_hardware_state()["blow_out_flow_rate"] * rate

    def get_speed(self) -> PlungerSpeeds:
        return self._speeds

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        """Set the flow rates."""
        self._protocol_interface.get_hardware().set_flow_rate(
            mount=self._mount,
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
        """Set pipette speeds."""
        self._protocol_interface.get_hardware().set_pipette_speed(
            mount=self._mount,
            aspirate=aspirate,
            dispense=dispense,
            blow_out=blow_out,
        )

    def flag_unsafe_move(self, location: types.Location) -> None:
        """Check if a movement to a destination is potentially unsafe.

        Args:
            location: The movement destination.

        Raises:
            RuntimeError: The movement is unsafe.
        """
        from_loc = self._protocol_interface.get_last_location()

        if not from_loc:
            from_loc = types.Location(types.Point(0, 0, 0), LabwareLike(None))

        for mod in self._protocol_interface.get_module_cores():
            if isinstance(mod, LegacyThermocyclerCore):
                mod.flag_unsafe_move(to_loc=location, from_loc=from_loc)
            elif isinstance(mod, LegacyHeaterShakerCore):
                mod.flag_unsafe_move(
                    to_loc=location,
                    is_multichannel=self.get_channels() > 1,
                )

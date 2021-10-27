from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional, cast

from opentrons import types
from opentrons.hardware_control.modules import Thermocycler
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.paired_instrument import AbstractPairedInstrument
from opentrons.protocols.context.protocol import AbstractProtocol
from opentrons.protocols.geometry import planning
from opentrons.protocols.api_support.util import build_edges
from opentrons.protocols.geometry.module_geometry import ThermocyclerGeometry

if TYPE_CHECKING:
    from opentrons.hardware_control import types as hc_types
    from opentrons.protocols.api_support.util import HardwareManager

logger = logging.getLogger(__name__)


class PairedInstrument(AbstractPairedInstrument):
    def __init__(
        self,
        primary_instrument: AbstractInstrument,
        secondary_instrument: AbstractInstrument,
        pair_policy: hc_types.PipettePair,
        ctx: AbstractProtocol,
        hardware_manager: HardwareManager,
    ):
        self.p_instrument = primary_instrument
        self.s_instrument = secondary_instrument
        self._pair_policy = pair_policy
        self._ctx = ctx
        self._hw_manager = hardware_manager

    def pick_up_tip(
        self,
        target: Well,
        secondary_target: Well,
        tiprack: Labware,
        presses: Optional[int],
        increment: Optional[float],
        tip_length: float,
    ):
        self.move_to(target.top())

        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._pair_policy, target.diameter
        )
        self._hw_manager.hardware.pick_up_tip(
            self._pair_policy, tip_length, presses, increment
        )

        self._hw_manager.hardware.set_working_volume(
            self._pair_policy, target.max_volume
        )

        tiprack.use_tips(target, self.p_instrument.get_channels())
        tiprack.use_tips(secondary_target, self.s_instrument.get_channels())

    def drop_tip(self, target: types.Location, home_after: bool):
        self.move_to(target)
        self._hw_manager.hardware.drop_tip(self._pair_policy, home_after=home_after)
        return self

    def move_to(
        self,
        location: types.Location,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ):
        if not speed:
            speed = self.p_instrument.get_default_speed()

        last_location = self._ctx.get_last_location()
        if last_location:
            from_lw = last_location.labware
        else:
            from_lw = LabwareLike(None)

        from_center = "centerMultichannelOnWells" in from_lw.quirks_from_any_parent()
        cp_override = CriticalPoint.XY_CENTER if from_center else None
        from_loc = types.Location(
            self._hw_manager.hardware.gantry_position(
                self._pair_policy.primary, critical_point=cp_override
            ),
            from_lw,
        )

        for mod in self._ctx.get_loaded_modules().values():
            if isinstance(mod.module, Thermocycler):
                cast(ThermocyclerGeometry, mod.geometry).flag_unsafe_move(
                    to_loc=location,
                    from_loc=from_loc,
                    lid_position=mod.module.lid_status,
                )

        primary_height = self._hw_manager.hardware.get_instrument_max_height(
            self._pair_policy.primary
        )
        secondary_height = self._hw_manager.hardware.get_instrument_max_height(
            self._pair_policy.secondary
        )
        moves = planning.plan_moves(
            from_loc,
            location,
            self._ctx.get_deck(),
            min(primary_height, secondary_height),
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
        )
        logger.debug("move_to: {}->{} via:\n\t{}".format(from_loc, location, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(
                    self._pair_policy,
                    move[0],
                    critical_point=move[1],
                    speed=speed,
                    max_speeds=self._ctx.get_max_speeds().data,
                )
        except Exception:
            self._ctx.set_last_location(None)
            raise
        else:
            self._ctx.set_last_location(location)
        return self

    def aspirate(
        self,
        volume: float,
        location: types.Location,
        rate: float,
    ) -> None:

        if self.p_instrument.get_current_volume() == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration
            primary_ready = self.p_instrument.get_pipette()["ready_to_aspirate"]
            secondary_ready = self.s_instrument.get_pipette()["ready_to_aspirate"]
            if not primary_ready or not secondary_ready:
                if location.labware.is_well:
                    self.move_to(location.labware.as_well().top())
                else:
                    # TODO(seth,2019/7/29): This should be a warning exposed
                    #  via rpc to the runapp
                    logger.warning(
                        "When aspirate is called on something other than a "
                        "well relative position, we can't move to the top of"
                        " the well to prepare for aspiration. This might "
                        "cause over aspiration if the previous command is a "
                        "blow_out."
                    )
                self._hw_manager.hardware.prepare_for_aspirate(self._pair_policy)
            self.move_to(location)
        elif location != self._ctx.get_last_location():
            self.move_to(location)

        self._hw_manager.hardware.aspirate(self._pair_policy, volume, rate)

    def dispense(self, volume: float, location: types.Location, rate: float) -> None:
        if location != self._ctx.get_last_location():
            self.move_to(location)
        self._hw_manager.hardware.dispense(self._pair_policy, volume, rate)

    def blow_out(self, location: types.Location):
        if location != self._ctx.get_last_location():
            self.move_to(location)
        self._hw_manager.hardware.blow_out(self._pair_policy)

    def touch_tip(self, well: Well, radius: float, v_offset: float, speed: float):
        edges = build_edges(
            well,
            v_offset,
            self._pair_policy.primary,
            self._ctx.get_deck(),
            radius,
        )
        for edge in edges:
            self._hw_manager.hardware.move_to(self._pair_policy, edge, speed)

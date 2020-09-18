from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Union, Optional

from opentrons import types
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocol_api.labware import (
    Labware, Well, quirks_from_any_parent)
from opentrons.protocol_api.module_contexts import ThermocyclerContext
from opentrons.protocols.geometry import planning
from opentrons.protocols.api_support.util import build_edges

if TYPE_CHECKING:
    from opentrons.protocol_api.protocol_context import ProtocolContext
    from opentrons.protocol_api.instrument_context import InstrumentContext
    from opentrons.hardware_control import types as hc_types
    from opentrons.protocols.api_support.util import HardwareManager


class PairedInstrument:

    def __init__(self,
                 primary_instrument: InstrumentContext,
                 secondary_instrument: InstrumentContext,
                 pair_policy: hc_types.PipettePair,
                 ctx: ProtocolContext,
                 hardware_manager: HardwareManager,
                 log_parent: logging.Logger):
        self.p_instrument = primary_instrument
        self.s_instrument = secondary_instrument
        self._pair_policy = pair_policy
        self._ctx = ctx
        self._hw_manager = hardware_manager
        self._log = log_parent.getChild(repr(self))

        self._last_location: Union[Labware, Well, None] = None

    def pick_up_tip(self, target: Well, secondary_target: Well,
                    tiprack: Labware, presses: Optional[int],
                    increment: Optional[float], tip_length: float):

        self.move_to(target.top())

        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._pair_policy, target.diameter)
        self._hw_manager.hardware.pick_up_tip(
            self._pair_policy, tip_length, presses, increment)

        self._hw_manager.hardware.set_working_volume(
            self._pair_policy, target.max_volume)

        tiprack.use_tips(target, self.p_instrument.channels)
        tiprack.use_tips(secondary_target, self.s_instrument.channels)

    def drop_tip(self, target: types.Location, home_after: bool):
        self.move_to(target)
        self._hw_manager.hardware.drop_tip(
            self._pair_policy, home_after=home_after)
        return self

    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: Optional[float] = None,
                speed: Optional[float] = None):
        if not speed:
            speed = self.p_instrument.default_speed
        if self._ctx.location_cache:
            from_lw = self._ctx.location_cache.labware
        else:
            from_lw = None

        from_center = 'centerMultichannelOnWells'\
            in quirks_from_any_parent(from_lw)
        cp_override = CriticalPoint.XY_CENTER if from_center else None
        from_loc = types.Location(
            self._hw_manager.hardware.gantry_position(
                self._pair_policy.primary, critical_point=cp_override),
            from_lw)

        for mod in self._ctx._modules:
            if isinstance(mod, ThermocyclerContext):
                mod.flag_unsafe_move(to_loc=location, from_loc=from_loc)

        primary_height = \
            self._hw_manager.hardware.get_instrument_max_height(
                self._pair_policy.primary)
        secondary_height = \
            self._hw_manager.hardware.get_instrument_max_height(
                self._pair_policy.secondary)
        moves = planning.plan_moves(from_loc, location, self._ctx.deck,
                                    min(primary_height, secondary_height),
                                    force_direct=force_direct,
                                    minimum_z_height=minimum_z_height
                                    )
        self._log.debug("move_to: {}->{} via:\n\t{}"
                        .format(from_loc, location, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(
                    self._pair_policy, move[0], critical_point=move[1],
                    speed=speed, max_speeds=self._ctx.max_speeds.data)
        except Exception:
            self._ctx.location_cache = None
            raise
        else:
            self._ctx.location_cache = location
        return self

    def aspirate(
            self, volume: Optional[float],
            location: Optional[types.Location] = None,
            rate: Optional[float] = 1.0) -> types.Location:
        if location:
            loc = location
        elif self._ctx.location_cache:
            loc = self._ctx.location_cache
        else:
            raise RuntimeError(
                "If aspirate is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")

        if self.p_instrument.current_volume == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration
            primary_ready = self.p_instrument.hw_pipette['ready_to_aspirate']
            secondary_ready = self.s_instrument.hw_pipette['ready_to_aspirate']
            if not primary_ready or not secondary_ready:
                if isinstance(loc.labware, Well):
                    self.move_to(loc.labware.top())
                else:
                    # TODO(seth,2019/7/29): This should be a warning exposed
                    #  via rpc to the runapp
                    self._log.warning(
                        "When aspirate is called on something other than a "
                        "well relative position, we can't move to the top of"
                        " the well to prepare for aspiration. This might "
                        "cause over aspiration if the previous command is a "
                        "blow_out.")
                self._hw_manager.hardware.prepare_for_aspirate(
                    self._pair_policy)
            self.move_to(loc)
        elif loc != self._ctx.location_cache:
            self.move_to(loc)
        self._hw_manager.hardware.aspirate(self._pair_policy, volume, rate)
        return loc

    def dispense(
            self, volume: Optional[float],
            location: Optional[types.Location],
            rate: float) -> types.Location:
        if location:
            loc = location
            self.move_to(location)
        elif self._ctx.location_cache:
            loc = self._ctx.location_cache
            pass
        else:
            raise RuntimeError(
                "If dispense is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "aspirate) must previously have been called so the robot "
                "knows where it is.")
        self._hw_manager.hardware.dispense(self._pair_policy, volume, rate)
        return loc

    def blow_out(self, location: types.Location):
        if location:
            self.move_to(location)
        elif self._ctx.location_cache:
            # if location cache exists, pipette blows out immediately at
            # current location, no movement is needed
            pass
        else:
            raise RuntimeError(
                "If blow out is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")
        self._hw_manager.hardware.blow_out(self._pair_policy)

    def air_gap(self, volume: Optional[float], height: float):
        loc = self._ctx.location_cache
        if not loc or not isinstance(loc.labware, Well):
            raise RuntimeError('No previous Well cached to perform air gap')
        target = loc.labware.top(height)
        self.move_to(target)
        self.aspirate(volume)

    def touch_tip(
            self, location: Optional[Well], radius: float,
            v_offset: float, speed: float):
        if location is None:
            if not self._ctx.location_cache:
                raise RuntimeError('No valid current location cache present')
            else:
                location = self._ctx.location_cache.labware  # type: ignore
                # type checked below
        if isinstance(location, Well):
            if 'touchTipDisabled' in quirks_from_any_parent(location):
                self._log.info(f"Ignoring touch tip on labware {location}")
                return self
            if location.parent.is_tiprack:
                self._log.warning('Touch_tip being performed on a tiprack. '
                                  'Please re-check your code')

            move_with_z_offset =\
                location.top().point + types.Point(0, 0, v_offset)
            to_loc = types.Location(move_with_z_offset, location)
            self.move_to(to_loc)
        else:
            # If location is a not a valid well, raise a type error
            raise TypeError(
                'location should be a Well, but it is {}'.format(location))

        edges = build_edges(
            location, v_offset, self._pair_policy.primary,
            self._ctx._deck_layout, radius)
        for edge in edges:
            self._hw_manager.hardware.move_to(
                self._pair_policy, edge, speed)

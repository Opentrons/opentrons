from typing import Union

from opentrons import types
from opentrons.protocols.types import APIVersion
from opentrons.hardware_control.types import CriticalPoint

from .labware import Labware, Well, quirks_from_any_parent
from .module_contexts import ThermocyclerContext
from . import geometry


class PairedInstrument:
    
    def __init__(self,
                 primary_instrument,
                 secondary_instrument,
                 mount,
                 ctx,
                 hardware_manager):
        self.p_instrument = primary_instrument
        self.s_instrument = secondary_instrument
        self._mount = mount
        self._ctx = ctx
        self._hw_manager = hardware_manager
    
        self._last_location: Union[Labware, Well, None] = None
        self._last_tip_picked_up_from: Union[Well, None] = None

    def pick_up_tip(self, target, tiprack, presses, increment, secondary_target):

        self.move_to(target.top())

        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._mount, target.diameter)
        self._hw_manager.hardware.pick_up_tip(
            self._mount, self._tip_length_for(tiprack), presses, increment)

        self._hw_manager.hardware.set_working_volume(
            self._mount, target.max_volume)

        tiprack.use_tips(target, self.p_instrument.channels)
        tiprack.use_tips(secondary_target, self.s_instrument.channels)
        self._primary_last_tip_picked_up_from = target

    def drop_tip(self, target, home_after, api_version):

        self.move_to(target)
        self._hw_manager.hardware.drop_tip(self._mount, home_after=home_after)
        self._last_tip_picked_up_from = None
        return self

    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None):

        if self._ctx.location_cache:
            from_lw = self._ctx.location_cache.labware
        else:
            from_lw = None

        from_center = 'centerMultichannelOnWells'\
            in quirks_from_any_parent(from_lw)
        cp_override = CriticalPoint.XY_CENTER if from_center else None
        from_loc = types.Location(
            self._hw_manager.hardware.gantry_position(
                self._mount, critical_point=cp_override),
            from_lw)

        for mod in self._ctx._modules:
            if isinstance(mod, ThermocyclerContext):
                mod.flag_unsafe_move(to_loc=location, from_loc=from_loc)

        instr_max_height = \
            self._hw_manager.hardware.get_instrument_max_height(self._mount)
        moves = geometry.plan_moves(from_loc, location, self._ctx.deck,
                                    instr_max_height,
                                    force_direct=force_direct,
                                    minimum_z_height=minimum_z_height
                                    )
        self._log.debug("move_to: {}->{} via:\n\t{}"
                        .format(from_loc, location, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(
                    self._mount, move[0], critical_point=move[1], speed=speed,
                    max_speeds=self._ctx.max_speeds.data)
        except Exception:
            self._ctx.location_cache = None
            raise
        else:
            self._ctx.location_cache = location
        return self

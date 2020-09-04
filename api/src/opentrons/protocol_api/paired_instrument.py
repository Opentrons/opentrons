from typing import Union

from opentrons import types
from opentrons.protocols.types import APIVersion
from opentrons.hardware_control.types import CriticalPoint

from .labware import Labware, Well
from .module_contexts import ThermocyclerContext


class PairedInstrument:
    
    def __init__(self,
                 primary_instrument,
                 secondary_instrument,
                 mount,
                 ctx):
        self.p_instrument = primary_instrument
        self.s_instrument = secondary_instrument
        self._mount = mount
        self._ctx = ctx
    
        self._last_location: Union[Labware, Well, None] = None
        self._last_tip_picked_up_from: Union[Well, None] = None

    def pick_up_tip(self, target, tiprack, presses, increment, secondary_target):

        # self._validate_tiprack(tiprack)

        self.move_to(target.top())

        self._hw_manager.hardware.set_current_tiprack_diameter(
            self._mount, target.diameter)
        self._hw_manager.hardware.pick_up_tip(
            self._mount, self._tip_length_for(tiprack), presses, increment)

        self._hw_manager.hardware.set_working_volume(
            self._mount, target.max_volume)

        tiprack.use_tips(target, self.p_instrument.channels)
        tiprack.use_tips(secondary_target, self.s_instrument.channels)
        self._last_tip_picked_up_from = target

    def drop_tip(self, target, home_after):

        self.move_to(target)
        self._hw_manager.hardware.drop_tip(self._mount, home_after=home_after)

        if self.api_version < APIVersion(2, 2) \
                and isinstance(target.labware, Well) \
                and target.labware.parent.is_tiprack:
            # If this is a tiprack we can try and add the tip back to the
            # tracker
            try:
                target.labware.parent.return_tips(
                    target.labware, self.channels)
            except AssertionError:
                # Similarly to :py:meth:`return_tips`, the failure case here
                # just means the tip can't be reused, so don't actually stop
                # the protocol
                self._log.exception(f'Could not return tip to {target}')
        self._last_tip_picked_up_from = None
        return self

    def move_to(self, from_loc: types.Location, to_loc: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None):


        for mod in self._ctx._modules:
            if isinstance(mod, ThermocyclerContext):
                mod.flag_unsafe_move(to_loc=to_loc, from_loc=from_loc)

        instr_max_height = \
            self._hw_manager.hardware.get_instrument_max_height(self._mount)
        moves = geometry.plan_moves(from_loc, to_loc, self._ctx.deck,
                                    instr_max_height,
                                    force_direct=force_direct,
                                    minimum_z_height=minimum_z_height
                                    )
        self._log.debug("move_to: {}->{} via:\n\t{}"
                        .format(from_loc, to_loc, moves))
        try:
            for move in moves:
                self._hw_manager.hardware.move_to(
                    self._mount, move[0], critical_point=move[1], speed=speed,
                    max_speeds=self._ctx.max_speeds.data)
        except Exception:
            self._ctx.location_cache = None
            raise
        else:
            self._ctx.location_cache = to_loc
        return self

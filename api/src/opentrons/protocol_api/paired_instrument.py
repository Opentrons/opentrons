from typing import Union, Any, Dict

from opentrons import types
from opentrons.config.feature_flags import enable_calibration_overhaul
from opentrons.protocols.types import APIVersion
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocols.geometry import planning
from opentrons.protocols.api_support.util import first_parent
from opentrons.calibration_storage import get

from .labware import Labware, Well, quirks_from_any_parent
from .module_contexts import ThermocyclerContext


class PairedInstrument:
    
    def __init__(self,
                 primary_instrument,
                 secondary_instrument,
                 mount,
                 ctx,
                 hardware_manager,
                 log_parent):
        self.p_instrument = primary_instrument
        self.s_instrument = secondary_instrument
        self._mount = mount
        self._ctx = ctx
        self._hw_manager = hardware_manager
        self._log = log_parent.getChild(repr(self))
    
        self._last_location: Union[Labware, Well, None] = None
        self._last_tip_picked_up_from: Union[Well, None] = None

    @property  # type: ignore
    @requires_version(2, 0)
    def hw_pipette(self) -> Dict[str, Any]:
        """ View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        pipette = self._hw_manager.hardware.attached_instruments[self._mount]
        if pipette is None:
            raise types.PipetteNotAttachedError
        return pipette

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
        moves = planning.plan_moves(from_loc, location, self._ctx.deck,
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

    @lru_cache(maxsize=12)
    def _tip_length_for(self, tiprack: Labware) -> float:
        """ Get the tip length, including overlap, for a tip from this rack """

        def _build_length_from_overlap() -> float:
            tip_overlap = self.hw_pipette['tip_overlap'].get(
                tiprack.uri,
                self.hw_pipette['tip_overlap']['default'])
            tip_length = tiprack.tip_length
            return tip_length - tip_overlap

        if not enable_calibration_overhaul():
            return _build_length_from_overlap()
        else:
            try:
                parent = first_parent(tiprack) or ''
                return get.load_tip_length_calibration(
                    self.hw_pipette['pipette_id'],
                    tiprack._definition,
                    parent)['tipLength']
            except TipLengthCalNotFound:
                return _build_length_from_overlap()

from __future__ import annotations

import logging
from functools import lru_cache
from typing import (
    List, Optional, Sequence, TYPE_CHECKING, Union)
from opentrons.broker import Broker
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons import types, hardware_control as hc
from opentrons.commands import commands as cmds
from opentrons.commands.publisher import CommandPublisher, do_publish, publish
from opentrons.hardware_control.types import PipettePair
from opentrons.protocols.advanced_control.mix import mix_from_kwargs
from opentrons.protocols.api_support.instrument import \
    validate_blowout_location, tip_length_for, validate_tiprack, \
    determine_drop_target
from opentrons.protocols.api_support.labware_like import LabwareLike
from opentrons.protocol_api.module_contexts import ThermocyclerContext
from opentrons.protocols.api_support.util import (
    FlowRates, PlungerSpeeds, Clearances, clamp_value, requires_version)
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.api_support.types import APIVersion
from .labware import (
    Labware, OutOfTipsError, Well, next_available_tip)
from opentrons.protocols.advanced_control import transfers
from .paired_instrument_context import (
    PairedInstrumentContext, UnsupportedInstrumentPairingError)

if TYPE_CHECKING:
    from opentrons.protocol_api import ProtocolContext

AdvancedLiquidHandling = Union[
    Well,
    types.Location,
    List[Union[Well, types.Location]],
    List[List[Well]]]


class InstrumentContext(CommandPublisher):
    """ A context for a specific pipette or instrument.

    This can be used to call methods related to pipettes - moves or
    aspirates or dispenses, or higher-level methods.

    Instances of this class bundle up state and config changes to a
    pipette - for instance, changes to flow rates or trash containers.
    Action methods (like :py:meth:`aspirate` or :py:meth:`distribute`) are
    defined here for convenience.

    In general, this class should not be instantiated directly; rather,
    instances are returned from :py:meth:`ProtocolContext.load_instrument`.

    .. versionadded:: 2.0

    """

    def __init__(self,
                 implementation: InstrumentContextInterface,
                 ctx: ProtocolContext,
                 broker: Broker,
                 log_parent: logging.Logger,
                 at_version: APIVersion,
                 tip_racks: List[Labware] = None,
                 trash: Optional[Labware] = None,
                 ) -> None:

        super().__init__(broker)
        self._api_version = at_version
        self._implementation = implementation
        self._ctx = ctx
        self._log = log_parent.getChild(repr(self))

        self._tip_racks = tip_racks or list()
        for tip_rack in self.tip_racks:
            assert tip_rack.is_tiprack
            validate_tiprack(self.name, tip_rack, self._log)
        if trash is None:
            self.trash_container = self._ctx.fixed_trash
        else:
            self.trash_container = trash

        self._last_tip_picked_up_from: Union[Well, None] = None
        self._starting_tip: Union[Well, None] = None
        self.requested_as = self._implementation.get_instrument_name()

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def starting_tip(self) -> Union[Well, None]:
        """ The starting tip from which the pipette pick up
        """
        return self._starting_tip

    @starting_tip.setter
    def starting_tip(self, location: Union[Well, None]):
        self._starting_tip = location

    @requires_version(2, 0)
    def reset_tipracks(self):
        """ Reload all tips in each tip rack and reset starting tip
        """
        for tiprack in self.tip_racks:
            tiprack.reset()
        self.starting_tip = None

    @property  # type: ignore
    @requires_version(2, 0)
    def default_speed(self) -> float:
        """ The speed at which the robot's gantry moves.

        By default, 400 mm/s. Changing this value will change the speed of the
        pipette when moving between labware. In addition to changing the
        default, the speed of individual motions can be changed with the
        ``speed`` argument to :py:meth:`InstrumentContext.move_to`.
        """
        return self._implementation.get_default_speed()

    @default_speed.setter
    def default_speed(self, speed: float):
        self._implementation.set_default_speed(speed)

    @requires_version(2, 0)
    def aspirate(self,
                 volume: Optional[float] = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> InstrumentContext:
        """
        Aspirate a given volume of liquid from the specified location, using
        this pipette.

        :param volume: The volume to aspirate, in microliters (µL).  If 0 or
                       unspecified, defaults to the highest volume possible
                       with this pipette and its currently attached tip.
        :type volume: int or float
        :param location: Where to aspirate from. If `location` is a
                         :py:class:`.Well`, the robot will aspirate from
                         :py:obj:`well_bottom_clearance.aspirate` mm
                         above the bottom of the well. If `location` is a
                         :py:class:`.Location` (i.e. the result of
                         :py:meth:`.Well.top` or :py:meth:`.Well.bottom`), the
                         robot will aspirate from the exact specified location.
                         If unspecified, the robot will aspirate from the
                         current position.
        :param rate: A relative modifier for how quickly to aspirate liquid.
                     The flow rate for this aspirate will be
                     `rate` * :py:attr:`flow_rate.aspirate <flow_rate>`.
                     If not specified, defaults to 1.0.
        :type rate: float
        :returns: This instance.

        .. note::

            If ``aspirate`` is called with a single argument, it will not try
            to guess whether the argument is a volume or location - it is
            required to be a volume. If you want to call ``aspirate`` with only
            a location, specify it as a keyword argument:
            ``instr.aspirate(location=wellplate['A1'])``

        """
        self._log.debug("aspirate {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))

        if isinstance(location, Well):
            dest = location.bottom().move(
                types.Point(0, 0, self.well_bottom_clearance.aspirate))
        elif isinstance(location, types.Location):
            dest = location
        elif location is not None:
            raise TypeError(
                'location should be a Well or Location, but it is {}'
                .format(location))
        elif self._ctx.location_cache:
            dest = self._ctx.location_cache
        else:
            raise RuntimeError(
                "If aspirate is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is.")

        if self.current_volume == 0:
            # Make sure we're at the top of the labware and clear of any
            # liquid to prepare the pipette for aspiration

            if self.api_version < APIVersion(2, 3) or \
                    not self._implementation.is_ready_to_aspirate():
                if dest.labware.is_well:
                    self.move_to(dest.labware.as_well().top())
                else:
                    # TODO(seth,2019/7/29): This should be a warning exposed
                    #  via rpc to the runapp
                    self._log.warning(
                        "When aspirate is called on something other than a "
                        "well relative position, we can't move to the top of"
                        " the well to prepare for aspiration. This might "
                        "cause over aspiration if the previous command is a "
                        "blow_out.")
                self._implementation.prepare_for_aspirate()
            self.move_to(dest)
        elif dest != self._ctx.location_cache:
            self.move_to(dest)

        c_vol = self._implementation.get_available_volume() \
            if not volume else volume

        do_publish(self.broker, cmds.aspirate, self.aspirate,
                   'before', None, None, self, c_vol, dest, rate)
        self._implementation.aspirate(volume=c_vol, rate=rate)
        do_publish(self.broker, cmds.aspirate, self.aspirate,
                   'after', self, None, self, c_vol, dest, rate)
        return self

    @requires_version(2, 0)
    def dispense(self,
                 volume: Optional[float] = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> InstrumentContext:
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location.

        If only a volume is passed, the pipette will dispense from its current
        position. If only a location is passed (as in
        ``instr.dispense(location=wellplate['A1'])``), all of the liquid
        aspirated into the pipette will be dispensed (this volume is accessible
        through :py:attr:`current_volume`).

        :param volume: The volume of liquid to dispense, in microliters. If not
                       specified, defaults to :py:attr:`current_volume`.
        :type volume: int or float

        :param location: Where to dispense into. If `location` is a
                         :py:class:`.Well`, the robot will dispense into
                         :py:obj:`well_bottom_clearance.dispense` mm
                         above the bottom of the well. If `location` is a
                         :py:class:`.Location` (i.e. the result of
                         :py:meth:`.Well.top` or :py:meth:`.Well.bottom`), the
                         robot will dispense into the exact specified location.
                         If unspecified, the robot will dispense into the
                         current position.
        :param rate: A relative modifier for how quickly to dispense liquid.
                     The flow rate for this dispense will be
                     `rate` * :py:attr:`flow_rate.dispense <flow_rate>`.
                     If not specified, defaults to 1.0.
        :type rate: float

        :returns: This instance.

        .. note::

            If ``dispense`` is called with a single argument, it will not try
            to guess whether the argument is a volume or location - it is
            required to be a volume. If you want to call ``dispense`` with only
            a location, specify it as a keyword argument:
            ``instr.dispense(location=wellplate['A1'])``

        """
        self._log.debug("dispense {} from {} at {}"
                        .format(volume,
                                location if location else 'current position',
                                rate))
        if isinstance(location, Well):
            if LabwareLike(location).is_fixed_trash():
                loc = location.top()
            else:
                loc = location.bottom().move(
                    types.Point(0, 0, self.well_bottom_clearance.dispense))
            self.move_to(loc)
        elif isinstance(location, types.Location):
            loc = location
            self.move_to(location)
        elif location is not None:
            raise TypeError(
                f'location should be a Well or Location, but it is {location}')
        elif self._ctx.location_cache:
            loc = self._ctx.location_cache
        else:
            raise RuntimeError(
                "If dispense is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "aspirate) must previously have been called so the robot "
                "knows where it is.")

        c_vol = self.current_volume if not volume else volume

        do_publish(self.broker, cmds.dispense, self.dispense,
                   'before', None, None, self, c_vol, loc, rate)
        self._implementation.dispense(volume=c_vol, rate=rate)
        do_publish(self.broker, cmds.dispense, self.dispense,
                   'after', self, None, self, c_vol, loc, rate)
        return self

    @requires_version(2, 0)
    def mix(self,
            repetitions: int = 1,
            volume: Optional[float] = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> InstrumentContext:
        """
        Mix a volume of liquid (uL) using this pipette, by repeatedly
        aspirating and dispensing in the same place.

        :param repetitions: how many times the pipette should mix (default: 1)
        :param volume: number of microliters to mix.  If 0 or unspecified,
                       defaults to the highest volume possible with this
                       pipette and its currently attached tip.
        :param location: a Well or a position relative to well.
                         e.g, `plate.rows()[0][0].bottom()`.  If unspecified,
                         the pipette will mix from its current position.
        :type location: types.Location
        :param rate: A relative modifier for how quickly to aspirate and
                     dispense liquid during this mix. When aspirating, the flow
                     rate will be
                     `rate` * :py:attr:`flow_rate.aspirate <flow_rate>`,
                     and when dispensing, it will be
                     `rate` * :py:attr:`flow_rate.dispense <flow_rate>`.
        :raises NoTipAttachedError: If no tip is attached to the pipette.
        :returns: This instance

        .. note::

            All the arguments to ``mix`` are optional; however, if you do
            not want to specify one of them, all arguments after that one
            should be keyword arguments. For instance, if you do not want
            to specify volume, you would call
            ``pipette.mix(1, location=wellplate['A1'])``. If you do not
            want to specify repetitions, you would call
            ``pipette.mix(volume=10, location=wellplate['A1'])``. Unlike
            previous API versions, ``mix`` will not attempt to guess your
            inputs; the first argument will always be interpreted as
            ``repetitions``, the second as ``volume``, and the third as
            ``location`` unless you use keywords.

        """
        self._log.debug(
            'mixing {}uL with {} repetitions in {} at rate={}'.format(
                volume, repetitions,
                location if location else 'current position', rate))
        if not self._implementation.has_tip():
            raise hc.NoTipAttachedError('Pipette has no tip. Aborting mix()')

        c_vol = self._implementation.get_available_volume() \
            if not volume else volume

        do_publish(self.broker, cmds.mix, self.mix,
                   'before', None, None,
                   self, repetitions, c_vol, location)
        self.aspirate(volume, location, rate)
        while repetitions - 1 > 0:
            self.dispense(volume, rate=rate)
            self.aspirate(volume, rate=rate)
            repetitions -= 1
        self.dispense(volume, rate=rate)
        do_publish(self.broker, cmds.mix, self.mix,
                   'after', None, None,
                   self, repetitions, c_vol, location)
        return self

    @requires_version(2, 0)
    def blow_out(self,
                 location: Union[types.Location, Well] = None
                 ) -> InstrumentContext:
        """
        Blow liquid out of the tip.

        If :py:attr:`dispense` is used to completely empty a pipette,
        usually a small amount of liquid will remain in the tip. This
        method moves the plunger past its usual stops to fully remove
        any remaining liquid from the tip. Regardless of how much liquid
        was in the tip when this function is called, after it is done
        the tip will be empty.

        :param location: The location to blow out into. If not specified,
                         defaults to the current location of the pipette
        :type location: :py:class:`.Well` or :py:class:`.Location` or None

        :raises RuntimeError: If no location is specified and location cache is
                              None. This should happen if `blow_out` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)
        :returns: This instance
        """

        if isinstance(location, Well):
            if location.parent.is_tiprack:
                self._log.warning('Blow_out being performed on a tiprack. '
                                  'Please re-check your code')
            loc = location.top()
            self.move_to(loc)
        elif isinstance(location, types.Location):
            loc = location
            self.move_to(loc)
        elif location is not None:
            raise TypeError(
                'location should be a Well or Location, but it is {}'
                .format(location))
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

        do_publish(self.broker, cmds.blow_out, self.blow_out, 'before',
                   None, None, self, location or self._ctx.location_cache)
        self._implementation.blow_out()
        do_publish(self.broker, cmds.blow_out, self.blow_out, 'after',
                   None, None, self, location or self._ctx.location_cache)
        return self

    def _determine_speed(self, speed: float):
        if self.api_version < APIVersion(2, 4):
            return clamp_value(speed, 80, 20, 'touch_tip:')
        else:
            return clamp_value(speed, 80, 1, 'touch_tip:')

    @publish.both(command=cmds.touch_tip)
    @requires_version(2, 0)
    def touch_tip(self,
                  location: Optional[Well] = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> InstrumentContext:
        """
        Touch the pipette tip to the sides of a well, with the intent of
        removing left-over droplets

        :param location: If no location is passed, pipette will
                         touch tip at current well's edges
        :type location: :py:class:`.Well` or None
        :param radius: Describes the proportion of the target well's
                       radius. When `radius=1.0`, the pipette tip will move to
                       the edge of the target well; when `radius=0.5`, it will
                       move to 50% of the well's radius. Default: 1.0 (100%)
        :type radius: float
        :param v_offset: The offset in mm from the top of the well to touch tip
                         A positive offset moves the tip higher above the well,
                         while a negative offset moves it lower into the well
                         Default: -1.0 mm
        :type v_offset: float
        :param speed: The speed for touch tip motion, in mm/s.
                      Default: 60.0 mm/s, Max: 80.0 mm/s, Min: 20.0 mm/s
        :type speed: float
        :raises NoTipAttachedError: if no tip is attached to the pipette
        :raises RuntimeError: If no location is specified and location cache is
                              None. This should happen if `touch_tip` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)
        :returns: This instance

        .. note::

            This is behavior change from legacy API (which accepts any
            :py:class:`.Placeable` as the ``location`` parameter)

        """
        if not self._implementation.has_tip():
            raise hc.NoTipAttachedError('Pipette has no tip to touch_tip()')

        checked_speed = self._determine_speed(speed)

        # If location is a valid well, move to the well first
        if location is None:
            last_location = self._ctx.location_cache
            if not last_location:
                raise RuntimeError('No valid current location cache present')
            else:
                well = last_location.labware
                # type checked below
        else:
            well = LabwareLike(location)

        if well.is_well:
            if 'touchTipDisabled' in well.quirks_from_any_parent():
                self._log.info(f"Ignoring touch tip on labware {well}")
                return self
            if well.parent.as_labware().is_tiprack:
                self._log.warning('Touch_tip being performed on a tiprack. '
                                  'Please re-check your code')

            if self.api_version < APIVersion(2, 4):
                to_loc = well.as_well().top()
            else:
                move_with_z_offset =\
                    well.as_well().top().point + types.Point(0, 0, v_offset)
                to_loc = types.Location(move_with_z_offset, well)
            self.move_to(to_loc)
        else:
            raise TypeError(
                'location should be a Well, but it is {}'.format(location))

        self._implementation.touch_tip(
            location=well.as_well()._impl,
            radius=radius,
            v_offset=v_offset,
            speed=checked_speed
        )
        return self

    @publish.both(command=cmds.air_gap)
    @requires_version(2, 0)
    def air_gap(self,
                volume: Optional[float] = None,
                height: Optional[float] = None) -> InstrumentContext:
        """
        Pull air into the pipette current tip at the current location

        :param volume: The amount in uL to aspirate air into the tube.
                       (Default will use all remaining volume in tip)
        :type volume: float

        :param height: The number of millimiters to move above the current Well
                       to air-gap aspirate. (Default: 5mm above current Well)
        :type height: float

        :raises NoTipAttachedError: If no tip is attached to the pipette

        :raises RuntimeError: If location cache is None.
                              This should happen if `touch_tip` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)

        :returns: This instance

        .. note::

            Both ``volume`` and height are optional, but unlike previous API
            versions, if you want to specify only ``height`` you must do it
            as a keyword argument: ``pipette.air_gap(height=2)``. If you
            call ``air_gap`` with only one unnamed argument, it will always
            be interpreted as a volume.


        """
        if not self._implementation.has_tip():
            raise hc.NoTipAttachedError('Pipette has no tip. Aborting air_gap')

        if height is None:
            height = 5
        loc = self._ctx.location_cache
        if not loc or not loc.labware.is_well:
            raise RuntimeError('No previous Well cached to perform air gap')
        target = loc.labware.as_well().top(height)
        self.move_to(target)
        self.aspirate(volume)
        return self

    @publish.both(command=cmds.return_tip)
    @requires_version(2, 0)
    def return_tip(self, home_after: bool = True) -> InstrumentContext:
        """
        If a tip is currently attached to the pipette, then it will return the
        tip to it's location in the tiprack.

        It will not reset tip tracking so the well flag will remain False.

        :returns: This instance

        :param home_after:
            See the ``home_after`` parameter in :py:obj:`drop_tip`.
        """
        if not self._implementation.has_tip():
            self._log.warning('Pipette has no tip to return')
        loc = self._last_tip_picked_up_from
        if not isinstance(loc, Well):
            raise TypeError('Last tip location should be a Well but it is: '
                            '{}'.format(loc))
        return_height = self._implementation.get_return_height()
        drop_loc = determine_drop_target(self.api_version,
                                         loc,
                                         return_height,
                                         APIVersion(2, 3))
        self.drop_tip(drop_loc, home_after=home_after)

        return self

    @requires_version(2, 0)
    def pick_up_tip(  # noqa: C901
            self, location: Union[types.Location, Well] = None,
            presses: Optional[int] = None,
            increment: Optional[float] = None) -> InstrumentContext:
        """
        Pick up a tip for the pipette to run liquid-handling commands with

        If no location is passed, the Pipette will pick up the next available
        tip in its :py:attr:`InstrumentContext.tip_racks` list.

        The tip to pick up can be manually specified with the `location`
        argument. The `location` argument can be specified in several ways:

        * If the only thing to specify is which well from which to pick
          up a tip, `location` can be a :py:class:`.Well`. For instance,
          if you have a tip rack in a variable called `tiprack`, you can
          pick up a specific tip from it with
          ``instr.pick_up_tip(tiprack.wells()[0])``. This style of call can
          be used to make the robot pick up a tip from a tip rack that
          was not specified when creating the :py:class:`.InstrumentContext`.

        * If the position to move to in the well needs to be specified,
          for instance to tell the robot to run its pick up tip routine
          starting closer to or farther from the top of the tip,
          `location` can be a :py:class:`.types.Location`; for instance,
          you can call ``instr.pick_up_tip(tiprack.wells()[0].top())``.

        :param location: The location from which to pick up a tip.
        :type location: :py:class:`.types.Location` or :py:class:`.Well` to
                        pick up a tip from.
        :param presses: The number of times to lower and then raise the pipette
                        when picking up a tip, to ensure a good seal (0 [zero]
                        will result in the pipette hovering over the tip but
                        not picking it up--generally not desireable, but could
                        be used for dry-run).
        :type presses: int
        :param increment: The additional distance to travel on each successive
                          press (e.g.: if `presses=3` and `increment=1.0`, then
                          the first press will travel down into the tip by
                          3.5mm, the second by 4.5mm, and the third by 5.5mm).
        :type increment: float

        :returns: This instance
        """
        if location and isinstance(location, types.Location):
            if location.labware.is_labware:
                tiprack = location.labware.as_labware()
                target: Well = tiprack.next_tip(self.channels)  # type: ignore
                if not target:
                    raise OutOfTipsError
            elif location.labware.is_well:
                target = location.labware.as_well()
                tiprack = target.parent
        elif location and isinstance(location, Well):
            tiprack = location.parent
            target = location
        elif not location:
            tiprack, target = next_available_tip(self.starting_tip,
                                                 self.tip_racks,
                                                 self.channels)
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))

        assert tiprack.is_tiprack, "{} is not a tiprack".format(str(tiprack))
        validate_tiprack(self.name, tiprack, self._log)
        do_publish(self.broker, cmds.pick_up_tip, self.pick_up_tip,
                   'before', None, None, self, location=target)

        self.move_to(target.top())

        self._implementation.pick_up_tip(
            well=target._impl,
            tip_length=self._tip_length_for(tiprack),
            presses=presses,
            increment=increment
        )
        # Note that the hardware API pick_up_tip action includes homing z after
        do_publish(self.broker, cmds.pick_up_tip, self.pick_up_tip,
                   'after', self, None, self, location=target)

        tiprack.use_tips(target, self.channels)
        self._last_tip_picked_up_from = target

        return self

    @requires_version(2, 0)
    def drop_tip(  # noqa: C901
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True)\
            -> InstrumentContext:
        """
        Drop the current tip.

        If no location is passed, the Pipette will drop the tip into its
        :py:attr:`trash_container`, which if not specified defaults to
        the fixed trash in slot 12.

        The location in which to drop the tip can be manually specified with
        the `location` argument. The `location` argument can be specified in
        several ways:

            - If the only thing to specify is which well into which to drop
              a tip, `location` can be a :py:class:`.Well`. For instance,
              if you have a tip rack in a variable called `tiprack`, you can
              drop a tip into a specific well on that tiprack with the call
              `instr.drop_tip(tiprack.wells()[0])`. This style of call can
              be used to make the robot drop a tip into arbitrary labware.
            - If the position to drop the tip from as well as the
              :py:class:`.Well` to drop the tip into needs to be specified,
              for instance to tell the robot to drop a tip from an unusually
              large height above the tiprack, `location`
              can be a :py:class:`.types.Location`; for instance, you can call
              `instr.drop_tip(tiprack.wells()[0].top())`.

        :param location:
            The location to drop the tip
        :type location:
            :py:class:`.types.Location` or :py:class:`.Well` or None
        :param home_after:
            Whether to home this pipette's plunger after dropping the tip.
            Defaults to ``True``.

            Setting ``home_after=False`` saves waiting a couple of seconds
            after the pipette drops the tip, but risks causing other problems.

            .. warning::
                Only set ``home_after=False`` if:

                * You're using a GEN2 pipette, not a GEN1 pipette.
                * You've tested ``home_after=False`` extensively with your
                  particular pipette and your particular tips.
                * You understand the risks described below.

            The ejector shroud that pops the tip off the end of the pipette is
            driven by the plunger's stepper motor. Sometimes, the strain of
            ejecting the tip can make that motor *skip* and fall out of sync
            with where the robot thinks it is.

            Homing the plunger fixes this, so, to be safe, we normally do it
            after every tip drop.

            If you set ``home_after=False`` to disable homing the plunger, and
            the motor happens to skip, you might see problems like these until
            the next time the plunger is homed:

            * The run might halt with a "hard limit" error message.
            * The pipette might aspirate or dispense the wrong volumes.
            * The pipette might not fully drop subsequent tips.

            GEN1 pipettes are especially vulnerable to this skipping, so you
            should never set ``home_after=False`` with a GEN1 pipette.

            Even on GEN2 pipettes, the motor can still skip. So, always
            extensively test ``home_after=False`` with your particular pipette
            and your particular tips before relying on it.

        :returns: This instance
        """
        if location and isinstance(location, types.Location):
            if location.labware.is_well:
                target = location
            else:
                raise TypeError(
                    "If a location is specified as a types.Location (for "
                    "instance, as the result of a call to "
                    "tiprack.wells()[0].top()) it must be a location "
                    "relative to a well, since that is where a tip is "
                    "dropped. The passed location, however, is in "
                    "reference to {}".format(location.labware))
        elif location and isinstance(location, Well):
            if LabwareLike(location).is_fixed_trash():
                target = location.top()
            else:
                return_height = self._implementation.get_return_height()
                target = determine_drop_target(self.api_version,
                                               location,
                                               return_height)
        elif not location:
            target = self.trash_container.wells()[0].top()
        else:
            raise TypeError(
                "If specified, location should be an instance of "
                "types.Location (e.g. the return value from "
                "tiprack.wells()[0].top()) or a Well (e.g. tiprack.wells()[0]."
                " However, it is a {}".format(location))
        do_publish(self.broker, cmds.drop_tip, self.drop_tip,
                   'before', None, None, self, location=target)
        self.move_to(target)

        self._implementation.drop_tip(home_after=home_after)
        do_publish(self.broker, cmds.drop_tip, self.drop_tip,
                   'after', self, None, self, location=target)

        if self.api_version < APIVersion(2, 2) \
                and target.labware.is_well \
                and target.labware.as_well().parent.is_tiprack:
            # If this is a tiprack we can try and add the tip back to the
            # tracker
            try:
                target.labware.as_well().parent.return_tips(
                    target.labware.as_well(), self.channels)
            except AssertionError:
                # Similarly to :py:meth:`return_tips`, the failure case here
                # just means the tip can't be reused, so don't actually stop
                # the protocol
                self._log.exception(f'Could not return tip to {target}')
        self._last_tip_picked_up_from = None
        return self

    @requires_version(2, 0)
    def home(self) -> InstrumentContext:
        """ Home the robot.

        :returns: This instance.
        """
        def home_dummy(mount): pass
        mount_name = self._implementation.get_mount().name.lower()
        do_publish(self.broker, cmds.home, home_dummy,
                   'before', None, None, mount_name)
        self._implementation.home()
        do_publish(self.broker, cmds.home, home_dummy,
                   'after', self, None, mount_name)
        return self

    @requires_version(2, 0)
    def home_plunger(self) -> InstrumentContext:
        """ Home the plunger associated with this mount

        :returns: This instance.
        """
        self._implementation.home_plunger()
        return self

    @publish.both(command=cmds.distribute)
    @requires_version(2, 0)
    def distribute(self,
                   volume: Union[float, Sequence[float]],
                   source: Well,
                   dest: List[Well],
                   *args, **kwargs) -> InstrumentContext:
        """
        Move a volume of liquid from one source to multiple destinations.

        :param volume: The amount of volume to distribute to each destination
                       well.
        :type volume: float or sequence of floats
        :param source: A single well from where liquid will be aspirated.
        :param dest: List of Wells where liquid will be dispensed to.
        :param kwargs: See :py:meth:`transfer`. Some arguments are changed.
                       Specifically, ``mix_after``, if specified, is ignored
                       and ``disposal_volume``, if not specified, is set to the
                       minimum volume of the pipette
        :returns: This instance
        """
        self._log.debug("Distributing {} from {} to {}"
                        .format(volume, source, dest))
        kwargs['mode'] = 'distribute'
        kwargs['disposal_volume'] = kwargs.get(
            'disposal_volume', self.min_volume)
        kwargs['mix_after'] = (0, 0)
        blowout_location = kwargs.get('blowout_location')
        validate_blowout_location(self.api_version, 'distribute', blowout_location)

        return self.transfer(volume, source, dest, **kwargs)

    @publish.both(command=cmds.consolidate)
    @requires_version(2, 0)
    def consolidate(self,
                    volume: Union[float, Sequence[float]],
                    source: List[Well],
                    dest: Well,
                    *args, **kwargs) -> InstrumentContext:
        """
        Move liquid from multiple wells (sources) to a single well(destination)

        :param volume: The amount of volume to consolidate from each source
                       well.
        :type volume: float or sequence of floats
        :param source: List of wells from where liquid will be aspirated.
        :param dest: The single well into which liquid will be dispensed.
        :param kwargs: See :py:meth:`transfer`. Some arguments are changed.
                       Specifically, ``mix_before``, if specified, is ignored
                       and ``disposal_volume`` is ignored and set to 0.
        :returns: This instance
        """
        self._log.debug("Consolidate {} from {} to {}"
                        .format(volume, source, dest))
        kwargs['mode'] = 'consolidate'
        kwargs['mix_before'] = (0, 0)
        kwargs['disposal_volume'] = 0
        blowout_location = kwargs.get('blowout_location')
        validate_blowout_location(self.api_version, 'consolidate', blowout_location)

        return self.transfer(volume, source, dest, **kwargs)

    @publish.both(command=cmds.transfer)  # noqa: C901
    @requires_version(2, 0)
    def transfer(self,
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 trash=True,
                 **kwargs) -> InstrumentContext:
        # source: Union[Well, List[Well], List[List[Well]]],
        # dest: Union[Well, List[Well], List[List[Well]]],
        # TODO: Reach consensus on kwargs
        # TODO: Decide if to use a disposal_volume
        # TODO: Accordingly decide if remaining liquid should be blown out to
        # TODO: ..trash or the original well.
        # TODO: What should happen if the user passes a non-first-row well
        # TODO: ..as src/dest *while using multichannel pipette?
        r"""
        Transfer will move a volume of liquid from a source location(s)
        to a dest location(s). It is a higher-level command, incorporating
        other :py:class:`InstrumentContext` commands, like :py:meth:`aspirate`
        and :py:meth:`dispense`, designed to make protocol writing easier at
        the cost of specificity.

        :param volume: The amount of volume to aspirate from each source and
                       dispense to each destination.
                       If volume is a list, each volume will be used for the
                       sources/targets at the matching index. If volumes is a
                       tuple with two elements, like `(20, 100)`, then a list
                       of volumes will be generated with a linear gradient
                       between the two volumes in the tuple.
        :param source: A single well or a list of wells from where liquid
                       will be aspirated.
        :param dest: A single well or a list of wells where liquid
                     will be dispensed to.
        :param \**kwargs: See below

        :Keyword Arguments:

            * *new_tip* (``string``) --

                - 'never': no tips will be picked up or dropped during transfer
                - 'once': (default) a single tip will be used for all commands.
                - 'always': use a new tip for each transfer.

            * *trash* (``boolean``) --
              If `True` (default behavior), tips will be
              dropped in the trash container attached this `Pipette`.
              If `False` tips will be returned to tiprack.

            * *touch_tip* (``boolean``) --
              If `True`, a :py:meth:`touch_tip` will occur following each
              :py:meth:`aspirate` and :py:meth:`dispense`. If set to `False`
              (default behavior), no :py:meth:`touch_tip` will occur.

            * *blow_out* (``boolean``) --
              If `True`, a :py:meth:`blow_out` will occur following each
              :py:meth:`dispense`, but only if the pipette has no liquid left
              in it. If set to `False` (default), no :py:meth:`blow_out` will
              occur.

            * *blowout_location* (``string``) --
                - 'source well': blowout excess liquid into source well
                - 'destintation well': blowout excess liquid into destination
                   well
                - 'trash': blowout excess liquid into the trash
                If no `blowout_location` specified, no `disposal_volume`
                specified, and the pipette contains liquid,
                a :py:meth:`blow_out` will occur into the source well

                If no `blowout_location` specified and either
                `disposal_volume` is specified or the pipette is empty,
                a :py:meth:`blow_out` will occur into the trash

                If `blow_out` is set to `False`, this parameter will be ignored

            * *mix_before* (``tuple``) --
              The tuple, if specified, gives the amount of volume to
              :py:meth:`mix` preceding each :py:meth:`aspirate` during the
              transfer. The tuple is interpreted as (repetitions, volume).

            * *mix_after* (``tuple``) --
              The tuple, if specified, gives the amount of volume to
              :py:meth:`mix` after each :py:meth:`dispense` during the
              transfer. The tuple is interpreted as (repetitions, volume).

            * *disposal_volume* (``float``) --
              (:py:meth:`distribute` only) Volume of liquid to be disposed off
              after distributing. When dispensing multiple times from the same
              tip, it is recommended to aspirate an extra amount of liquid to
              be disposed off after distributing.

            * *carryover* (``boolean``) --
              If `True` (default), any `volume` that exceeds the maximum volume
              of this Pipette will be split into multiple smaller volumes.

            * *gradient* (``lambda``) --
              Function for calculating the curve used for gradient volumes.
              When `volume` is a tuple of length 2, its values are used to
              create a list of gradient volumes. The default curve for this
              gradient is linear (lambda x: x), however a method can be passed
              with the `gradient` keyword argument to create a custom curve.

        :returns: This instance
        """
        self._log.debug("Transfer {} from {} to {}".format(
            volume, source, dest))

        blowout_location = kwargs.get('blowout_location')
        validate_blowout_location(self.api_version, 'transfer', blowout_location)

        kwargs['mode'] = kwargs.get('mode', 'transfer')

        mix_strategy, mix_opts = mix_from_kwargs(kwargs)

        if trash:
            drop_tip = transfers.DropTipStrategy.TRASH
        else:
            drop_tip = transfers.DropTipStrategy.RETURN

        new_tip = kwargs.get('new_tip')
        if isinstance(new_tip, str):
            new_tip = types.TransferTipPolicy[new_tip.upper()]

        blow_out = kwargs.get('blow_out')
        blow_out_strategy = None

        if blow_out and not blowout_location:
            if self.current_volume:
                blow_out_strategy = transfers.BlowOutStrategy.SOURCE
            else:
                blow_out_strategy = transfers.BlowOutStrategy.TRASH
        elif blow_out and blowout_location:
            if blowout_location == 'source well':
                blow_out_strategy = transfers.BlowOutStrategy.SOURCE
            elif blowout_location == 'destination well':
                blow_out_strategy = transfers.BlowOutStrategy.DEST
            elif blowout_location == 'trash':
                blow_out_strategy = transfers.BlowOutStrategy.TRASH

        if new_tip != types.TransferTipPolicy.NEVER:
            tr, next_tip = next_available_tip(self.starting_tip,
                                              self.tip_racks,
                                              self.channels)
            max_volume = min(next_tip.max_volume, self.max_volume)
        else:
            max_volume = self.hw_pipette['working_volume']

        touch_tip = None
        if kwargs.get('touch_tip'):
            touch_tip = transfers.TouchTipStrategy.ALWAYS

        default_args = transfers.Transfer()

        disposal = kwargs.get('disposal_volume')
        if disposal is None:
            disposal = default_args.disposal_volume

        air_gap = kwargs.get('air_gap', default_args.air_gap)
        if air_gap < 0 or air_gap >= max_volume:
            raise ValueError(
                "air_gap must be between 0uL and the pipette's expected "
                f"working volume, {max_volume}uL")

        transfer_args = transfers.Transfer(
            new_tip=new_tip or default_args.new_tip,
            air_gap=air_gap,
            carryover=kwargs.get('carryover') or default_args.carryover,
            gradient_function=(kwargs.get('gradient_function') or
                               default_args.gradient_function),
            disposal_volume=disposal,
            mix_strategy=mix_strategy,
            drop_tip_strategy=drop_tip,
            blow_out_strategy=blow_out_strategy or
            default_args.blow_out_strategy,
            touch_tip_strategy=(touch_tip or
                                default_args.touch_tip_strategy)
        )
        transfer_options = transfers.TransferOptions(transfer=transfer_args,
                                                     mix=mix_opts)
        plan = transfers.TransferPlan(volume, source, dest, self, max_volume,
                                      self.api_version, kwargs['mode'],
                                      transfer_options)
        self._execute_transfer(plan)
        return self

    def _execute_transfer(self, plan: transfers.TransferPlan):
        for cmd in plan:
            getattr(self, cmd['method'])(*cmd['args'], **cmd['kwargs'])

    @requires_version(2, 0)
    def delay(self):
        return self._implementation.delay()

    @requires_version(2, 0)
    def move_to(self,
                location: types.Location,
                force_direct: bool = False,
                minimum_z_height: Optional[float] = None,
                speed: Optional[float] = None
                ) -> InstrumentContext:
        """ Move the instrument.

        :param location: The location to move to.
        :type location: :py:class:`.types.Location`
        :param force_direct: If set to true, move directly to destination
                        without arc motion.
        :param minimum_z_height: When specified, this Z margin is able to raise
                                 (but never lower) the mid-arc height.
        :param speed: The speed at which to move. By default,
                      :py:attr:`InstrumentContext.default_speed`. This controls
                      the straight linear speed of the motion; to limit
                      individual axis speeds, you can use
                      :py:attr:`.ProtocolContext.max_speeds`.
        """
        from_loc = self._ctx.location_cache
        if not from_loc:
            from_loc = types.Location(types.Point(0, 0, 0), LabwareLike(None))

        for mod in self._ctx._modules:
            if isinstance(mod, ThermocyclerContext):
                mod.flag_unsafe_move(to_loc=location, from_loc=from_loc)

        self._implementation.move_to(
            location=location,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            speed=speed
        )
        return self

    @property  # type: ignore
    @requires_version(2, 0)
    def mount(self) -> str:
        """ Return the name of the mount this pipette is attached to """
        return self._implementation.get_mount().name.lower()

    @property  # type: ignore
    @requires_version(2, 0)
    def speed(self) -> 'PlungerSpeeds':
        """ The speeds (in mm/s) configured for the pipette plunger.

        This is an object with attributes ``aspirate``, ``dispense``, and
        ``blow_out`` holding the plunger speeds for the corresponding
        operation.

        .. note::
            This property is equivalent to :py:attr:`flow_rate`; the only
            difference is the units in which this property is specified.
            Specifying this attribute uses the units of the linear speed of
            the plunger inside the pipette, while :py:attr:`flow_rate` uses
            the units of the volumetric flow rate of liquid into or out of the
            tip. Because :py:attr:`speed` and :py:attr:`flow_rate` modify the
            same values, setting one will override the other.

        For instance, to set the plunger speed during an aspirate action, do

        .. code-block :: python

            instrument.speed.aspirate = 50

        """
        return self._implementation.get_speed()

    @property  # type: ignore
    @requires_version(2, 0)
    def flow_rate(self) -> 'FlowRates':
        """ The speeds (in uL/s) configured for the pipette.

        This is an object with attributes ``aspirate``, ``dispense``, and
        ``blow_out`` holding the flow rates for the corresponding operation.

        .. note::
          This property is equivalent to :py:attr:`speed`; the only
          difference is the units in which this property is specified.
          specifiying this property uses the units of the volumetric flow rate
          of liquid into or out of the tip, while :py:attr:`speed` uses the
          units of the linear speed of the plunger inside the pipette.
          Because :py:attr:`speed` and :py:attr:`flow_rate` modify the
          same values, setting one will override the other.

        For instance, to change the flow rate for aspiration on an instrument
        you would do

        .. code-block :: python

            instrument.flow_rate.aspirate = 50

        """
        return self._implementation.get_flow_rate()

    @property  # type: ignore
    @requires_version(2, 0)
    def type(self) -> str:
        """ One of `'single'` or `'multi'`.
        """
        model = self.name
        if 'single' in model:
            return 'single'
        elif 'multi' in model:
            return 'multi'
        else:
            raise RuntimeError("Bad pipette name: {}".format(model))

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_racks(self) -> List[Labware]:
        """
        The tip racks that have been linked to this pipette.

        This is the property used to determine which tips to pick up next when
        calling :py:meth:`pick_up_tip` without arguments.
        """
        return self._tip_racks

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]):
        self._tip_racks = racks

    @property  # type: ignore
    @requires_version(2, 0)
    def trash_container(self) -> Labware:
        """ The trash container associated with this pipette.

        This is the property used to determine where to drop tips and blow out
        liquids when calling :py:meth:`drop_tip` or :py:meth:`blow_out` without
        arguments.
        """
        return self._trash

    @trash_container.setter
    def trash_container(self, trash: Labware):
        self._trash = trash

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """
        The name string for the pipette (e.g. 'p300_single')
        """
        return self._implementation.get_pipette_name()

    @property  # type: ignore
    @requires_version(2, 0)
    def model(self) -> str:
        """
        The model string for the pipette (e.g. 'p300_single_v1.3')
        """
        return self._implementation.get_model()

    @property  # type: ignore
    @requires_version(2, 0)
    def min_volume(self) -> float:
        return self._implementation.get_min_volume()

    @property  # type: ignore
    @requires_version(2, 0)
    def max_volume(self) -> float:
        """
        The maximum volume, in microliters (µL), that this pipette can hold.

        The maximum volume that you can actually aspirate might be lower than
        this, depending on what kind of tip is attached to this pipette.  For
        example, a P300 Single-Channel pipette always has a ``max_volume`` of
        300 µL, but if it's using a 200 µL filter tip, its usable volume would
        be limited to 200 µL.
        """
        return self._implementation.get_max_volume()

    @property  # type: ignore
    @requires_version(2, 0)
    def current_volume(self) -> float:
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        return self._implementation.get_current_volume()

    @property  # type: ignore
    @requires_version(2, 7)
    def has_tip(self) -> bool:
        """
        :returns: Whether this instrument has a tip attached or not.
        :type: bool
        """
        return self._implementation.has_tip()

    @property  # type: ignore
    def _has_tip(self) -> bool:
        """
        Internal function used to check whether this instrument has a
        tip attached or not.
        """
        return self._implementation.has_tip()

    @property  # type: ignore
    @requires_version(2, 0)
    def hw_pipette(self) -> PipetteDict:
        """ View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        return self._implementation.get_pipette()

    @property  # type: ignore
    @requires_version(2, 0)
    def channels(self) -> int:
        """ The number of channels on the pipette. """
        return self._implementation.get_channels()

    @property  # type: ignore
    @requires_version(2, 2)
    def return_height(self) -> float:
        """ The height to return a tip to its tiprack. """
        return self._implementation.get_return_height()

    @property  # type: ignore
    @requires_version(2, 0)
    def well_bottom_clearance(self) -> 'Clearances':
        """ The distance above the bottom of a well to aspirate or dispense.

        This is an object with attributes ``aspirate`` and ``dispense``,
        describing the default heights of the corresponding operation. The
        default is 1.0mm for both aspirate and dispense.

        When :py:meth:`aspirate` or :py:meth:`dispense` is given a
        :py:class:`.Well` rather than a full :py:class:`.Location`, the robot
        will move this distance above the bottom of the well to aspirate or
        dispense.

        To change, set the corresponding attribute. For instance,

        .. code-block:: python

            instr.well_bottom_clearance.aspirate = 1

        """
        return self._implementation.get_well_bottom_clearance()

    def __repr__(self):
        return '<{}: {} in {}>'.format(self.__class__.__name__,
                                       self._implementation.get_model(),
                                       self._implementation.get_mount().name)

    def __str__(self):
        return '{} on {} mount'.format(self.hw_pipette['display_name'],
                                       self.mount)

    @requires_version(2, 7)
    def pair_with(
            self, instrument: InstrumentContext) -> PairedInstrumentContext:
        """ This function allows you to pair both of your pipettes and use
        them simultaneously. The function implicitly decides a primary
        and secondary pipette based on which instrument you call this
        function on.

        :param instrument: The secondary instrument you wish to use

        :raises UnsupportedInstrumentPairingError: If you try to pair
        pipettes that are not currently supported together.
        :returns: PairedInstrumentContext: This is the object you
        will call commands on.

        This function returns a :py:class:`PairedInstrumentContext`.
        The building block commands are the same as an individual pipette's
        building block commands found at :ref:`v2-atomic-commands`,
        and when you want to move pipettes simultaneously you need to use the
        :py:class:`PairedInstrumentContext`.


        Limitations:
        1. This function utilizes a "primary" and "secondary" pipette to make
        positional decisions. The consequence of doing this is that all X & Y
        positions are based on the primary pipette only.
        2. At this time, only pipettes of the same type are supported for
        pipette pairing. This means that you cannot utilize a P1000 Single
        channel and a P300 Single channel at the same time.

        .. code-block :: python
            :substitutions:

            from opentrons import protocol_api

            # metadata
            metadata = {
                'protocolName': 'My Protocol',
                'author': 'Name <email@address.com>',
                'description': 'Simple paired pipette protocol,
                'apiLevel': '|apiLevel|'
            }

            def run(ctx: protocol_api.ProtocolContext):
                right_pipette = ctx.load_instrument(
                    'p300_single_gen2', 'right')
                left_pipette = ctx.load_instrument('p300_single_gen2', 'left')

                # In this scenario, the right pipette is the primary pipette
                # while the left pipette is the secondary pipette. All XY
                # locations will be based on the right pipette.
                right_paired_with_left = right_pipette.pair_with(left_pipette)
                right_paired_with_left.pick_up_tip()
                right_paired_with_left.drop_tip()

                # In this scenario, the left pipette is the primary pipette
                # while the right pipette is the secondary pipette. All XY
                # locations will be based on the left pipette.
                left_paired_with_right = left_pipette.pair_with(right_pipette)
                left_paired_with_right.pick_up_tip()
                left_paired_with_right.drop_tip()

        .. note::

            Before using this method, you should seriously consider whether
            this is the best fit for your use-case especially given the
            limitations listed above.
        """
        if instrument.name != self.name:
            raise UnsupportedInstrumentPairingError(
                'At this time, you cannot pair'
                f'{instrument.name} with {self.name}')

        return PairedInstrumentContext(
            primary_instrument=self,
            secondary_instrument=instrument,
            ctx=self._ctx,
            pair_policy=PipettePair.of_mount(self._implementation.get_mount()),
            api_version=self.api_version,
            hardware_manager=self._ctx._implementation.get_hardware(),
            trash=self.trash_container,
            log_parent=self._log
        )

    @lru_cache(maxsize=12)
    def _tip_length_for(self, tiprack: Labware) -> float:
        """ Get the tip length, including overlap, for a tip from this rack """
        return tip_length_for(self.hw_pipette, tiprack)

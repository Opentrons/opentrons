from __future__ import annotations

from typing import Optional, Union, Sequence, List

from opentrons import APIVersion, types
from opentrons.experimental_protocol_api.labware import Well, Labware
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_api import PairedInstrumentContext
from opentrons.protocol_api.instrument_context import AdvancedLiquidHandling
from opentrons.protocols.api_support.util import requires_version, \
    PlungerSpeeds, FlowRates, Clearances


class InstrumentContext:
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
    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def starting_tip(self) -> Optional[Well]:
        """ The starting tip from which the pipette pick up
        """
        raise NotImplementedError()

    @starting_tip.setter
    def starting_tip(self, location: Optional[Well]):
        raise NotImplementedError()

    @requires_version(2, 0)
    def reset_tipracks(self):
        """ Reload all tips in each tip rack and reset starting tip
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def default_speed(self) -> float:
        """ The speed at which the robot's gantry moves.

        By default, 400 mm/s. Changing this value will change the speed of the
        pipette when moving between labware. In addition to changing the
        default, the speed of individual motions can be changed with the
        ``speed`` argument to :py:meth:`InstrumentContext.move_to`.
        """
        raise NotImplementedError()

    @default_speed.setter
    def default_speed(self, speed: float) -> None:
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

    @requires_version(2, 0)
    def drop_tip(  # noqa: C901
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True) -> InstrumentContext:
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
        raise NotImplementedError()

    @requires_version(2, 0)
    def home(self) -> InstrumentContext:
        """ Home the robot.

        :returns: This instance.
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def home_plunger(self) -> InstrumentContext:
        """ Home the plunger associated with this mount

        :returns: This instance.
        """
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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

        Args:
            trash:
        """
        raise NotImplementedError()

    @requires_version(2, 0)
    def delay(self) -> None:
        raise NotImplementedError()

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
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def mount(self) -> str:
        """ Return the name of the mount this pipette is attached to """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def speed(self) -> PlungerSpeeds:
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
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def flow_rate(self) -> FlowRates:
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
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def type(self) -> str:
        """ One of `'single'` or `'multi'`.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_racks(self) -> List[Labware]:
        """
        The tip racks that have been linked to this pipette.

        This is the property used to determine which tips to pick up next when
        calling :py:meth:`pick_up_tip` without arguments.
        """
        raise NotImplementedError()

    @tip_racks.setter
    def tip_racks(self, racks: List[Labware]) -> None:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def trash_container(self) -> Labware:
        """ The trash container associated with this pipette.

        This is the property used to determine where to drop tips and blow out
        liquids when calling :py:meth:`drop_tip` or :py:meth:`blow_out` without
        arguments.
        """
        raise NotImplementedError()

    @trash_container.setter
    def trash_container(self, trash: Labware) -> None:
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """
        The name string for the pipette (e.g. 'p300_single')
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def model(self) -> str:
        """
        The model string for the pipette (e.g. 'p300_single_v1.3')
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def min_volume(self) -> float:
        raise NotImplementedError()

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
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def current_volume(self) -> float:
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 7)
    def has_tip(self) -> bool:
        """
        :returns: Whether this instrument has a tip attached or not.
        :type: bool
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def hw_pipette(self) -> PipetteDict:
        """ View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def channels(self) -> int:
        """ The number of channels on the pipette. """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 2)
    def return_height(self) -> float:
        """ The height to return a tip to its tiprack. """
        raise NotImplementedError()

    @property  # type: ignore
    @requires_version(2, 0)
    def well_bottom_clearance(self) -> Clearances:
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
        raise NotImplementedError()

    def __repr__(self) -> str:
        raise NotImplementedError()

    def __str__(self) -> str:
        raise NotImplementedError()

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
        raise NotImplementedError()

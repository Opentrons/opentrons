from __future__ import annotations

import logging
from contextlib import nullcontext
from typing import Any, List, Optional, Sequence, Union, cast
from opentrons_shared_data.errors.exceptions import (
    CommandPreconditionViolated,
    CommandParameterLimitViolated,
)
from opentrons.legacy_broker import LegacyBroker
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons import types
from opentrons.commands import commands as cmds

from opentrons.commands import publisher
from opentrons.protocols.advanced_control.mix import mix_from_kwargs
from opentrons.protocols.advanced_control import transfers

from opentrons.protocols.api_support.deck_type import NoTrashDefinedError
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support import instrument
from opentrons.protocols.api_support.util import (
    FlowRates,
    PlungerSpeeds,
    clamp_value,
    requires_version,
    APIVersionError,
)
from opentrons_shared_data.errors.exceptions import UnexpectedTipRemovalError

from .core.common import InstrumentCore, ProtocolCore
from .core.engine import ENGINE_CORE_API_VERSION
from .core.legacy.legacy_instrument_core import LegacyInstrumentCore
from .config import Clearances
from ._waste_chute import WasteChute
from . import labware, validation


AdvancedLiquidHandling = Union[
    labware.Well,
    types.Location,
    Sequence[Union[labware.Well, types.Location]],
    Sequence[Sequence[labware.Well]],
]

_DEFAULT_ASPIRATE_CLEARANCE = 1.0
_DEFAULT_DISPENSE_CLEARANCE = 1.0

_log = logging.getLogger(__name__)

_PREP_AFTER_ADDED_IN = APIVersion(2, 13)
"""The version after which the pick-up tip procedure should also prepare the plunger."""
_PRESSES_INCREMENT_REMOVED_IN = APIVersion(2, 14)
"""The version after which the pick-up tip procedure deprecates presses and increment arguments."""
_DROP_TIP_LOCATION_ALTERNATING_ADDED_IN = APIVersion(2, 15)
"""The version after which a drop-tip-into-trash procedure drops tips in different alternating locations within the trash well."""


class InstrumentContext(publisher.CommandPublisher):
    """A context for a specific pipette or instrument.

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

    def __init__(
        self,
        core: InstrumentCore,
        protocol_core: ProtocolCore,
        broker: LegacyBroker,
        api_version: APIVersion,
        tip_racks: List[labware.Labware],
        trash: Optional[labware.Labware],
        requested_as: str,
    ) -> None:
        super().__init__(broker)
        self._api_version = api_version
        self._core = core
        self._protocol_core = protocol_core
        self._tip_racks = tip_racks
        self._last_tip_picked_up_from: Union[labware.Well, None] = None
        self._starting_tip: Union[labware.Well, None] = None
        self._well_bottom_clearances = Clearances(
            default_aspirate=_DEFAULT_ASPIRATE_CLEARANCE,
            default_dispense=_DEFAULT_DISPENSE_CLEARANCE,
        )

        self.trash_container = trash
        self.requested_as = requested_as

    @property  # type: ignore
    @requires_version(2, 0)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property  # type: ignore
    @requires_version(2, 0)
    def starting_tip(self) -> Union[labware.Well, None]:
        """
        Which well of a tip rack the pipette should start at when automatically choosing tips to pick up.

        See :py:meth:`.pick_up_tip()`.

        .. note::

            In robot software versions 6.3.0 and 6.3.1, protocols specifying API level 2.14 would
            not respect ``starting_tip`` on the second and subsequent calls to
            :py:meth:`.InstrumentContext.pick_up_tip` with no argument. This is fixed for all API
            levels as of robot software version 7.0.0.
        """
        return self._starting_tip

    @starting_tip.setter
    def starting_tip(self, location: Union[labware.Well, None]) -> None:
        self._starting_tip = location

    @requires_version(2, 0)
    def reset_tipracks(self) -> None:
        """Reload all tips in each tip rack and reset starting tip"""
        for tiprack in self.tip_racks:
            tiprack.reset()
        self.starting_tip = None

    @property  # type: ignore[misc]
    @requires_version(2, 0)
    def default_speed(self) -> float:
        """The speed at which the robot's gantry moves.

        By default, 400 mm/s. Changing this value will change the speed of the
        pipette when moving between labware. In addition to changing the
        default, the speed of individual motions can be changed with the
        ``speed`` argument to :py:meth:`InstrumentContext.move_to`.
        """
        return self._core.get_default_speed()

    @default_speed.setter
    def default_speed(self, speed: float) -> None:
        self._core.set_default_speed(speed)

    @requires_version(2, 0)
    def aspirate(
        self,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, labware.Well]] = None,
        rate: float = 1.0,
    ) -> InstrumentContext:
        """
        Aspirate a given volume of liquid from the specified location, using
        this pipette.

        :param volume: The volume to aspirate, in microliters (µL).  If 0 or
                       unspecified, defaults to the highest volume possible
                       with this pipette and its currently attached tip.
        :type volume: int or float
        :param location: Where to aspirate from. If `location` is a
                         :py:class:`.Well`, the robot will aspirate from
                         :py:obj:`well_bottom_clearance.aspirate <well_bottom_clearance>`
                         mm above the bottom of the well. If `location` is a
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
        _log.debug(
            "aspirate {} from {} at {}".format(
                volume, location if location else "current position", rate
            )
        )

        well: Optional[labware.Well] = None
        move_to_location: types.Location

        last_location = self._get_last_location_by_api_version()
        try:
            target = validation.validate_location(
                location=location, last_location=last_location
            )
        except validation.NoLocationError as e:
            raise RuntimeError(
                "If aspirate is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is."
            ) from e

        if isinstance(target, validation.WellTarget):
            move_to_location = target.location or target.well.bottom(
                z=self._well_bottom_clearances.aspirate
            )
            well = target.well
        if isinstance(target, validation.PointTarget):
            move_to_location = target.location

        if self.api_version >= APIVersion(2, 11):
            instrument.validate_takes_liquid(
                location=move_to_location,
                reject_module=self.api_version >= APIVersion(2, 13),
                reject_adapter=self.api_version >= APIVersion(2, 15),
            )

        c_vol = self._core.get_available_volume() if not volume else volume
        flow_rate = self._core.get_aspirate_flow_rate(rate)

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.aspirate(
                instrument=self,
                volume=c_vol,
                location=move_to_location,
                flow_rate=flow_rate,
                rate=rate,
            ),
        ):
            self._core.aspirate(
                location=move_to_location,
                well_core=well._core if well is not None else None,
                volume=c_vol,
                rate=rate,
                flow_rate=flow_rate,
                in_place=target.in_place,
            )

        return self

    @requires_version(2, 0)
    def dispense(
        self,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, labware.Well]] = None,
        rate: float = 1.0,
        push_out: Optional[float] = None,
    ) -> InstrumentContext:
        """
        Dispense a volume of liquid (in microliters/uL) using this pipette
        into the specified location.

        If only a volume is passed, the pipette will dispense from its current
        position. If only a location is passed (as in
        ``instr.dispense(location=wellplate['A1'])``), all of the liquid
        aspirated into the pipette will be dispensed (this volume is accessible
        through :py:attr:`current_volume`).

        :param volume: The volume of liquid to dispense, in microliters. If 0
                       or unspecified, defaults to :py:attr:`current_volume`.
        :type volume: int or float

        :param location: Where to dispense into. If `location` is a
                         :py:class:`.Well`, the robot will dispense into
                         :py:obj:`well_bottom_clearance.dispense <well_bottom_clearance>`
                         mm above the bottom of the well. If `location` is a
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
        :param push_out: Continue past the plunger bottom to guarantee all liquid
                        leaves the tip. Specified in microliters. By default, this value is None.
        :type push_out: float

        :returns: This instance.

        .. note::

            If ``dispense`` is called with a single argument, it will not try
            to guess whether the argument is a volume or location - it is
            required to be a volume. If you want to call ``dispense`` with only
            a location, specify it as a keyword argument:
            ``instr.dispense(location=wellplate['A1'])``

        """
        if self.api_version < APIVersion(2, 15) and push_out:
            raise APIVersionError(
                "Unsupported parameter push_out. Change your API version to 2.15 or above to use this parameter."
            )
        _log.debug(
            "dispense {} from {} at {}".format(
                volume, location if location else "current position", rate
            )
        )
        well: Optional[labware.Well] = None
        last_location = self._get_last_location_by_api_version()

        try:
            target = validation.validate_location(
                location=location, last_location=last_location
            )
        except validation.NoLocationError as e:
            raise RuntimeError(
                "If dispense is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "aspirate) must previously have been called so the robot "
                "knows where it is."
            ) from e

        if isinstance(target, validation.WellTarget):
            well = target.well
            if target.location:
                move_to_location = target.location
            elif well.parent._core.is_fixed_trash():
                move_to_location = target.well.top()
            else:
                move_to_location = target.well.bottom(
                    z=self._well_bottom_clearances.dispense
                )
        if isinstance(target, validation.PointTarget):
            move_to_location = target.location

        if self.api_version >= APIVersion(2, 11):
            instrument.validate_takes_liquid(
                location=move_to_location,
                reject_module=self.api_version >= APIVersion(2, 13),
                reject_adapter=self.api_version >= APIVersion(2, 15),
            )

        c_vol = self._core.get_current_volume() if not volume else volume

        flow_rate = self._core.get_dispense_flow_rate(rate)

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.dispense(
                instrument=self,
                volume=c_vol,
                location=move_to_location,
                rate=rate,
                flow_rate=flow_rate,
            ),
        ):
            self._core.dispense(
                volume=c_vol,
                rate=rate,
                location=move_to_location,
                well_core=well._core if well is not None else None,
                flow_rate=flow_rate,
                in_place=target.in_place,
                push_out=push_out,
            )

        return self

    @requires_version(2, 0)
    def mix(
        self,
        repetitions: int = 1,
        volume: Optional[float] = None,
        location: Optional[Union[types.Location, labware.Well]] = None,
        rate: float = 1.0,
    ) -> InstrumentContext:
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
        :raises: ``UnexpectedTipRemovalError`` -- if no tip is attached to the pipette.
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
        _log.debug(
            "mixing {}uL with {} repetitions in {} at rate={}".format(
                volume, repetitions, location if location else "current position", rate
            )
        )
        if not self._core.has_tip():
            raise UnexpectedTipRemovalError("mix", self.name, self.mount)

        c_vol = self._core.get_available_volume() if not volume else volume

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.mix(
                instrument=self,
                repetitions=repetitions,
                volume=c_vol,
                location=location,
            ),
        ):
            self.aspirate(volume, location, rate)
            while repetitions - 1 > 0:
                self.dispense(volume, rate=rate)
                self.aspirate(volume, rate=rate)
                repetitions -= 1
            self.dispense(volume, rate=rate)

        return self

    @requires_version(2, 0)
    def blow_out(
        self, location: Optional[Union[types.Location, labware.Well]] = None
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
        well: Optional[labware.Well] = None
        move_to_location: types.Location

        last_location = self._get_last_location_by_api_version()
        try:
            target = validation.validate_location(
                location=location, last_location=last_location
            )
        except validation.NoLocationError as e:
            raise RuntimeError(
                "If blow out is called without an explicit location, another"
                " method that moves to a location (such as move_to or "
                "dispense) must previously have been called so the robot "
                "knows where it is."
            ) from e

        if isinstance(target, validation.WellTarget):
            if target.well.parent.is_tiprack:
                _log.warning(
                    "Blow_out being performed on a tiprack. "
                    "Please re-check your code"
                )
            move_to_location = target.location or target.well.top()
            well = target.well
        elif isinstance(target, validation.PointTarget):
            move_to_location = target.location

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.blow_out(instrument=self, location=move_to_location),
        ):
            self._core.blow_out(
                location=move_to_location,
                well_core=well._core if well is not None else None,
                in_place=target.in_place,
            )

        return self

    def _determine_speed(self, speed: float) -> float:
        if self.api_version < APIVersion(2, 4):
            return clamp_value(speed, 80, 20, "touch_tip:")
        else:
            return clamp_value(speed, 80, 1, "touch_tip:")

    @publisher.publish(command=cmds.touch_tip)
    @requires_version(2, 0)
    def touch_tip(
        self,
        location: Optional[labware.Well] = None,
        radius: float = 1.0,
        v_offset: float = -1.0,
        speed: float = 60.0,
    ) -> InstrumentContext:
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
        :raises: ``UnexpectedTipRemovalError`` -- if no tip is attached to the pipette
        :raises RuntimeError: If no location is specified and location cache is
                              None. This should happen if `touch_tip` is called
                              without first calling a method that takes a
                              location (eg, :py:meth:`.aspirate`,
                              :py:meth:`dispense`)
        :returns: This instance

        .. note::

            This is behavior change from legacy API (which accepts any
            ``Placeable`` as the ``location`` parameter)

        """
        if not self._core.has_tip():
            raise UnexpectedTipRemovalError("touch_tip", self.name, self.mount)

        checked_speed = self._determine_speed(speed)

        # If location is a valid well, move to the well first
        if location is None:
            last_location = self._protocol_core.get_last_location()
            if not last_location:
                raise RuntimeError("No valid current location cache present")
            parent_labware, well = last_location.labware.get_parent_labware_and_well()
            if not well or not parent_labware:
                raise RuntimeError(
                    f"Last location {location} has no associated well or labware."
                )
        elif isinstance(location, labware.Well):
            well = location
            parent_labware = well.parent
        else:
            raise TypeError(f"location should be a Well, but it is {location}")

        if "touchTipDisabled" in parent_labware.quirks:
            _log.info(f"Ignoring touch tip on labware {well}")
            return self
        if parent_labware.is_tiprack:
            _log.warning(
                "Touch_tip being performed on a tiprack. Please re-check your code"
            )

        if self.api_version < APIVersion(2, 4):
            move_to_location = well.top()
        else:
            move_to_location = well.top(z=v_offset)

        self._core.touch_tip(
            location=move_to_location,
            well_core=well._core,
            radius=radius,
            z_offset=v_offset,
            speed=checked_speed,
        )
        return self

    @publisher.publish(command=cmds.air_gap)
    @requires_version(2, 0)
    def air_gap(
        self, volume: Optional[float] = None, height: Optional[float] = None
    ) -> InstrumentContext:
        """
        Pull air into the pipette current tip at the current location

        :param volume: The amount in uL to aspirate air into the tube.
                       (Default will use all remaining volume in tip)
        :type volume: float

        :param height: The number of millimeters to move above the current Well
                       to air-gap aspirate. (Default: 5 mm above current Well)
        :type height: float

        :raises: ``UnexpectedTipRemovalError`` -- if no tip is attached to the pipette

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
        if not self._core.has_tip():
            raise UnexpectedTipRemovalError("air_gap", self.name, self.mount)

        if height is None:
            height = 5
        loc = self._protocol_core.get_last_location()
        if not loc or not loc.labware.is_well:
            raise RuntimeError("No previous Well cached to perform air gap")
        target = loc.labware.as_well().top(height)
        self.move_to(target, publish=False)
        self.aspirate(volume)
        return self

    @publisher.publish(command=cmds.return_tip)
    @requires_version(2, 0)
    def return_tip(self, home_after: Optional[bool] = None) -> InstrumentContext:
        """
        If a tip is currently attached to the pipette, then the pipette will
        return the tip to its location in the tip rack.

        This will not reset tip tracking, so the well flag will remain ``False``.

        :returns: This instance

        :param home_after:
            See the ``home_after`` parameter of :py:obj:`drop_tip`.
        """
        if not self._core.has_tip():
            _log.warning("Pipette has no tip to return")

        loc = self._last_tip_picked_up_from

        if not isinstance(loc, labware.Well):
            raise TypeError(f"Last tip location should be a Well but it is: {loc}")

        self.drop_tip(loc, home_after=home_after)

        return self

    @requires_version(2, 0)  # noqa: C901
    def pick_up_tip(
        self,
        location: Union[types.Location, labware.Well, labware.Labware, None] = None,
        presses: Optional[int] = None,
        increment: Optional[float] = None,
        prep_after: Optional[bool] = None,
    ) -> InstrumentContext:
        """
        Pick up a tip for the pipette to run liquid-handling commands.

        If no location is passed, the Pipette will pick up the next available
        tip in its :py:attr:`InstrumentContext.tip_racks` list.
        Within each tip rack, tips will be picked up in the order specified by
        the labware definition and :py:meth:`.Labware.wells`.
        To adjust where the sequence starts, see :py:obj:`.starting_tip`.

        The tip to pick up can be manually specified with the `location`
        argument. The `location` argument can be specified in several ways:

        * If the only thing to specify is which well from which to pick
          up a tip, `location` can be a :py:class:`.Well`. For instance,
          if you have a tip rack in a variable called `tiprack`, you can
          pick up a specific tip from it with
          ``instr.pick_up_tip(tiprack.wells()[0])``. This style of call can
          be used to make the robot pick up a tip from a tip rack that
          was not specified when creating the :py:class:`.InstrumentContext`.

        * If you want to pick up the next available tip(s) in a specific
          tip rack, you may use the tip rack directly:
          e.g. ``instr.pick_up_tip(tiprack)``

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
                        not picking it up--generally not desirable, but could
                        be used for dry-run).

                        .. deprecated:: 2.14
                            Use the Opentrons App to change pipette pick-up settings.
        :type presses: int
        :param increment: The additional distance to travel on each successive
                          press (e.g.: if `presses=3` and `increment=1.0`, then
                          the first press will travel down into the tip by
                          3.5mm, the second by 4.5mm, and the third by 5.5mm).

                        .. deprecated:: 2.14
                            Use the Opentrons App to change pipette pick-up settings.
        :type increment: float
        :param prep_after: Whether the pipette plunger should prepare itself
                           to aspirate immediately after picking up a tip.

                           .. warning::
                               This is provided for compatibility with older
                               Python Protocol API behavior. You should normally
                               leave this unset.

                           If ``True``, the pipette will move its plunger position to
                           bottom in preparation for any following calls to
                           :py:meth:`.aspirate`.

                           If ``False``, the pipette will prepare its plunger later,
                           during the next call to :py:meth:`.aspirate`. This is
                           accomplished by moving the tip to the top of the well,
                           and positioning the plunger outside any potential liquids.

                           .. warning::
                               Setting ``prep_after=False`` may create an unintended
                               pipette movement, when the pipette automatically moves
                               the tip to the top of the well to prepare the plunger.
        :type prep_after: bool

        .. versionchanged:: 2.13
            Adds the ``prep_after`` argument. In version 2.12 and earlier, the plunger can't prepare
            itself for aspiration during :py:meth:`.pick_up_tip`, and will instead always
            prepare during :py:meth:`.aspirate`. Version 2.12 and earlier will raise an
            ``APIVersionError`` if a value is set for ``prep_after``.

        :returns: This instance
        """

        if presses is not None and self._api_version >= _PRESSES_INCREMENT_REMOVED_IN:
            raise APIVersionError(
                f"presses is only available in API versions lower than {_PRESSES_INCREMENT_REMOVED_IN},"
                f" but you are using API {self._api_version}."
            )

        if increment is not None and self._api_version >= _PRESSES_INCREMENT_REMOVED_IN:
            raise APIVersionError(
                f"increment is only available in API versions lower than {_PRESSES_INCREMENT_REMOVED_IN},"
                f" but you are using API {self._api_version}."
            )

        if prep_after is not None and self._api_version < _PREP_AFTER_ADDED_IN:
            raise APIVersionError(
                f"prep_after is only available in API {_PREP_AFTER_ADDED_IN} and newer,"
                f" but you are using API {self._api_version}."
            )

        well: labware.Well
        tip_rack: labware.Labware
        move_to_location: Optional[types.Location] = None

        if location is None:
            tip_rack, well = labware.next_available_tip(
                starting_tip=self.starting_tip,
                tip_racks=self.tip_racks,
                channels=self.channels,
            )

        elif isinstance(location, labware.Well):
            well = location
            tip_rack = well.parent

        elif isinstance(location, labware.Labware):
            tip_rack, well = labware.next_available_tip(
                starting_tip=None,
                tip_racks=[location],
                channels=self.channels,
            )

        elif isinstance(location, types.Location):
            maybe_tip_rack, maybe_well = location.labware.get_parent_labware_and_well()

            if maybe_well is not None:
                well = maybe_well
                tip_rack = well.parent
                move_to_location = location

            elif maybe_tip_rack is not None:
                tip_rack, well = labware.next_available_tip(
                    starting_tip=None,
                    tip_racks=[maybe_tip_rack],
                    channels=self.channels,
                )
            else:
                raise TypeError(
                    "If specified as a `types.Location`,"
                    " `location` should refer to a ``Labware` or `Well` location."
                    f" However, it refers to {location.labware}"
                )

        else:
            raise TypeError(
                "If specified, location should be an instance of"
                " `types.Location` (e.g. the return value from `Well.top()`),"
                "  `Labware` or `Well` (e.g. `tiprack.wells()[0]`)."
                f" However, it is {location}"
            )

        instrument.validate_tiprack(self.name, tip_rack, _log)

        move_to_location = move_to_location or well.top()
        prep_after = (
            prep_after
            if prep_after is not None
            else self.api_version >= _PREP_AFTER_ADDED_IN
        )

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.pick_up_tip(instrument=self, location=well),
        ):
            self._core.pick_up_tip(
                location=move_to_location,
                well_core=well._core,
                presses=presses,
                increment=increment,
                prep_after=prep_after,
            )

        self._last_tip_picked_up_from = well

        return self

    @requires_version(2, 0)
    def drop_tip(
        self,
        location: Optional[
            Union[
                types.Location,
                labware.Well,
                WasteChute,
            ]
        ] = None,
        home_after: Optional[bool] = None,
    ) -> InstrumentContext:
        """
        Drop the current tip.

        If no location is passed, the Pipette will drop the tip into its
        :py:attr:`trash_container`, which if not specified defaults to
        the fixed trash in slot 12.  From API version 2.15 on, if the trash container is
        the default fixed trash in A3 (slot 12), the API will default to
        dropping tips in different points within the trash container
        in order to prevent tips from piling up in a single location in the trash.

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
            If not specified, defaults to ``True`` on an OT-2.

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
        alternate_drop_location: bool = False
        if location is None:
            # TODO(jbl 10-30-2023) this needs to eventually check and discern between multiple trash bins/waste chute
            #   Same goes for opentrons.protocols.advanced_control.transfers
            if self.trash_container is None:
                raise NoTrashDefinedError(
                    "Cannot drop tip with no location argument when no trash has been loaded"
                )
            well = self.trash_container.wells()[0]
            if self.api_version >= _DROP_TIP_LOCATION_ALTERNATING_ADDED_IN:
                alternate_drop_location = True

        elif isinstance(location, labware.Well):
            well = location
            location = None

        elif isinstance(location, types.Location):
            _, maybe_well = location.labware.get_parent_labware_and_well()

            if maybe_well is None:
                raise TypeError(
                    "If a location is specified as a `types.Location`"
                    " (for instance, as the result of a call to `Well.top()`),"
                    " it must be a location relative to a well,"
                    " since that is where a tip is dropped."
                    f" However, the given location refers to {location.labware}"
                )

            well = maybe_well

        elif isinstance(location, WasteChute):
            # TODO: Publish to run log.
            self._core.drop_tip_in_waste_chute(location, home_after=home_after)
            self._last_tip_picked_up_from = None
            return self

        else:
            raise TypeError(
                "If specified, location should be an instance of"
                " `types.Location` (e.g. the return value from `Well.top()`)"
                " or `Well` (e.g. `tiprack.wells()[0]`)."
                f" However, it is {location}"
            )

        with publisher.publish_context(
            broker=self.broker,
            command=cmds.drop_tip(instrument=self, location=well),
        ):
            self._core.drop_tip(
                location=location,
                well_core=well._core,
                home_after=home_after,
                alternate_drop_location=alternate_drop_location,
            )

        self._last_tip_picked_up_from = None
        return self

    @requires_version(2, 0)
    def home(self) -> InstrumentContext:
        """Home the robot.

        :returns: This instance.
        """

        mount_name = self._core.get_mount().name.lower()

        with publisher.publish_context(
            broker=self.broker, command=cmds.home(mount_name)
        ):
            self._core.home()

        return self

    @requires_version(2, 0)
    def home_plunger(self) -> InstrumentContext:
        """Home the plunger associated with this mount

        :returns: This instance.
        """
        self._core.home_plunger()
        return self

    @publisher.publish(command=cmds.distribute)
    @requires_version(2, 0)
    def distribute(
        self,
        volume: Union[float, Sequence[float]],
        source: labware.Well,
        dest: List[labware.Well],
        *args: Any,
        **kwargs: Any,
    ) -> InstrumentContext:
        """
        Move a volume of liquid from one source to multiple destinations.

        :param volume: The amount, in µL, to dispense into each destination well.
        :param source: A single well to aspirate liquid from.
        :param dest: A list of wells to dispense liquid into.
        :param kwargs: See :py:meth:`transfer` and the :ref:`complex_params` page.
            Some parameters behave differently than when transferring.

              - ``disposal_volume`` aspirates additional liquid to improve the accuracy of each dispense. Defaults to the minimum volume of the pipette. See :ref:`param-disposal-volume` for details.

              - ``mix_after`` is ignored.


        :returns: This instance
        """
        _log.debug("Distributing {} from {} to {}".format(volume, source, dest))
        kwargs["mode"] = "distribute"
        kwargs["disposal_volume"] = kwargs.get("disposal_volume", self.min_volume)
        kwargs["mix_after"] = (0, 0)
        blowout_location = kwargs.get("blowout_location")
        instrument.validate_blowout_location(
            self.api_version, "distribute", blowout_location
        )

        return self.transfer(volume, source, dest, **kwargs)

    @publisher.publish(command=cmds.consolidate)
    @requires_version(2, 0)
    def consolidate(
        self,
        volume: Union[float, Sequence[float]],
        source: List[labware.Well],
        dest: labware.Well,
        *args: Any,
        **kwargs: Any,
    ) -> InstrumentContext:
        """
        Move liquid from multiple source wells to a single destination well.

        :param volume: The amount, in µL, to aspirate from each source well.
        :param source: A list of wells to aspirate liquid from.
        :param dest: A single well to dispense liquid into.
        :param kwargs: See :py:meth:`transfer` and the :ref:`complex_params` page.
                       Some parameters behave differently than when transferring.
                       ``disposal_volume`` and ``mix_before`` are ignored.
        :returns: This instance
        """
        _log.debug("Consolidate {} from {} to {}".format(volume, source, dest))
        kwargs["mode"] = "consolidate"
        kwargs["mix_before"] = (0, 0)
        kwargs["disposal_volume"] = 0
        blowout_location = kwargs.get("blowout_location")
        instrument.validate_blowout_location(
            self.api_version, "consolidate", blowout_location
        )

        return self.transfer(volume, source, dest, **kwargs)

    @publisher.publish(command=cmds.transfer)  # noqa: C901
    @requires_version(2, 0)
    def transfer(
        self,
        volume: Union[float, Sequence[float]],
        source: AdvancedLiquidHandling,
        dest: AdvancedLiquidHandling,
        trash: bool = True,
        **kwargs: Any,
    ) -> InstrumentContext:
        # source: Union[Well, List[Well], List[List[Well]]],
        # dest: Union[Well, List[Well], List[List[Well]]],
        # TODO: Reach consensus on kwargs
        # TODO: Decide if to use a disposal_volume
        # TODO: Accordingly decide if remaining liquid should be blown out to
        # TODO: ..trash or the original well.
        # TODO: What should happen if the user passes a non-first-row well
        # TODO: ..as src/dest *while using multichannel pipette?
        """
        Transfer moves liquid from one well or group of wells to another. It is a
        higher-level command, incorporating other :py:class:`InstrumentContext`
        commands, like :py:meth:`aspirate` and :py:meth:`dispense`. It makes writing a
        protocol easier at the cost of specificity. See :ref:`v2-complex-commands` for
        details on how transfer and other complex commands perform their component steps.

        :param volume: The amount, in µL, to aspirate from each source and
                       dispense to each destination.
                       If ``volume`` is a list, each amount will be used for the source
                       and destination at the matching index. A list item of ``0`` will
                       skip the corresponding wells entirely. See
                       :ref:`complex-list-volumes` for details and examples.
        :param source: A single well or a list of wells to aspirate liquid from.
        :param dest: A single well or a list of wells to dispense liquid into.

        :Keyword Arguments: Transfer accepts a number of optional parameters that give
            you greater control over the exact steps it performs. See :ref:`complex_params`
            or the links under each argument's entry below for additional details and
            examples.

            * **new_tip** (*string*) --
              When to pick up and drop tips during the command. Defaults to ``"once"``.

                - ``"once"``: Use one tip for the entire command.
                - ``"always"``: Use a new tip for each set of aspirate and dispense steps.
                - ``"never"``: Do not pick up or drop tips at all.

              See :ref:`param-tip-handling` for details.

            * **trash** (*boolean*) --
              If ``True`` (default), the pipette will drop tips in its
              :py:meth:`~.InstrumentContext.trash_container`.
              If ``False``, the pipette will return tips to their tip rack.

              See :ref:`param-trash` for details.

            * **touch_tip** (*boolean*) --
              If ``True``, perform a :py:meth:`touch_tip` following each
              :py:meth:`aspirate` and :py:meth:`dispense`. Defaults to ``False``.

              See :ref:`param-touch-tip` for details.

            * **blow_out** (*boolean*) --
              If ``True``, a :py:meth:`blow_out` will occur following each
              :py:meth:`dispense`, but only if the pipette has no liquid left
              in it. If ``False`` (default), the pipette will not blow out liquid.

              See :ref:`param-blow-out` for details.

            * **blowout_location** (*string*) --
              Accepts one of three string values: ``"trash"``, ``"source well"``, or
              ``"destination well"``.

              If ``blow_out`` is ``False`` (its default), this parameter is ignored.

              If ``blow_out`` is ``True`` and this parameter is not set:

                - Blow out into the trash, if the pipette is empty or only contains the disposal volume.

                - Blow out into the source well, if the pipette otherwise contains liquid.

            * **mix_before** (*tuple*) --
              Perform a :py:meth:`mix` before each :py:meth:`aspirate` during the
              transfer. The first value of the tuple is the number of repetitions, and
              the second value is the amount of liquid to mix in µL.

              See :ref:`param-mix-before` for details.

            * **mix_after** (*tuple*) --
              Perform a :py:meth:`mix` after each :py:meth:`dispense` during the
              transfer. The first value of the tuple is the number of repetitions, and
              the second value is the amount of liquid to mix in µL.

              See :ref:`param-mix-after` for details.

            * **disposal_volume** (*float*) --
              Transfer ignores the numeric value of this parameter. If set, the pipette
              will not aspirate additional liquid, but it will perform a very small blow
              out after each dispense.

              See :ref:`param-disposal-volume` for details.

        :returns: This instance
        """
        _log.debug("Transfer {} from {} to {}".format(volume, source, dest))

        blowout_location = kwargs.get("blowout_location")
        instrument.validate_blowout_location(
            self.api_version, "transfer", blowout_location
        )

        kwargs["mode"] = kwargs.get("mode", "transfer")

        mix_strategy, mix_opts = mix_from_kwargs(kwargs)

        if trash:
            drop_tip = transfers.DropTipStrategy.TRASH
        else:
            drop_tip = transfers.DropTipStrategy.RETURN

        new_tip = kwargs.get("new_tip")
        if isinstance(new_tip, str):
            new_tip = types.TransferTipPolicy[new_tip.upper()]

        blow_out = kwargs.get("blow_out")
        blow_out_strategy = None

        if blow_out and not blowout_location:
            if self.current_volume:
                blow_out_strategy = transfers.BlowOutStrategy.SOURCE
            else:
                blow_out_strategy = transfers.BlowOutStrategy.TRASH
        elif blow_out and blowout_location:
            if blowout_location == "source well":
                blow_out_strategy = transfers.BlowOutStrategy.SOURCE
            elif blowout_location == "destination well":
                blow_out_strategy = transfers.BlowOutStrategy.DEST
            elif blowout_location == "trash":
                blow_out_strategy = transfers.BlowOutStrategy.TRASH

        if new_tip != types.TransferTipPolicy.NEVER:
            tr, next_tip = labware.next_available_tip(
                self.starting_tip, self.tip_racks, self.channels
            )
            max_volume = min(next_tip.max_volume, self.max_volume)
        else:
            max_volume = self._core.get_working_volume()

        touch_tip = None
        if kwargs.get("touch_tip"):
            touch_tip = transfers.TouchTipStrategy.ALWAYS

        default_args = transfers.Transfer()

        disposal = kwargs.get("disposal_volume")
        if disposal is None:
            disposal = default_args.disposal_volume

        air_gap = kwargs.get("air_gap", default_args.air_gap)
        if air_gap < 0 or air_gap >= max_volume:
            raise ValueError(
                "air_gap must be between 0uL and the pipette's expected "
                f"working volume, {max_volume}uL"
            )

        transfer_args = transfers.Transfer(
            new_tip=new_tip or default_args.new_tip,
            air_gap=air_gap,
            carryover=kwargs.get("carryover") or default_args.carryover,
            gradient_function=(
                kwargs.get("gradient_function") or default_args.gradient_function
            ),
            disposal_volume=disposal,
            mix_strategy=mix_strategy,
            drop_tip_strategy=drop_tip,
            blow_out_strategy=blow_out_strategy or default_args.blow_out_strategy,
            touch_tip_strategy=(touch_tip or default_args.touch_tip_strategy),
        )
        transfer_options = transfers.TransferOptions(
            transfer=transfer_args, mix=mix_opts
        )
        plan = transfers.TransferPlan(
            volume,
            source,
            dest,
            self,
            max_volume,
            self.api_version,
            kwargs["mode"],
            transfer_options,
        )
        self._execute_transfer(plan)
        return self

    def _execute_transfer(self, plan: transfers.TransferPlan) -> None:
        for cmd in plan:
            getattr(self, cmd["method"])(*cmd["args"], **cmd["kwargs"])

    @requires_version(2, 0)
    def delay(self, *args: Any, **kwargs: Any) -> None:
        """
        .. deprecated:: 2.0
           Use :py:obj:`ProtocolContext.delay` instead.
           This method does nothing.
           It will be removed from a future version of the Python Protocol API.
        """
        if args or kwargs:
            # Former implementations of this method did not take any args, so users
            # would get a TypeError if they tried to call it like delay(minutes=10).
            # Without changing the ultimate behavior that such a call fails the
            # protocol, we can provide a more descriptive message as a courtesy.
            raise APIVersionError(
                "InstrumentContext.delay() is not supported in Python Protocol API v2."
                " Use ProtocolContext.delay() instead."
            )
        else:
            # Former implementations of this method, when called without any args,
            # called ProtocolContext.delay() with a duration of 0, which was
            # approximately a no-op.
            # Preserve that allowed way to call this method for the very remote chance
            # that a protocol out in the wild does it, for some reason.
            pass

    @requires_version(2, 0)
    def move_to(
        self,
        location: types.Location,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
        publish: bool = True,
    ) -> InstrumentContext:
        """Move the instrument.

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
                      :py:obj:`.ProtocolContext.max_speeds`.
        :param publish: Whether a call to this function should publish to the
                        run log or not.
        """
        publish_ctx = nullcontext()

        if publish:
            publish_ctx = publisher.publish_context(
                broker=self.broker,
                command=cmds.move_to(instrument=self, location=location),
            )
        with publish_ctx:
            _, well = location.labware.get_parent_labware_and_well()

            self._core.move_to(
                location=location,
                well_core=well._core if well is not None else None,
                force_direct=force_direct,
                minimum_z_height=minimum_z_height,
                speed=speed,
            )

        return self

    @property  # type: ignore
    @requires_version(2, 0)
    def mount(self) -> str:
        """Return the name of the mount this pipette is attached to"""
        return self._core.get_mount().name.lower()

    @property  # type: ignore
    @requires_version(2, 0)
    def speed(self) -> "PlungerSpeeds":
        """The speeds (in mm/s) configured for the pipette plunger.

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

        .. versionchanged:: 2.14
            This property has been removed because it's fundamentally misaligned
            with the step-wise nature of a pipette's plunger speed configuration.
            Use :py:attr:`.flow_rate` instead.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            raise APIVersionError(
                "InstrumentContext.speed has been removed."
                " Use InstrumentContext.flow_rate, instead."
            )

        # TODO(mc, 2023-02-13): this assert should be enough for mypy
        # investigate if upgrading mypy allows the `cast` to be removed
        assert isinstance(self._core, LegacyInstrumentCore)
        return cast(LegacyInstrumentCore, self._core).get_speed()

    @property  # type: ignore
    @requires_version(2, 0)
    def flow_rate(self) -> "FlowRates":
        """The speeds (in uL/s) configured for the pipette.

        This is an object with attributes ``aspirate``, ``dispense``, and
        ``blow_out`` holding the flow rates for the corresponding operation.

        .. note::
          This property is equivalent to :py:attr:`speed`; the only
          difference is the units in which this property is specified.
          specifying this property uses the units of the volumetric flow rate
          of liquid into or out of the tip, while :py:attr:`speed` uses the
          units of the linear speed of the plunger inside the pipette.
          Because :py:attr:`speed` and :py:attr:`flow_rate` modify the
          same values, setting one will override the other.

        For instance, to change the flow rate for aspiration on an instrument
        you would do

        .. code-block :: python

            instrument.flow_rate.aspirate = 50

        """
        return self._core.get_flow_rate()

    @property  # type: ignore
    @requires_version(2, 0)
    def type(self) -> str:
        """One of `'single'` or `'multi'`."""
        model = self.name
        if "single" in model:
            return "single"
        elif "multi" in model:
            return "multi"
        else:
            raise RuntimeError("Bad pipette name: {}".format(model))

    @property  # type: ignore
    @requires_version(2, 0)
    def tip_racks(self) -> List[labware.Labware]:
        """
        The tip racks that have been linked to this pipette.

        This is the property used to determine which tips to pick up next when
        calling :py:meth:`pick_up_tip` without arguments.
        """
        return self._tip_racks

    @tip_racks.setter
    def tip_racks(self, racks: List[labware.Labware]) -> None:
        self._tip_racks = racks

    @property  # type: ignore
    @requires_version(2, 0)
    def trash_container(self) -> Optional[labware.Labware]:
        """The trash container associated with this pipette.

        This is the property used to determine where to drop tips and blow out
        liquids when calling :py:meth:`drop_tip` or :py:meth:`blow_out` without
        arguments.
        """
        return self._trash

    @trash_container.setter
    def trash_container(self, trash: Optional[labware.Labware]) -> None:
        self._trash = trash

    @property  # type: ignore
    @requires_version(2, 0)
    def name(self) -> str:
        """
        The name string for the pipette (e.g. 'p300_single')
        """
        return self._core.get_pipette_name()

    @property  # type: ignore
    @requires_version(2, 0)
    def model(self) -> str:
        """
        The model string for the pipette (e.g. 'p300_single_v1.3')
        """
        return self._core.get_model()

    @property  # type: ignore
    @requires_version(2, 0)
    def min_volume(self) -> float:
        return self._core.get_min_volume()

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
        return self._core.get_max_volume()

    @property  # type: ignore
    @requires_version(2, 0)
    def current_volume(self) -> float:
        """
        The current amount of liquid, in microliters, held in the pipette.
        """
        return self._core.get_current_volume()

    @property  # type: ignore
    @requires_version(2, 7)
    def has_tip(self) -> bool:
        """Return whether this instrument has a tip attached or not."""
        return self._core.has_tip()

    @property
    def _has_tip(self) -> bool:
        """
        Internal function used to check whether this instrument has a
        tip attached or not.
        """
        return self._core.has_tip()

    @property  # type: ignore
    @requires_version(2, 0)
    def hw_pipette(self) -> PipetteDict:
        """View the information returned by the hardware API directly.

        :raises: a :py:class:`.types.PipetteNotAttachedError` if the pipette is
                 no longer attached (should not happen).
        """
        return self._core.get_hardware_state()

    @property  # type: ignore
    @requires_version(2, 0)
    def channels(self) -> int:
        """The number of channels on the pipette."""
        return self._core.get_channels()

    @property  # type: ignore
    @requires_version(2, 2)
    def return_height(self) -> float:
        """The height to return a tip to its tiprack.

        :returns: A scaling factor to apply to the tip length.
                  During a drop tip, this factor will be multiplied by the tip length
                  to get the distance from the top of the well where the tip is dropped.
        """
        return self._core.get_return_height()

    @property  # type: ignore
    @requires_version(2, 0)
    def well_bottom_clearance(self) -> "Clearances":
        """The distance above the bottom of a well to aspirate or dispense.

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
        return self._well_bottom_clearances

    def _get_last_location_by_api_version(self) -> Optional[types.Location]:
        """Get the last location accessed by this pipette, if any.

        In pre-engine Protocol API versions, this call omits the pipette mount.
        This is to preserve pre-existing, potentially buggy behavior.
        """
        if self._api_version >= ENGINE_CORE_API_VERSION:
            return self._protocol_core.get_last_location(mount=self._core.get_mount())
        else:
            return self._protocol_core.get_last_location()

    def __repr__(self) -> str:
        return "<{}: {} in {}>".format(
            self.__class__.__name__,
            self._core.get_model(),
            self._core.get_mount().name,
        )

    def __str__(self) -> str:
        return "{} on {} mount".format(self._core.get_display_name(), self.mount)

    @requires_version(2, 15)
    def configure_for_volume(self, volume: float) -> None:
        """Configure a pipette to handle a specific volume of liquid, specified in µL. Depending on the
        volume, the pipette will enter a certain pipetting mode. Changing pipette modes alters properties
        of the instance of :py:class:`.InstrumentContext`, such as default flow rate, minimum volume, and
        maximum volume. The pipette will remain in the mode set by this function until it is called again.

        The Flex 1-Channel 50 µL and Flex 8-Channel 50 µL pipettes must operate in a low-volume mode
        to accurately dispense 1 µL of liquid. Low-volume mode can only be set by calling this function.

        For more information on available modes for certain pipettes, see :ref:`pipette-volume-modes`.

        .. note ::

            Changing a pipette's mode will reset its :ref:`flow rates <new-plunger-flow-rates>`.

        This function will raise an error if called when the pipette's tip contains liquid. It won't
        raise an error if no tip is attached, but changing modes may affect which tips the pipette can
        subsequently pick up without raising an error.

        This function will also raise an error if ``volume`` is outside the :ref:`overall minimum and
        maximum capacities <new-pipette-models>` of the pipette (e.g., setting ``volume=1`` for a Flex
        1000 µL pipette).

        :param volume: The volume, in µL, that the pipette will prepare to handle.
        :type volume: float
        """
        if self._core.get_current_volume():
            raise CommandPreconditionViolated(
                message=f"Cannot switch modes of {str(self)} while it contains liquid"
            )
        if volume < 0:
            raise CommandParameterLimitViolated(
                command_name="configure_for_volume",
                parameter_name="volume",
                limit_statement="must be greater than 0",
                actual_value=str(volume),
            )
        last_location = self._get_last_location_by_api_version()
        if last_location and isinstance(last_location.labware, labware.Well):
            self.move_to(last_location.labware.top())
        self._core.configure_for_volume(volume)

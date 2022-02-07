"""Shared code for managing pipette configuration and storage."""
from dataclasses import dataclass
import logging
from typing import (
    Callable,
    Dict,
    Optional,
    Tuple,
    Any,
    cast,
    List,
    Sequence,
    Iterator,
)

from opentrons_shared_data.pipette.dev_types import UlPerMmAction

from opentrons import types as top_types
from .types import (
    CriticalPoint,
    HardwareAction,
    TipAttachedError,
    NoTipAttachedError,
    Axis,
)
from .constants import (
    SHAKE_OFF_TIPS_SPEED,
    SHAKE_OFF_TIPS_PICKUP_DISTANCE,
    DROP_TIP_RELEASE_DISTANCE,
    SHAKE_OFF_TIPS_DROP_DISTANCE,
)

from .robot_calibration import load_pipette_offset
from .dev_types import PipetteDict
from .pipette import Pipette

InstrumentsByMount = Dict[top_types.Mount, Optional[Pipette]]
PipetteHandlingData = Tuple[Pipette, top_types.Mount]

MOD_LOG = logging.getLogger(__name__)


class InstrumentHandlerProvider:
    IHP_LOG = MOD_LOG.getChild("InstrumentHandler")

    def __init__(self):
        self._attached_instruments: InstrumentsByMount = {
            top_types.Mount.LEFT: None,
            top_types.Mount.RIGHT: None,
        }
        self._ihp_log = InstrumentHandlerProvider.IHP_LOG.getChild(str(id(self)))

    def reset_instrument(self, mount: Optional[top_types.Mount] = None):
        """
        Reset the internal state of a pipette by its mount, without doing
        any lower level reconfiguration. This is useful to make sure that no
        settings changes from a protocol persist.

        :param mount: If specified, reset that mount. If not specified,
                      reset both
        """

        def _reset(m: top_types.Mount):
            self._ihp_log.info(f"Resetting configuration for {m}")
            p = self._attached_instruments[m]
            if not p:
                return
            new_p = Pipette(
                p._config, load_pipette_offset(p.pipette_id, m), p.pipette_id
            )
            new_p.act_as(p.acting_as)
            self._attached_instruments[m] = new_p

        if not mount:
            for m in top_types.Mount:
                _reset(m)
        else:
            _reset(mount)

    # TODO(mc, 2022-01-11): change returned map value type to `Optional[PipetteDict]`
    # instead of potentially returning an empty dict
    def get_attached_instruments(self) -> Dict[top_types.Mount, PipetteDict]:
        """Get the status dicts of the cached attached instruments.

        Also available as :py:meth:`get_attached_instruments`.

        This returns a dictified version of the
        :py:class:`hardware_control.pipette.Pipette` as a dict keyed by
        the :py:class:`top_types.Mount` to which the pipette is attached.
        If no pipette is attached on a given mount, the mount key will
        still be present but will have the value ``None``.

        Note that this is only a query of a cached value; to actively scan
        for changes, use :py:meth:`cache_instruments`. This process deactivates
        the motors and should be used sparingly.
        """
        return {
            m: self.get_attached_instrument(m)
            for m in (top_types.Mount.LEFT, top_types.Mount.RIGHT)
        }

    # TODO(mc, 2022-01-11): change return type to `Optional[PipetteDict]` instead
    # of potentially returning an empty dict
    def get_attached_instrument(self, mount: top_types.Mount) -> PipetteDict:
        instr = self._attached_instruments[mount]
        result: Dict[str, Any] = {}
        if instr:
            configs = [
                "name",
                "min_volume",
                "max_volume",
                "channels",
                "aspirate_flow_rate",
                "dispense_flow_rate",
                "pipette_id",
                "current_volume",
                "display_name",
                "tip_length",
                "model",
                "blow_out_flow_rate",
                "working_volume",
                "tip_overlap",
                "available_volume",
                "return_tip_height",
                "default_aspirate_flow_rates",
                "default_blow_out_flow_rates",
                "default_dispense_flow_rates",
                "back_compat_names",
            ]

            instr_dict = instr.as_dict()
            # TODO (spp, 2021-08-27): Revisit this logic. Why do we need to build
            #  this dict newly every time? Any why only a few items are being updated?
            for key in configs:
                result[key] = instr_dict[key]
            result["has_tip"] = instr.has_tip
            result["tip_length"] = instr.current_tip_length
            result["aspirate_speed"] = self.plunger_speed(
                instr, instr.aspirate_flow_rate, "aspirate"
            )
            result["dispense_speed"] = self.plunger_speed(
                instr, instr.dispense_flow_rate, "dispense"
            )
            result["blow_out_speed"] = self.plunger_speed(
                instr, instr.blow_out_flow_rate, "dispense"
            )
            result["ready_to_aspirate"] = instr.ready_to_aspirate
            result["default_blow_out_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "dispense")
                for alvl, fr in instr.config.default_aspirate_flow_rates.items()
            }
            result["default_dispense_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "dispense")
                for alvl, fr in instr.config.default_dispense_flow_rates.items()
            }
            result["default_aspirate_speeds"] = {
                alvl: self.plunger_speed(instr, fr, "aspirate")
                for alvl, fr in instr.config.default_aspirate_flow_rates.items()
            }
        return cast(PipetteDict, result)

    @property
    def attached_instruments(self) -> Dict[top_types.Mount, PipetteDict]:
        return self.get_attached_instruments()

    @property
    def hardware_instruments(self) -> InstrumentsByMount:
        """Do not write new code that uses this."""
        return self._attached_instruments

    def set_current_tiprack_diameter(
        self, mount: top_types.Mount, tiprack_diameter: float
    ):
        instr = self.get_pipette(mount)
        self._ihp_log.info(
            "Updating tip rack diameter on pipette mount: "
            f"{mount}, tip diameter: {tiprack_diameter} mm"
        )
        instr.current_tiprack_diameter = tiprack_diameter

    def set_working_volume(self, mount: top_types.Mount, tip_volume: int):
        instr = self.get_pipette(mount)
        if not instr:
            raise top_types.PipetteNotAttachedError(
                "No pipette attached to {} mount".format(mount.name)
            )
        self._ihp_log.info(
            "Updating working volume on pipette mount:"
            f"{mount}, tip volume: {tip_volume} ul"
        )
        instr.working_volume = tip_volume

    def calibrate_plunger(
        self,
        mount: top_types.Mount,
        top: Optional[float] = None,
        bottom: Optional[float] = None,
        blow_out: Optional[float] = None,
        drop_tip: Optional[float] = None,
    ):
        """
        Set calibration values for the pipette plunger.
        This can be called multiple times as the user sets each value,
        or you can set them all at once.
        :param top: Touching but not engaging the plunger.
        :param bottom: Must be above the pipette's physical hard-stop, while
        still leaving enough room for 'blow_out'
        :param blow_out: Plunger is pushed down enough to expel all liquids.
        :param drop_tip: Position that causes the tip to be released from the
        pipette
        """
        instr = self.get_pipette(mount)
        pos_dict: Dict = {
            "top": instr.config.top,
            "bottom": instr.config.bottom,
            "blow_out": instr.config.blow_out,
            "drop_tip": instr.config.drop_tip,
        }
        if top is not None:
            pos_dict["top"] = top
        if bottom is not None:
            pos_dict["bottom"] = bottom
        if blow_out is not None:
            pos_dict["blow_out"] = blow_out
        if bottom is not None:
            pos_dict["drop_tip"] = drop_tip
        for key in pos_dict.keys():
            instr.update_config_item(key, pos_dict[key])

    def set_flow_rate(
        self,
        mount: top_types.Mount,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        this_pipette = self.get_pipette(mount)
        if aspirate:
            this_pipette.aspirate_flow_rate = aspirate
        if dispense:
            this_pipette.dispense_flow_rate = dispense
        if blow_out:
            this_pipette.blow_out_flow_rate = blow_out

    def set_pipette_speed(
        self,
        mount: top_types.Mount,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        this_pipette = self.get_pipette(mount)
        if aspirate:
            this_pipette.aspirate_flow_rate = self.plunger_flowrate(
                this_pipette, aspirate, "aspirate"
            )
        if dispense:
            this_pipette.dispense_flow_rate = self.plunger_flowrate(
                this_pipette, dispense, "dispense"
            )
        if blow_out:
            this_pipette.blow_out_flow_rate = self.plunger_flowrate(
                this_pipette, blow_out, "dispense"
            )

    def instrument_max_height(
        self,
        mount: top_types.Mount,
        retract_distance: float,
        critical_point: Optional[CriticalPoint],
    ) -> float:
        """Return max achievable height of the attached instrument
        based on the current critical point
        """
        pip = self.get_pipette(mount)
        cp = self.critical_point_for(mount, critical_point)

        max_height = pip.config.home_position - retract_distance + cp.z

        return max_height

    async def reset(self) -> None:
        self._attached_instruments = {
            k: None for k in self._attached_instruments.keys()
        }

    async def add_tip(self, mount: top_types.Mount, tip_length: float):
        instr = self._attached_instruments[mount]
        attached = self.attached_instruments
        instr_dict = attached[mount]
        if instr and not instr.has_tip:
            instr.add_tip(tip_length=tip_length)
            # TODO (spp, 2021-08-27): These items are being updated in a local copy
            #  of the PipetteDict, which gets thrown away. Fix this.
            instr_dict["has_tip"] = True
            instr_dict["tip_length"] = tip_length
        else:
            self._ihp_log.warning("attach tip called while tip already attached")

    async def remove_tip(self, mount: top_types.Mount):
        instr = self._attached_instruments[mount]
        attached = self.attached_instruments
        instr_dict = attached[mount]
        if instr and instr.has_tip:
            instr.remove_tip()
            # TODO (spp, 2021-08-27): These items are being updated in a local copy
            #  of the PipetteDict, which gets thrown away. Fix this.
            instr_dict["has_tip"] = False
            instr_dict["tip_length"] = 0.0
        else:
            self._ihp_log.warning("detach tip called with no tip")

    def critical_point_for(
        self, mount: top_types.Mount, cp_override: CriticalPoint = None
    ) -> top_types.Point:
        """Return the current critical point of the specified mount.

        The mount's critical point is the position of the mount itself, if no
        pipette is attached, or the pipette's critical point (which depends on
        tip status).

        If `cp_override` is specified, and that critical point actually exists,
        it will be used instead. Invalid `cp_override`s are ignored.
        """
        pip = self._attached_instruments[mount]
        if pip is not None and cp_override != CriticalPoint.MOUNT:
            return pip.critical_point(cp_override)
        else:
            # This offset is required because the motor driver coordinate system is
            # configured such that the end of a p300 single gen1's tip is 0.
            return top_types.Point(0, 0, 30)

    def ready_for_tip_action(self, target: Pipette, action: HardwareAction):
        if not target.has_tip:
            raise NoTipAttachedError(f"Cannot perform {action} without a tip attached")
        if (
            action == HardwareAction.ASPIRATE
            and target.current_volume == 0
            and not target.ready_to_aspirate
        ):
            raise RuntimeError("Pipette not ready to aspirate")
        self._ihp_log.debug(f"{action} on {target.name}")

    def plunger_position(
        self, instr: Pipette, ul: float, action: "UlPerMmAction"
    ) -> float:
        mm = ul / instr.ul_per_mm(ul, action)
        position = mm + instr.config.bottom
        return round(position, 6)

    def plunger_speed(
        self, instr: Pipette, ul_per_s: float, action: "UlPerMmAction"
    ) -> float:
        mm_per_s = ul_per_s / instr.ul_per_mm(instr.config.max_volume, action)
        return round(mm_per_s, 6)

    def plunger_flowrate(
        self, instr: Pipette, mm_per_s: float, action: "UlPerMmAction"
    ) -> float:
        ul_per_s = mm_per_s * instr.ul_per_mm(instr.config.max_volume, action)
        return round(ul_per_s, 6)

    @dataclass(frozen=True)
    class LiquidActionSpec:
        axis: Axis
        volume: float
        plunger_distance: float
        speed: float
        instr: Pipette
        current: float

    def plan_check_aspirate(
        self,
        mount: top_types.Mount,
        volume: Optional[float],
        rate: float,
    ) -> Optional["InstrumentHandlerProvider.LiquidActionSpec"]:
        """Check preconditions for aspirate, parse args, and calculate positions.

        While the mechanics of issuing an aspirate move itself are left to child
        classes, determining things like aspiration volume from the allowed argument
        types is invariant between machines, and this method gathers that functionality.

        Coalesce
        - Optional volumes

        Check
        - Aspiration volumes compared to max and remaining

        Calculate
        - Plunger distances (possibly calling an overridden plunger_volume)
        """
        instrument = self.get_pipette(mount)
        self.ready_for_tip_action(instrument, HardwareAction.ASPIRATE)
        if volume is None:
            self._ihp_log.debug(
                "No aspirate volume defined. Aspirating up to "
                "max_volume for the pipette"
            )
            asp_vol = instrument.available_volume
        else:
            asp_vol = volume

        if asp_vol == 0:
            return None

        assert instrument.ok_to_add_volume(
            asp_vol
        ), "Cannot aspirate more than pipette max volume"

        dist = self.plunger_position(
            instrument, instrument.current_volume + asp_vol, "aspirate"
        )
        speed = self.plunger_speed(
            instrument, instrument.aspirate_flow_rate * rate, "aspirate"
        )
        return self.LiquidActionSpec(
            axis=Axis.of_plunger(mount),
            volume=asp_vol,
            plunger_distance=dist,
            speed=speed,
            instr=instrument,
            current=instrument.config.plunger_current,
        )

    def plan_check_dispense(
        self,
        mount: top_types.Mount,
        volume: Optional[float],
        rate: float,
    ) -> Optional["InstrumentHandlerProvider.LiquidActionSpec"]:
        """Check preconditions for dispense, parse args, and calculate positions.

        While the mechanics of issuing a dispense move itself are left to child
        classes, determining things like dispense volume from the allowed argument
        types is invariant between machines, and this method gathers that functionality.

        Coalesce
        - Optional volumes

        Check
        - Dispense volumes compared to max and remaining

        Calculate
        - Plunger distances (possibly calling an overridden plunger_volume)
        """

        instrument = self.get_pipette(mount)
        self.ready_for_tip_action(instrument, HardwareAction.DISPENSE)

        if volume is None:
            disp_vol = instrument.current_volume
            self._ihp_log.debug(
                "No dispense volume specified. Dispensing all "
                "remaining liquid ({}uL) from pipette".format(disp_vol)
            )
        else:
            disp_vol = volume

        # Ensure we don't dispense more than the current volume
        disp_vol = min(instrument.current_volume, disp_vol)

        if disp_vol == 0:
            return None

        dist = self.plunger_position(
            instrument, instrument.current_volume - disp_vol, "dispense"
        )
        speed = self.plunger_speed(
            instrument, instrument.dispense_flow_rate * rate, "dispense"
        )
        return self.LiquidActionSpec(
            axis=Axis.of_plunger(mount),
            volume=disp_vol,
            plunger_distance=dist,
            speed=speed,
            instr=instrument,
            current=instrument.config.plunger_current,
        )

    def plan_check_blow_out(
        self, mount: top_types.Mount
    ) -> "InstrumentHandlerProvider.LiquidActionSpec":
        """Check preconditions and calculate values for blowout."""
        instrument = self.get_pipette(mount)
        self.ready_for_tip_action(instrument, HardwareAction.BLOWOUT)
        speed = self.plunger_speed(
            instrument, instrument.blow_out_flow_rate, "dispense"
        )
        return self.LiquidActionSpec(
            axis=Axis.of_plunger(mount),
            volume=0,
            plunger_distance=instrument.config.blow_out,
            speed=speed,
            instr=instrument,
            current=instrument.config.plunger_current,
        )

    @dataclass(frozen=True)
    class PickUpTipPressSpec:
        relative_down: top_types.Point
        relative_up: top_types.Point
        current: Dict[Axis, float]
        speed: float

    @dataclass(frozen=True)
    class PickUpTipSpec:
        plunger_prep_pos: float
        plunger_currents: Dict[Axis, float]
        presses: List["InstrumentHandlerProvider.PickUpTipPressSpec"]
        shake_off_list: List[Tuple[top_types.Point, Optional[float]]]
        retract_target: float

    @staticmethod
    def _build_pickup_shakes(
        instrument: Pipette,
    ) -> List[Tuple[top_types.Point, Optional[float]]]:
        def build_one_shake() -> List[Tuple[top_types.Point, Optional[float]]]:
            shake_dist = float(SHAKE_OFF_TIPS_PICKUP_DISTANCE)
            shake_speed = float(SHAKE_OFF_TIPS_SPEED)
            return [
                (top_types.Point(-shake_dist, 0, 0), shake_speed),  # left
                (top_types.Point(2 * shake_dist, 0, 0), shake_speed),  # right
                (top_types.Point(-shake_dist, 0, 0), shake_speed),  # center
                (top_types.Point(0, -shake_dist, 0), shake_speed),  # front
                (top_types.Point(0, 2 * shake_dist, 0), shake_speed),  # back
                (top_types.Point(0, -shake_dist, 0), shake_speed),  # center
                (top_types.Point(0, 0, DROP_TIP_RELEASE_DISTANCE), None),  # up
            ]

        if "pickupTipShake" in instrument.config.quirks:
            return build_one_shake() + build_one_shake()
        else:
            return []

    def plan_check_pick_up_tip(
        self,
        mount: top_types.Mount,
        tip_length: float,
        presses: Optional[int],
        increment: Optional[float],
    ) -> Tuple["InstrumentHandlerProvider.PickUpTipSpec", Callable[[], None]]:

        # Prechecks: ready for pickup tip and press/increment are valid
        instrument = self.get_pipette(mount)
        if instrument.has_tip:
            raise TipAttachedError("Cannot pick up tip with a tip attached")
        self._ihp_log.debug(f"Picking up tip on {mount.name}")

        if not presses or presses < 0:
            checked_presses = instrument.config.pick_up_presses
        else:
            checked_presses = presses

        if not increment or increment < 0:
            check_incr = instrument.config.pick_up_increment
        else:
            check_incr = increment

        z_axis_currents = {Axis.by_mount(mount): instrument.config.pick_up_current}
        pick_up_speed = instrument.config.pick_up_speed

        def build_presses() -> Iterator[Tuple[float, float]]:
            # Press the nozzle into the tip <presses> number of times,
            # moving further by <increment> mm after each press
            for i in range(checked_presses):
                # move nozzle down into the tip
                press_dist = (
                    -1.0 * instrument.config.pick_up_distance + -1.0 * check_incr * i
                )
                # move nozzle back up
                backup_dist = -press_dist
                yield (press_dist, backup_dist)

        def add_tip_to_instr() -> None:
            instrument.add_tip(tip_length=tip_length)
            instrument.set_current_volume(0)

        return (
            InstrumentHandlerProvider.PickUpTipSpec(
                plunger_prep_pos=instrument.config.bottom,
                plunger_currents={
                    Axis.of_plunger(mount): instrument.config.plunger_current
                },
                presses=[
                    InstrumentHandlerProvider.PickUpTipPressSpec(
                        current=z_axis_currents,
                        speed=pick_up_speed,
                        relative_down=top_types.Point(0, 0, press_dist),
                        relative_up=top_types.Point(0, 0, backup_dist),
                    )
                    for press_dist, backup_dist in build_presses()
                ],
                shake_off_list=self._build_pickup_shakes(instrument),
                retract_target=instrument.config.pick_up_distance
                + check_incr
                + checked_presses
                + 2,
            ),
            add_tip_to_instr,
        )

    @dataclass(frozen=True)
    class DropTipMove:
        target_position: float
        current: Dict[Axis, float]
        speed: Optional[float]
        home_after: bool = False
        home_after_safety_margin: float = 0
        home_axes: Sequence[Axis] = tuple()

    @dataclass(frozen=True)
    class DropTipSpec:
        drop_moves: List["InstrumentHandlerProvider.DropTipMove"]
        shake_moves: List[Tuple[top_types.Point, Optional[float]]]
        ending_current: Dict[Axis, float]

    @staticmethod
    def _shake_off_tips_drop(
        tiprack_diameter: float,
    ) -> List[Tuple[top_types.Point, Optional[float]]]:
        # tips don't always fall off, especially if resting against
        # tiprack or other tips below it. To ensure the tip has fallen
        # first, shake the pipette to dislodge partially-sealed tips,
        # then second, raise the pipette so loosened tips have room to fall
        shake_off_dist = SHAKE_OFF_TIPS_DROP_DISTANCE
        if tiprack_diameter > 0.0:
            shake_off_dist = min(shake_off_dist, tiprack_diameter / 4)
        shake_off_dist = max(shake_off_dist, 1.0)
        speed = SHAKE_OFF_TIPS_SPEED
        return [
            (top_types.Point(-shake_off_dist, 0, 0), speed),  # left
            (top_types.Point(2 * shake_off_dist, 0, 0), speed),  # right
            (top_types.Point(-shake_off_dist, 0, 0), speed),  # center
            (top_types.Point(0, 0, DROP_TIP_RELEASE_DISTANCE), None),  # top
        ]

    def plan_check_drop_tip(
        self,
        mount: top_types.Mount,
        home_after: bool,
    ) -> Tuple["InstrumentHandlerProvider.DropTipSpec", Callable[[], None]]:
        instrument = self.get_pipette(mount)
        self.ready_for_tip_action(instrument, HardwareAction.DROPTIP)
        plunger_currents = {Axis.of_plunger(mount): instrument.config.plunger_current}
        drop_tip_currents = {Axis.of_plunger(mount): instrument.config.drop_tip_current}
        plunger_axes = (Axis.of_plunger(mount),)

        bottom = instrument.config.bottom
        droptip = instrument.config.drop_tip
        speed = instrument.config.drop_tip_speed

        def _build_single_sequence() -> List[InstrumentHandlerProvider.DropTipMove]:
            base = [
                self.DropTipMove(
                    target_position=bottom, current=plunger_currents, speed=None
                ),
                self.DropTipMove(
                    target_position=droptip,
                    current=drop_tip_currents,
                    speed=speed,
                    home_after=home_after,
                    home_after_safety_margin=abs(bottom - droptip),
                    home_axes=plunger_axes,
                ),
            ]
            if home_after:
                base.append(
                    self.DropTipMove(
                        target_position=bottom, current=plunger_currents, speed=None
                    )
                )
            return base

        seq = _build_single_sequence()
        if "doubleDropTip" in instrument.config.quirks:
            seq += seq

        shakes: List[Tuple[top_types.Point, Optional[float]]] = []
        if "dropTipShake" in instrument.config.quirks:
            diameter = instrument.current_tiprack_diameter
            shakes = self._shake_off_tips_drop(diameter)

        def _remove_tips() -> None:
            instrument.set_current_volume(0)
            instrument.current_tiprack_diameter = 0.0
            instrument.remove_tip()

        return (
            self.DropTipSpec(
                drop_moves=seq, shake_moves=shakes, ending_current=plunger_currents
            ),
            _remove_tips,
        )

    def get_pipette(self, mount: top_types.Mount) -> Pipette:
        pip = self._attached_instruments[mount]
        if not pip:
            raise top_types.PipetteNotAttachedError(
                f"No pipette attached to {mount.name} mount"
            )
        return pip

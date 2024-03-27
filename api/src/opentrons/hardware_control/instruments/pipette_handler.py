"""Shared code for managing pipette configuration and storage."""
from dataclasses import dataclass
import logging
from typing import (
    Callable,
    Dict,
    Generic,
    Optional,
    Tuple,
    Any,
    cast,
    List,
    Sequence,
    Iterator,
    TypeVar,
    overload,
)
import numpy

from opentrons_shared_data.errors.exceptions import (
    UnexpectedTipRemovalError,
    UnexpectedTipAttachError,
)
from opentrons_shared_data.pipette.dev_types import UlPerMmAction
from opentrons_shared_data.pipette.types import Quirks
from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated

from opentrons import types as top_types
from opentrons.hardware_control.types import (
    CriticalPoint,
    HardwareAction,
    Axis,
    OT3Mount,
)
from opentrons.hardware_control.constants import (
    SHAKE_OFF_TIPS_SPEED,
    SHAKE_OFF_TIPS_PICKUP_DISTANCE,
    DROP_TIP_RELEASE_DISTANCE,
    SHAKE_OFF_TIPS_DROP_DISTANCE,
)

from opentrons.hardware_control.dev_types import PipetteDict
from .pipette import Pipette

class PipetteHandlerProvider:
    def __init__(self, pipettes) -> None:
        self._pipettes = pipettes

    def get_pipette(self, mount) -> Pipette:
        return self._pipettes[mount]

    def set_working_volume(self, mount: MountType, tip_volume: float) -> None:
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
        mount: MountType,
        top: Optional[float] = None,
        bottom: Optional[float] = None,
        blow_out: Optional[float] = None,
        drop_tip: Optional[float] = None,
    ) -> None:
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
        pos_dict: Dict[str, float] = {
            "top": instr.plunger_positions.top,
            "bottom": instr.plunger_positions.bottom,
            "blow_out": instr.plunger_positions.blow_out,
            "drop_tip": instr.plunger_positions.drop_tip,
        }
        if top is not None:
            pos_dict["top"] = top
        if bottom is not None:
            pos_dict["bottom"] = bottom
        if blow_out is not None:
            pos_dict["blow_out"] = blow_out
        if drop_tip is not None:
            pos_dict["drop_tip"] = drop_tip
        instr.update_config_item(pos_dict)

    def set_flow_rate(
        self,
        mount: MountType,
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
        mount: MountType,
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

    async def add_tip(self, mount: MountType, tip_length: float) -> None:
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
            self._ihp_log.warning(
                f"attach tip called while tip already attached to {instr}"
            )

    async def remove_tip(self, mount: MountType) -> None:
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

    def ready_for_tip_action(
        self, target: Pipette, action: HardwareAction, mount: MountType
    ) -> None:
        if not target.has_tip:
            raise UnexpectedTipRemovalError(action.name, target.name, mount.name)
        if (
            action == HardwareAction.ASPIRATE
            and target.current_volume == 0
            and not target.ready_to_aspirate
        ):
            raise RuntimeError("Pipette not ready to aspirate")
        self._ihp_log.debug(f"{action} on {target.name}")

    @overload
    def plunger_position(
        self, mount: top_types.Mount, ul: float, action: "UlPerMmAction"
    ) -> float:
        ...

    @overload
    def plunger_position(
        self, mount: OT3Mount, ul: float, action: "UlPerMmAction"
    ) -> float:
        ...

    def plunger_position(
        self, mount, ul, action
    ) -> float:
        instr = self.get_pipette(mount)
        mm = ul / instr.ul_per_mm(ul, action)

        if isinstance(mount, top_types.Mount):
            position = mm + instr.plunger_positions.bottom
        else:
            position = instr.plunger_positions.bottom - mm
        return round(position, 6)

    def plunger_speed(
        self, instr: Pipette, ul_per_s: float, action: "UlPerMmAction"
    ) -> float:
        mm_per_s = ul_per_s / instr.ul_per_mm(instr.liquid_class.max_volume, action)
        return round(mm_per_s, 6)

    def plunger_flowrate(
        self, instr: Pipette, mm_per_s: float, action: "UlPerMmAction"
    ) -> float:
        ul_per_s = mm_per_s * instr.ul_per_mm(instr.liquid_class.max_volume, action)
        return round(ul_per_s, 6)

    @overload
    def plan_check_aspirate(
        self, mount: top_types.Mount, volume: Optional[float], rate: float
    ) -> Optional[LiquidActionSpec]:
        ...

    @overload
    def plan_check_aspirate(
        self, mount: OT3Mount, volume: Optional[float], rate: float
    ) -> Optional[LiquidActionSpec]:
        ...

    # note on this type ignore: see motion_utilities
    def plan_check_aspirate(  # type: ignore[no-untyped-def]
        self,
        mount,
        volume,
        rate,
    ):
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
        self.ready_for_tip_action(instrument, HardwareAction.ASPIRATE, mount)
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
        if isinstance(mount, OT3Mount):
            return LiquidActionSpec(
                axis=Axis.of_main_tool_actuator(mount),
                volume=asp_vol,
                plunger_distance=dist,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )
        else:
            return LiquidActionSpec(
                axis=Axis.of_plunger(mount),
                volume=asp_vol,
                plunger_distance=dist,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )

    @overload
    def plan_check_dispense(
        self,
        mount: top_types.Mount,
        volume: Optional[float],
        rate: float,
        push_out: Optional[float],
    ) -> Optional[LiquidActionSpec]:
        ...

    @overload
    def plan_check_dispense(
        self,
        mount: OT3Mount,
        volume: Optional[float],
        rate: float,
        push_out: Optional[float],
    ) -> Optional[LiquidActionSpec]:
        ...

    def plan_check_dispense(  # type: ignore[no-untyped-def]
        self, mount, volume, rate, push_out
    ) -> Optional[LiquidActionSpec]:
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
        self.ready_for_tip_action(instrument, HardwareAction.DISPENSE, mount)

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

        is_full_dispense = numpy.isclose(instrument.current_volume - disp_vol, 0)

        if is_full_dispense:
            if push_out is None:
                push_out_ul = instrument.push_out_volume
            else:
                push_out_ul = push_out
        else:
            if push_out is not None and push_out != 0:
                raise CommandPreconditionViolated(
                    message="Cannot push_out on a dispense that does not leave the pipette empty",
                    detail={
                        "command": "dispense",
                        "remaining-volume": str(instrument.current_volume - disp_vol),
                    },
                )
            push_out_ul = 0

        push_out_dist_mm = push_out_ul / instrument.ul_per_mm(push_out_ul, "blowout")

        if not instrument.ok_to_push_out(push_out_dist_mm):
            raise CommandPreconditionViolated(
                message="Cannot push_out more than pipette max blowout volume.",
                detail={
                    "command": "dispense",
                },
            )

        dist = self.plunger_position(
            instrument, instrument.current_volume - disp_vol, "dispense"
        )
        speed = self.plunger_speed(
            instrument, instrument.dispense_flow_rate * rate, "dispense"
        )
        if isinstance(mount, top_types.Mount):
            return LiquidActionSpec(
                axis=Axis.of_plunger(mount),
                volume=disp_vol,
                plunger_distance=dist + push_out_dist_mm,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )
        else:
            return LiquidActionSpec(
                axis=Axis.of_main_tool_actuator(mount),
                volume=disp_vol,
                plunger_distance=dist,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )

    @overload
    def plan_check_blow_out(self, mount: top_types.Mount) -> LiquidActionSpec:
        ...

    @overload
    def plan_check_blow_out(self, mount: OT3Mount) -> LiquidActionSpec:
        ...

    def plan_check_blow_out(self, mount):  # type: ignore[no-untyped-def]
        """Check preconditions and calculate values for blowout."""
        instrument = self.get_pipette(mount)
        speed = self.plunger_speed(
            instrument, instrument.blow_out_flow_rate, "dispense"
        )

        if isinstance(mount, top_types.Mount):
            return LiquidActionSpec(
                axis=Axis.of_plunger(mount),
                volume=0,
                plunger_distance=instrument.plunger_positions.blow_out,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )
        else:
            return LiquidActionSpec(
                axis=Axis.of_main_tool_actuator(mount),
                volume=0,
                plunger_distance=instrument.plunger_positions.blow_out,
                speed=speed,
                instr=instrument,
                current=instrument.plunger_motor_current.run,
            )

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

        if Quirks.pickupTipShake in instrument.config.quirks:
            return build_one_shake() + build_one_shake()
        else:
            return []

    @overload
    def plan_check_pick_up_tip(
        self,
        mount: top_types.Mount,
        tip_length: float,
        presses: Optional[int],
        increment: Optional[float],
    ) -> Tuple[PickUpTipSpec, Callable[[], None]]:
        ...

    @overload
    def plan_check_pick_up_tip(
        self,
        mount: OT3Mount,
        tip_length: float,
        presses: Optional[int],
        increment: Optional[float],
    ) -> Tuple[PickUpTipSpec, Callable[[], None]]:
        ...

    def plan_check_pick_up_tip(  # type: ignore[no-untyped-def]
        self,
        mount,
        tip_length,
        presses,
        increment,
    ):
        # Prechecks: ready for pickup tip and press/increment are valid
        instrument = self.get_pipette(mount)
        if instrument.has_tip:
            raise UnexpectedTipAttachError("pick_up_tip", instrument.name, mount.name)
        self._ihp_log.debug(f"Picking up tip on {mount.name}")

        if presses is None or presses < 0:
            checked_presses = instrument.pick_up_configurations.press_fit.presses
        else:
            checked_presses = presses

        if not increment or increment < 0:
            check_incr = instrument.pick_up_configurations.press_fit.increment
        else:
            check_incr = increment

        pick_up_speed = instrument.pick_up_configurations.press_fit.speed

        def build_presses() -> Iterator[Tuple[float, float]]:
            # Press the nozzle into the tip <presses> number of times,
            # moving further by <increment> mm after each press
            for i in range(checked_presses):
                # move nozzle down into the tip
                press_dist = (
                    -1.0 * instrument.pick_up_configurations.press_fit.distance
                    + -1.0 * check_incr * i
                )
                # move nozzle back up
                backup_dist = -press_dist
                yield (press_dist, backup_dist)

        def add_tip_to_instr() -> None:
            instrument.add_tip(tip_length=tip_length)
            instrument.set_current_volume(0)

        if isinstance(mount, top_types.Mount):
            return (
                PickUpTipSpec(
                    plunger_prep_pos=instrument.plunger_positions.bottom,
                    plunger_currents={
                        Axis.of_plunger(mount): instrument.plunger_motor_current.run
                    },
                    presses=[
                        PickUpTipPressSpec(
                            current={
                                Axis.by_mount(
                                    mount
                                ): instrument.pick_up_configurations.press_fit.current_by_tip_count[
                                    instrument.nozzle_manager.current_configuration.tip_count
                                ]
                            },
                            speed=pick_up_speed,
                            relative_down=top_types.Point(0, 0, press_dist),
                            relative_up=top_types.Point(0, 0, backup_dist),
                        )
                        for press_dist, backup_dist in build_presses()
                    ],
                    shake_off_list=self._build_pickup_shakes(instrument),
                    retract_target=instrument.pick_up_configurations.press_fit.distance
                    + check_incr * checked_presses
                    + 2,
                ),
                add_tip_to_instr,
            )
        else:
            return (
                PickUpTipSpec(
                    plunger_prep_pos=instrument.plunger_positions.bottom,
                    plunger_currents={
                        Axis.of_main_tool_actuator(
                            mount
                        ): instrument.plunger_motor_current.run
                    },
                    presses=[
                        PickUpTipPressSpec(
                            current={
                                Axis.by_mount(
                                    mount
                                ): instrument.pick_up_configurations.press_fit.current_by_tip_count[
                                    instrument.nozzle_manager.current_configuration.tip_count
                                ]
                            },
                            speed=pick_up_speed,
                            relative_down=top_types.Point(0, 0, press_dist),
                            relative_up=top_types.Point(0, 0, backup_dist),
                        )
                        for press_dist, backup_dist in build_presses()
                    ],
                    shake_off_list=self._build_pickup_shakes(instrument),
                    retract_target=instrument.pick_up_configurations.press_fit.distance
                    + check_incr * checked_presses
                    + 2,
                ),
                add_tip_to_instr,
            )

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

    def _droptip_sequence_builder(
        self,
        bottom_pos: float,
        droptip_pos: float,
        plunger_currents: Dict[Axis, float],
        drop_tip_currents: Dict[Axis, float],
        speed: float,
        home_after: bool,
        home_axes: Sequence[Axis],
    ) -> Callable[[], List[DropTipMove]]:
        def build() -> List[DropTipMove]:
            base = [
                DropTipMove(
                    target_position=bottom_pos, current=plunger_currents, speed=None
                ),
                DropTipMove(
                    target_position=droptip_pos,
                    current=drop_tip_currents,
                    speed=speed,
                    home_after=home_after,
                    home_after_safety_margin=abs(bottom_pos - droptip_pos),
                    home_axes=home_axes,
                ),
                DropTipMove(  # always finish drop-tip at a known safe plunger position
                    target_position=bottom_pos, current=plunger_currents, speed=None
                ),
            ]
            return base

        return build

    @overload
    def plan_check_drop_tip(
        self, mount: top_types.Mount, home_after: bool
    ) -> Tuple[DropTipSpec, Callable[[], None]]:
        ...

    @overload
    def plan_check_drop_tip(
        self, mount: OT3Mount, home_after: bool
    ) -> Tuple[DropTipSpec, Callable[[], None]]:
        ...

    def plan_check_drop_tip(  # type: ignore[no-untyped-def]
        self,
        mount,
        home_after,
    ):
        instrument = self.get_pipette(mount)

        if not instrument.drop_configurations.plunger_eject:
            raise CommandPreconditionViolated(
                f"Pipette {instrument.name} on {mount.name} has no plunger eject configuration"
            )
        bottom = instrument.plunger_positions.bottom
        droptip = instrument.plunger_positions.drop_tip
        speed = instrument.drop_configurations.plunger_eject.speed
        shakes: List[Tuple[top_types.Point, Optional[float]]] = []
        if Quirks.dropTipShake in instrument.config.quirks:
            diameter = instrument.current_tiprack_diameter
            shakes = self._shake_off_tips_drop(diameter)

        def _remove_tips() -> None:
            instrument.set_current_volume(0)
            instrument.current_tiprack_diameter = 0.0
            instrument.remove_tip()

        if isinstance(mount, top_types.Mount):
            seq_builder_ot2 = self._droptip_sequence_builder(
                bottom,
                droptip,
                {Axis.of_plunger(mount): instrument.plunger_motor_current.run},
                {
                    Axis.of_plunger(
                        mount
                    ): instrument.drop_configurations.plunger_eject.current
                },
                speed,
                home_after,
                (Axis.of_plunger(mount),),
            )
            seq_ot2 = seq_builder_ot2()
            if Quirks.doubleDropTip in instrument.config.quirks:
                seq_ot2 = seq_ot2 + seq_builder_ot2()
            return (
                DropTipSpec(
                    drop_moves=seq_ot2,
                    shake_moves=shakes,
                    ending_current={
                        Axis.of_plunger(mount): instrument.plunger_motor_current.run
                    },
                ),
                _remove_tips,
            )
        else:
            seq_builder_ot3 = self._droptip_sequence_builder(
                bottom,
                droptip,
                {
                    Axis.of_main_tool_actuator(
                        mount
                    ): instrument.plunger_motor_current.run
                },
                {
                    Axis.of_main_tool_actuator(
                        mount
                    ): instrument.drop_configurations.plunger_eject.current
                },
                speed,
                home_after,
                (Axis.of_main_tool_actuator(mount),),
            )

            seq_ot3 = seq_builder_ot3()
            if Quirks.doubleDropTip in instrument.config.quirks:
                seq_ot3 = seq_ot3 + seq_builder_ot3()
            return (
                DropTipSpec(
                    drop_moves=seq_ot3,
                    shake_moves=shakes,
                    ending_current={
                        Axis.of_main_tool_actuator(
                            mount
                        ): instrument.plunger_motor_current.run
                    },
                ),
                _remove_tips,
            )

    async def set_liquid_class(self, mount: MountType, liquid_class: str) -> None:
        pip = self.get_pipette(mount)
        pip.set_liquid_class_by_name(liquid_class)

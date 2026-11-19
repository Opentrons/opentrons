"""Interactive gripper motion using the production Protocol Engine geometry.

This is an engineering tool for a single, operator-confirmed route. A fresh
ProtocolContext is required for each route. It never takes ownership of hardware,
changes configuration, or opens the jaw as part of exception cleanup.
"""

from __future__ import annotations

import math
from typing import Any, Callable, Dict, Mapping, Optional, cast

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.types import (
    OFF_DECK_LOCATION,
    GripperMoveType,
    LabwareMovementStrategy,
    ModuleLocation,
    OnLabwareLocation,
)
from opentrons.hardware_control.modules.types import FlexStackerStatus, PlatformState
from opentrons.hardware_control.types import Axis, DoorState, EstopState, OT3Mount
from opentrons.motion_planning import get_gripper_labware_movement_waypoints
from opentrons.types import Point
from opentrons_shared_data.labware.labware_definition import Quirks

from .storage import Route


TIPRACK_ADAPTER = "opentrons_flex_96_tiprack_adapter"
STACKER_MODEL = "flexStackerModuleV1"
RACK_TYPES = {
    f"T{volume}": f"opentrons_flex_96_tiprack_{volume}ul" for volume in (50, 200, 1000)
}
_STACKER_SLOTS = {"A4", "B4", "C4", "D4"}
_DECK_SLOTS = {"D2", "D3", "C2", "C3", "B1", "B2", "B3", "A1", "A2", "A3"}


class CalibrationMotion:
    """Move one rack, jog its release point, and synchronize Engine location.

    The caller confirms that the rack is at the source, the target is empty,
    the matching adapter is installed, and external fixtures are clear before
    calling prepare_route(). The supplied context must use the actual robot's
    deck configuration and module calibration data.
    """

    def __init__(
        self,
        context: ProtocolContext,
        rack_type: str,
        *,
        hover_height: float = 10.0,
        jog_speed: float = 2.0,
        travel_speed: float = 20.0,
        max_offset: float = 10.0,
        expected_stacker_serial: Optional[str] = None,
        safety_check: Optional[Callable[[], None]] = None,
    ) -> None:
        """Bind to an already-owned hardware API; no motion occurs here."""
        if rack_type in RACK_TYPES:
            self._rack_name = RACK_TYPES[rack_type]
        elif rack_type in RACK_TYPES.values():
            self._rack_name = rack_type
        else:
            raise ValueError(f"Unsupported rack type: {rack_type}")
        for name, value in (
            ("hover_height", hover_height),
            ("jog_speed", jog_speed),
            ("travel_speed", travel_speed),
            ("max_offset", max_offset),
        ):
            if not math.isfinite(value) or value <= 0:
                raise ValueError(f"{name} must be finite and positive.")
        self._context = context
        self._core = cast(Any, context._core)
        self._engine = self._core._engine_client
        self._hardware = self._core.get_hardware()
        self._hover_height = hover_height
        self._hover_remaining = hover_height
        self._jog_speed = jog_speed
        self._travel_speed = travel_speed
        self._max_offset = max_offset
        self._expected_stacker_serial = expected_stacker_serial
        self._safety_check = safety_check
        self._route: Optional[Route] = None
        self._stacker: Any = None
        self._adapter: Any = None
        self._rack_id: Optional[str] = None
        self._destination: Any = None
        self._reference: Optional[Point] = None
        self._released_offset: Optional[Dict[str, float]] = None
        self._finished = False
        self._faulted = False
        self.holding_labware = False
        self.at_drop_height = False

    @property
    def faulted(self) -> bool:
        """Whether hardware or state synchronization failed during this route."""
        return self._faulted

    def _point(self) -> Point:
        return cast(
            Point,
            self._hardware.gantry_position(OT3Mount.GRIPPER, refresh=True),
        )

    def _guard(self) -> None:
        if self._safety_check is not None:
            try:
                self._safety_check()
            except BaseException:
                self._faulted = True
                raise
        if self._hardware.door_state != DoorState.CLOSED:
            self._faulted = True
            raise RuntimeError("Robot door is open; motion requires manual recovery.")
        if self._hardware.get_estop_state() != EstopState.DISENGAGED:
            self._faulted = True
            raise RuntimeError(
                "Emergency stop is not cleared; motion requires manual recovery."
            )

    def _act(self, method: str, *args: Any, **kwargs: Any) -> Any:
        """Check live interlocks at every raw hardware command boundary."""
        self._guard()
        result = getattr(self._hardware, method)(*args, **kwargs)
        self._guard()
        return result

    def _validate_offset(self, offset: Mapping[str, float]) -> Dict[str, float]:
        if set(offset) != {"x", "y", "z"}:
            raise ValueError("Offset must have exactly x, y and z.")
        result = {axis: float(offset[axis]) for axis in ("x", "y", "z")}
        if any(
            not math.isfinite(value) or abs(value) > self._max_offset
            for value in result.values()
        ):
            raise ValueError(
                f"Each offset must be finite and within ±{self._max_offset} mm."
            )
        return result

    def _require_holding(self) -> None:
        if self._faulted:
            raise RuntimeError("Motion failed; this route requires manual recovery.")
        if not self.holding_labware or self._reference is None:
            raise RuntimeError("No rack is being held for calibration.")

    def _check_stacker(self, stacker: Any, *, require_extended: bool = True) -> None:
        module = self._engine.state.modules.get(stacker._core.module_id)
        if (
            self._expected_stacker_serial
            and module.serialNumber != self._expected_stacker_serial
        ):
            raise RuntimeError(
                "The loaded stacker does not match the selected slot's serial number."
            )
        if self._context.is_simulating():
            return
        hardware = stacker._core._sync_module_hardware
        if not hardware.install_detected:
            raise RuntimeError(
                "The selected stacker's installation switch is not detected."
            )
        if hardware.status != FlexStackerStatus.IDLE:
            raise RuntimeError("The selected stacker is not idle.")
        if require_extended:
            # home_all() completes movement before the poller necessarily sees
            # the new platform position. Refresh through the driver's public
            # verification method instead of testing its cached property.
            hardware.verify_shuttle_location(PlatformState.EXTENDED)

    def initialize_route(self, route: Route) -> None:
        """Prepare an operator-confirmed EMPTY shuttle before they place a rack.

        This homes the robot and stacker shuttle but never retrieves hopper
        labware. The caller must keep hands clear until this method returns.
        """
        if self._route is not None:
            raise RuntimeError(
                "Use a fresh CalibrationMotion and context for each route."
            )
        self._guard()
        if route.direction == "stacker_to_deck":
            stacker_slot, deck_slot = route.source, route.target
        elif route.direction == "deck_to_stacker":
            deck_slot, stacker_slot = route.source, route.target
        else:
            raise ValueError(f"Unknown route direction: {route.direction}")
        if stacker_slot not in _STACKER_SLOTS or deck_slot not in _DECK_SLOTS:
            raise ValueError("Route is outside the 80 supported stacker/deck routes.")
        if not self._hardware.has_gripper():
            raise RuntimeError("No gripper is attached.")
        if not self._hardware.gripper_jaw_can_home():
            raise RuntimeError(
                "The gripper is already holding or its jaw state is unknown."
            )
        self._route = route
        try:
            self._stacker = cast(
                Any, self._context.load_module(STACKER_MODEL, stacker_slot)
            )
            self._check_stacker(self._stacker, require_extended=False)
            self._adapter = self._context.load_adapter(TIPRACK_ADAPTER, deck_slot)
            self._act("home", axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G])
            self._act("home", axes=[Axis.X, Axis.Y])
            self._guard()
            self._engine.execute_command(
                commands.unsafe.UnsafeFlexStackerPrepareShuttleParams(
                    moduleId=self._stacker._core.module_id,
                    ignoreLatch=False,
                ),
                command_annotations=[],
            )
            self._guard()
            self._check_stacker(self._stacker)
        except BaseException:
            self._faulted = True
            raise

    def prepare_route(self, route: Route, old_offset: Mapping[str, float]) -> None:
        """Pick the operator-positioned source rack and stop above its target."""
        if self._faulted:
            raise RuntimeError("Motion failed; this route requires manual recovery.")
        if self._route != route or self._stacker is None:
            raise RuntimeError(
                "Initialize the empty shuttle before placing the source rack."
            )
        if self._rack_id is not None:
            raise RuntimeError("This route already has a rack.")
        offset = self._validate_offset(old_offset)
        self._guard()
        if not self._hardware.gripper_jaw_can_home():
            raise RuntimeError(
                "The gripper is already holding or its jaw state is unknown."
            )
        try:
            self._check_stacker(self._stacker)
            if route.direction == "stacker_to_deck":
                rack = self._stacker.load_labware(self._rack_name)
                self._destination = OnLabwareLocation(
                    labwareId=self._adapter._core.labware_id
                )
            else:
                rack = self._adapter.load_labware(self._rack_name)
                self._destination = ModuleLocation(
                    moduleId=self._stacker._core.module_id
                )
            self._rack_id = rack._core.labware_id
            state = self._engine.state
            definition = state.labware.get_definition(self._rack_id)
            source = state.geometry.ensure_valid_gripper_location(
                state.labware.get(self._rack_id).location
            )
            destination = state.geometry.ensure_valid_gripper_location(
                self._destination
            )
            source_point = state.geometry.get_labware_grip_point(
                labware_definition=definition,
                location=source,
                move_type=GripperMoveType.PICK_UP_LABWARE,
                user_additional_offset=None,
            )
            self._reference = state.geometry.get_labware_grip_point(
                labware_definition=definition,
                location=destination,
                move_type=GripperMoveType.DROP_LABWARE,
                user_additional_offset=None,
            )
            assert self._reference is not None
            hover = self._reference + Point(**offset) + Point(z=self._hover_height)
            self._original_drop_z = self._reference.z + offset["z"]
            # As in production, retract all mounts before horizontal motion.
            self._act("home", axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G])
            self._act("home", axes=[Axis.X, Axis.Y])
            home_z = self._point().z
            if hover.z > home_z:
                raise ValueError(
                    "The requested hover point is above the gripper travel height."
                )
            state.geometry.check_gripper_labware_tip_collision(
                gripper_homed_position_z=home_z,
                labware_id=self._rack_id,
                current_location=source,
            )
            force = state.labware.get_grip_force(definition)
            grip_specs = state.labware.get_gripper_width_specs(
                labware_definition=definition
            )
            disable_geometry_check = bool(
                definition.parameters.quirks
                and Quirks.disableGeometryBasedGripCheck.value
                in definition.parameters.quirks
            )
            waypoints = get_gripper_labware_movement_waypoints(
                from_labware_center=source_point,
                to_labware_center=hover,
                gripper_home_z=home_z,
                post_drop_slide_offset=None,
            )
            opened_at_source = False
            # The final production waypoint opens/releases; stop before it.
            for waypoint in waypoints[:-1]:
                if waypoint.jaw_open:
                    self._act("ungrip")
                    opened_at_source = True
                else:
                    if opened_at_source:
                        # A failed grip may still hold a rack. Preserve that state.
                        self.holding_labware = True
                    self._act("grip", force_newtons=force)
                    if opened_at_source:
                        self._hardware.raise_error_if_gripper_pickup_failed(
                            expected_grip_width=grip_specs.targetY,
                            grip_width_uncertainty_wider=grip_specs.uncertaintyWider,
                            grip_width_uncertainty_narrower=grip_specs.uncertaintyNarrower,
                            disable_geometry_grip_check=disable_geometry_check,
                        )
                self._act(
                    "move_to",
                    mount=OT3Mount.GRIPPER,
                    abs_position=waypoint.position,
                    speed=self._travel_speed,
                )
        except BaseException:
            self._faulted = True
            raise

    def candidate_offset(self) -> Dict[str, float]:
        """Read the candidate in deck coordinates, excluding planned hover Z."""
        if self._released_offset is not None:
            return dict(self._released_offset)
        self._require_holding()
        self._guard()
        assert self._reference is not None
        try:
            measured = self._point() - self._reference - Point(z=self._hover_remaining)
        except BaseException:
            self._faulted = True
            raise
        return self._validate_offset(
            {axis: getattr(measured, axis) for axis in ("x", "y", "z")}
        )

    def jog(self, axis: str, delta: float) -> Dict[str, float]:
        """Move one bounded step; all hardware calls finish before returning."""
        self._require_holding()
        if axis not in ("x", "y", "z"):
            raise ValueError("Jog axis must be x, y or z.")
        near_drop = self.at_drop_height or self._point().z < self._original_drop_z + 5.0
        limit = 0.1 if near_drop else 1.0
        if not math.isfinite(delta) or abs(delta) > limit + 1e-9:
            raise ValueError(f"Jog step must be finite and no greater than {limit} mm.")
        candidate = self.candidate_offset()
        candidate[axis] += delta
        self._validate_offset(candidate)
        try:
            self._act(
                "move_rel",
                mount=OT3Mount.GRIPPER,
                delta=Point(**{axis: delta}),
                speed=self._jog_speed,
            )
            return self.candidate_offset()
        except BaseException:
            self._faulted = True
            raise

    def lower_to_drop_height(self) -> Dict[str, float]:
        """Remove the hover clearance while preserving every keyboard correction."""
        self._require_holding()
        if self.at_drop_height:
            raise RuntimeError("Already at drop height.")
        self.candidate_offset()
        try:
            self._act(
                "move_rel",
                mount=OT3Mount.GRIPPER,
                delta=Point(z=-self._hover_remaining),
                speed=self._jog_speed,
            )
            self._hover_remaining = 0.0
            self.at_drop_height = True
            return self.candidate_offset()
        except BaseException:
            self._faulted = True
            raise

    def release(self) -> Dict[str, float]:
        """Release at the confirmed point, retract, then update Engine location."""
        self._require_holding()
        if not self.at_drop_height:
            raise RuntimeError("Explicitly lower to drop height before releasing.")
        offset = self.candidate_offset()
        assert self._rack_id is not None
        try:
            # Match production: engage Z brake before releasing, then re-home Z.
            self._act("disengage_axes", [Axis.Z_G])
            self._act("ungrip")
            self.holding_labware = False
            self._act("home_z", OT3Mount.GRIPPER)
            self._act("idle_gripper")
            self._engine.execute_command(
                commands.MoveLabwareParams(
                    labwareId=self._rack_id,
                    newLocation=self._destination,
                    strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
                ),
                command_annotations=[],
            )
            self._guard()
            self._released_offset = offset
            return dict(offset)
        except BaseException:
            self._faulted = True
            raise

    def finish_route(self) -> None:
        """Record that the operator has removed the released rack; do not move."""
        if self._faulted or self.holding_labware or self._released_offset is None:
            raise RuntimeError("Only a successfully released route can be finished.")
        if self._finished:
            return
        assert self._rack_id is not None
        try:
            self._engine.execute_command(
                commands.MoveLabwareParams(
                    labwareId=self._rack_id,
                    newLocation=OFF_DECK_LOCATION,
                    strategy=LabwareMovementStrategy.MANUAL_MOVE_WITHOUT_PAUSE,
                ),
                command_annotations=[],
            )
            self._finished = True
        except BaseException:
            self._faulted = True
            raise

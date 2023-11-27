"""Move Scheduler."""
import asyncio
import logging

from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveGroupSingleGripperStep,
    MoveGroupTipActionStep,
    MoveType,
    SingleMoveStep,
)


class MoveScheduler:

    def __init__(
        self,
        move_groups: MoveGroups,
        start_index: int = 0,
        ignore_stalls: bool = False,
    ) -> None:
        self._move_groups = move_groups
        self._start_index = start_index
        self._ignore_stalls = ignore_stalls
        self._scheduled = []
        self._ready_for_dispatch = False

    def has_moves(self) -> bool:
        for move_group in self._move_groups:
            for move in move_group:
                for node, step in move.items():
                    return True
        return False

    @property
    def ready_for_dispatch(self) -> bool:
        return self._ready_for_dispatch

    async def schedule(self, can_messenger: CanMessenger) -> None:
        if self.has_moves():
            for index, group in enumerate(self._move_groups, self._start_index):
                group_info = await self._schedule_move_group(group, index, can_messenger)
                self._scheduled.append(group_info)
            self._ready_for_dispatch = True
    
    async def _schedule_move(
        self,
        step: MoveGroupStep,
        seq_id: int,
        can_messenger: CanMessenger
    ):
        for node, node_step in step.items():
            message = self._get_message_type(group_id, seq_id, )


    async def _schedule_move_group(
        self,
        group: MoveGroup,
        group_id: int,
        can_messenger: CanMessenger
    ) -> ScheduledGroupInfo:
        moves: List[ScheduledMove] = []
        for seq_id, step in enumerate(move_group):
            for node, step in move_seq.items():
                message = self._get_message_type(step, group_id, seq_id)
                moves.append(self.)


    def _get_message_type(
        self, step: SingleMoveStep, group: int, seq: int
    ) -> MessageDefinition:
        """Return the correct payload type."""
        if isinstance(step, MoveGroupSingleAxisStep):
            return self._get_stepper_motor_message(step, group, seq)
        elif isinstance(step, MoveGroupTipActionStep):
            return self._get_tip_action_motor_message(step, group, seq)
        else:
            return self._get_brushed_motor_message(step, group, seq)

    def _get_brushed_motor_message(
        self, step: MoveGroupSingleGripperStep, group: int, seq: int
    ) -> MessageDefinition:
        payload = GripperMoveRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(
                int(step.duration_sec * brushed_motor_interrupts_per_sec)
            ),
            duty_cycle=UInt32Field(int(step.pwm_duty_cycle)),
            encoder_position_um=Int32Field(int(step.encoder_position_um)),
            stay_engaged=UInt8Field(int(step.stay_engaged)),
        )
        if step.move_type == MoveType.home:
            return GripperHomeRequest(payload=payload)
        elif step.move_type == MoveType.grip:
            return GripperGripRequest(payload=payload)
        else:
            return AddBrushedLinearMoveRequest(payload=payload)

    def _get_stepper_motor_message(
        self, step: MoveGroupSingleAxisStep, group: int, seq: int
    ) -> MessageDefinition:
        if step.move_type == MoveType.home:
            home_payload = HomeRequestPayload(
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                velocity_mm=self._convert_velocity(
                    step.velocity_mm_sec, interrupts_per_sec
                ),
            )
            return HomeRequest(payload=home_payload)
        else:
            stop_cond = step.stop_condition.value
            if self._ignore_stalls:
                stop_cond += MoveStopCondition.ignore_stalls.value
            linear_payload = AddLinearMoveRequestPayload(
                request_stop_condition=MoveStopConditionField(stop_cond),
                group_id=UInt8Field(group),
                seq_id=UInt8Field(seq),
                duration=UInt32Field(int(step.duration_sec * interrupts_per_sec)),
                acceleration_um=Int32Field(
                    int(
                        (
                            step.acceleration_mm_sec_sq
                            * 1000.0
                            / interrupts_per_sec
                            / interrupts_per_sec
                        )
                        * (2**31)
                    )
                ),
                velocity_mm=Int32Field(
                    int((step.velocity_mm_sec / interrupts_per_sec) * (2**31))
                ),
            )
            return AddLinearMoveRequest(payload=linear_payload)

    def _get_tip_action_motor_message(
        self, step: MoveGroupTipActionStep, group: int, seq: int
    ) -> TipActionRequest:
        tip_action_payload = TipActionRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=UInt32Field(int(step.duration_sec * tip_interrupts_per_sec)),
            velocity=self._convert_velocity(
                step.velocity_mm_sec, tip_interrupts_per_sec
            ),
            action=PipetteTipActionTypeField(step.action),
            request_stop_condition=MoveStopConditionField(step.stop_condition),
            acceleration=Int32Field(
                int(
                    (
                        step.acceleration_mm_sec_sq
                        * 1000.0
                        / tip_interrupts_per_sec
                        / tip_interrupts_per_sec
                    )
                    * (2**31)
                )
            ),
        )
        return TipActionRequest(payload=tip_action_payload)
    
    def _convert_velocity(
        self, velocity: Union[float, np.float64], interrupts: int
    ) -> Int32Field:
        return Int32Field(int((velocity / interrupts) * (2**31)))

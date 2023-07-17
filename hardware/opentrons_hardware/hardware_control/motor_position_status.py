"""Utilities for gathering motor position/status for an OT3 axis."""
import asyncio
from typing import Set, Tuple
import logging

from opentrons_shared_data.errors.exceptions import (
    RoboticsControlError,
    CommandTimedOutError,
)
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
    MultipleMessagesWaitableCallback,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    MotorPositionRequest,
    MotorPositionResponse,
    UpdateMotorPositionEstimationRequest,
    UpdateMotorPositionEstimationResponse,
    UpdateGearMotorPositionEstimationRequest,
    UpdateGearMotorPositionEstimationResponse,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    MessageId,
    MotorPositionFlags,
)

from .types import NodeMap


log = logging.getLogger(__name__)


MotorPositionStatus = NodeMap[Tuple[float, float, bool, bool]]


async def _parser_motor_position_response(
    reader: WaitableCallback,
) -> MotorPositionStatus:
    data = {}
    async for response, arb_id in reader:
        assert isinstance(response, MotorPositionResponse)
        node = NodeId(arb_id.parts.originating_node_id)
        data.update(
            {
                node: (
                    float(response.payload.current_position.value / 1000.0),
                    float(response.payload.encoder_position.value) / 1000.0,
                    bool(
                        response.payload.position_flags.value
                        & MotorPositionFlags.stepper_position_ok.value
                    ),
                    bool(
                        response.payload.position_flags.value
                        & MotorPositionFlags.encoder_position_ok.value
                    ),
                )
            }
        )
    return data


async def get_motor_position(
    can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
) -> MotorPositionStatus:
    """Request node to respond with motor and encoder status."""
    data: MotorPositionStatus = {}

    def _listener_filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) in nodes) and (
            MessageId(arbitration_id.parts.message_id)
            == MotorPositionResponse.message_id
        )

    with MultipleMessagesWaitableCallback(
        can_messenger,
        _listener_filter,
        len(nodes),
    ) as reader:
        await can_messenger.send(
            node_id=NodeId.broadcast, message=MotorPositionRequest()
        )
        try:
            data = await asyncio.wait_for(
                _parser_motor_position_response(reader),
                timeout,
            )
        except asyncio.TimeoutError:
            log.warning("Motor position timed out")
    return data


async def _parser_update_motor_position_response(
    reader: WaitableCallback, expected: NodeId
) -> Tuple[float, float, bool, bool]:
    async for response, arb_id in reader:
        assert isinstance(response, UpdateMotorPositionEstimationResponse)
        node = NodeId(arb_id.parts.originating_node_id)
        if node == expected:
            return (
                float(response.payload.current_position.value),
                float(response.payload.encoder_position.value) / 1000.0,
                bool(
                    response.payload.position_flags.value
                    & MotorPositionFlags.stepper_position_ok.value
                ),
                bool(
                    response.payload.position_flags.value
                    & MotorPositionFlags.encoder_position_ok.value
                ),
            )
    raise StopAsyncIteration


async def update_motor_position_estimation(
    can_messenger: CanMessenger, nodes: Set[NodeId], timeout: float = 1.0
) -> MotorPositionStatus:
    """Updates the estimation of motor position on selected nodes.

    Request node to update motor position from its encoder and respond
    with updated motor and encoder status.
    """

    def _listener_filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) in nodes) and (
            MessageId(arbitration_id.parts.message_id)
            == UpdateMotorPositionEstimationResponse.message_id
        )

    data = {}

    for node in nodes:
        with WaitableCallback(can_messenger, _listener_filter) as reader:
            await can_messenger.send(
                node_id=node, message=UpdateMotorPositionEstimationRequest()
            )
            try:
                data[node] = await asyncio.wait_for(
                    _parser_update_motor_position_response(reader, node), timeout
                )
                if not data[node][2]:
                    # If the stepper_ok flag isn't set, that means the node didn't update position.
                    # This probably is because the motor is off. It's rare.
                    raise RoboticsControlError(
                        message="Failed to update motor position",
                        detail={
                            "node": node.name,
                        },
                    )
            except asyncio.TimeoutError:
                log.warning("Update motor position estimation timed out")
                raise CommandTimedOutError(
                    "Update motor position estimation timed out",
                    detail={
                        "missing-nodes": ", ".join(
                            node.name for node in set(nodes).difference(set(data))
                        )
                    },
                )

    return data


async def update_gear_motor_position_estimation(
    can_messenger: CanMessenger, timeout: float = 1.0
) -> Tuple[float, bool]:
    """Updates the estimation of motor position on selected nodes.

    Request node to update motor position from its encoder and respond
    with updated motor and encoder status.
    """

    def _listener_filter(arbitration_id: ArbitrationId) -> bool:
        return (
            NodeId(arbitration_id.parts.originating_node_id) in {NodeId.pipette_left}
        ) and (
            MessageId(arbitration_id.parts.message_id)
            in [
                UpdateGearMotorPositionEstimationResponse.message_id,
                # TipActionResponse.message_id,
            ]
        )

    data = []

    with WaitableCallback(can_messenger, _listener_filter) as reader:
        await can_messenger.send(
            node_id=NodeId.pipette_left,
            message=UpdateGearMotorPositionEstimationRequest(),
        )
        try:
            for i in range(2):
                response = await asyncio.wait_for(
                    _parser_update_gear_motor_position_response(
                        reader, NodeId.pipette_left
                    ),
                    timeout,
                )
                data.append(response)
            # make sure response from both gear motors is the same
            assert data[0] == data[1]
            if not data[0][1] or not data[1][1]:
                # If the stepper_ok flag isn't set, that means the node didn't update position.
                raise RuntimeError(
                    f"Failed to update motor position for node: {NodeId.pipette_left}"
                )
        except asyncio.TimeoutError:
            log.warning("Update motor position estimation timed out")
            return 0, False

    return data[0]


async def _parser_update_gear_motor_position_response(
    reader: WaitableCallback, expected: NodeId
) -> Tuple[float, bool]:
    async for response, arb_id in reader:
        if isinstance(
            response, UpdateGearMotorPositionEstimationResponse
        ):  # or isinstance(response, TipActionResponse):
            node = NodeId(arb_id.parts.originating_node_id)
            if node == expected:
                return (
                    float(response.payload.current_position_um.value / 1000.0),
                    bool(MotorPositionFlags.stepper_position_ok.value),
                )
    raise StopAsyncIteration

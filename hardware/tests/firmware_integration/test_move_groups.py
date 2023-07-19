"""Tests for move groups."""
import asyncio
import numpy as np
from typing import Iterator, List, Dict

import pytest
from _pytest.fixtures import FixtureRequest
from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AddLinearMoveRequest,
    GetMoveGroupRequest,
    GetMoveGroupResponse,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    AddLinearMoveRequestPayload,
    MoveGroupRequestPayload,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    Int32Field,
    UInt32Field,
)
from opentrons_hardware.firmware_bindings.messages.fields import MoveStopConditionField

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.motion import create_step, create_home_step


@pytest.fixture(
    scope="session",
    params=list(range(3)),
)
def group_id(request: FixtureRequest) -> Iterator[int]:
    """A group id test fixture."""
    yield request.param  # type: ignore[attr-defined]


def filter_func(arb: ArbitrationId) -> bool:
    """Message filtering function."""
    return bool(arb.parts.message_id == GetMoveGroupResponse.message_id)


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_add_moves(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    motor_node_id: NodeId,
    group_id: int,
) -> None:
    """It should add moves and verify that they were stored correctly."""
    durations = 100, 200, 300

    moves = (
        AddLinearMoveRequest(
            payload=AddLinearMoveRequestPayload(
                group_id=UInt8Field(group_id),
                seq_id=UInt8Field(i),
                duration=UInt32Field(duration),
                request_stop_condition=MoveStopConditionField(0),
                acceleration_um=Int32Field(0),
                velocity_mm=Int32Field(0),
            )
        )
        for i, duration in enumerate(durations)
    )

    # Add the moves
    for move in moves:
        await can_messenger.send(node_id=motor_node_id, message=move)

    # Get the move group
    await can_messenger.send(
        node_id=motor_node_id,
        message=GetMoveGroupRequest(
            payload=MoveGroupRequestPayload(group_id=UInt8Field(group_id))
        ),
    )

    response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    assert isinstance(response, GetMoveGroupResponse)
    assert response.payload.num_moves.value == len(durations)
    assert response.payload.total_duration.value == sum(durations)


@pytest.mark.requires_emulator
async def test_move_integration(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
    all_motor_nodes: List[NodeId],
    all_motor_node_step_sizes: Dict[NodeId, float],
) -> None:
    """Test that moving returns correct positions."""
    # First, we should test homing. We have to home because the emulator stack is
    # long-lived beyond each test, so we might as well make sure we're homing
    # from a non-zero position
    prep_move = [
        create_step(
            distance={
                motor_node: np.float64(motor_node.value)
                for motor_node in all_motor_nodes
            },
            velocity={
                motor_node: np.float64(motor_node.value / 10)
                for motor_node in all_motor_nodes
            },
            acceleration={motor_node: np.float64(0) for motor_node in all_motor_nodes},
            duration=np.float64(1),
            present_nodes=all_motor_nodes,
        )
    ]
    prep_runner = MoveGroupRunner([prep_move])
    # throw away this position - it may change depending on previous state of
    # simulators
    await prep_runner.run(can_messenger)

    home_move = [
        create_home_step(
            distance={motor_node: np.float64(10) for motor_node in all_motor_nodes},
            velocity={motor_node: np.float64(40) for motor_node in all_motor_nodes},
        )
    ]
    home_runner = MoveGroupRunner([home_move])
    position = await home_runner.run(can_messenger)
    assert position == {
        motor_node: (0.0, 0.0, False, False) for motor_node in all_motor_nodes
    }
    # these moves test position accumulation to reasonably realistic values
    # and have to do it over a kind of long time so that the velocities are low
    # enough that the pipettes, with their extremely high steps/mm values,
    # can handle it. The exact time this takes will be dependent on the speed of
    # the computer.
    moves = [
        create_step(
            distance={
                motor_node: np.float64(motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            velocity={
                motor_node: np.float64(motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            acceleration={motor_node: np.float64(0) for motor_node in all_motor_nodes},
            duration=np.float64(4),
            present_nodes=all_motor_nodes,
        ),
        create_step(
            distance={
                motor_node: np.float64(motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            velocity={
                motor_node: np.float64(motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            acceleration={motor_node: np.float64(0) for motor_node in all_motor_nodes},
            duration=np.float64(4),
            present_nodes=all_motor_nodes,
        ),
        create_step(
            distance={
                motor_node: np.float64(-motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            velocity={
                motor_node: np.float64(-motor_node.value / 4)
                for motor_node in all_motor_nodes
            },
            acceleration={motor_node: np.float64(0) for motor_node in all_motor_nodes},
            duration=np.float64(4),
            present_nodes=all_motor_nodes,
        ),
    ]
    runner = MoveGroupRunner([moves])
    position = await runner.run(can_messenger)
    # The numerical comparisons here are complicated because there are several unit
    # conversions that involve losing precision:
    # - velocities specified above in float mm/s are converted to fixed point sq0.31
    #   mm/tick, a discretizing operation to (2**-31)*10e6 mm/s
    # - in the firmware, that velocity is converted to steps/tick, which is a
    #   discretizing operation to 2**-31 step
    # - in the firmware, after velocity is accumulated to position, that position
    #   is converted to micrometers which is a different discretizing conversion to
    #   10e-3 mm
    #  All of this lines up to mean you have to give some wiggle room for positions.
    #  Also mypy doesn't like pytest.approx so we have to type ignore it

    # We now store the position as a tuple of assumed position + encoder value.
    assert {k: v[0] for k, v in position.items()} == {  # type: ignore[comparison-overlap]
        motor_node: pytest.approx(
            motor_node.value, abs=all_motor_node_step_sizes[motor_node] * 3
        )
        for motor_node in all_motor_nodes
    }

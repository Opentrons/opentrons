"""Tests for hardware_event_forwarder."""


from asyncio import get_running_loop
from typing import Callable, cast

import pytest
from anyio import to_thread
from decoy import Decoy, matchers

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    DoorStateNotification,
    DoorState,
    HardwareEventHandler,
)

from opentrons.protocol_engine.actions import ActionDispatcher, HardwareEventAction
from opentrons.protocol_engine.execution.hardware_event_forwarder import (
    HardwareEventForwarder,
)


@pytest.fixture
def hardware_control_api(
    decoy: Decoy,
) -> HardwareControlAPI:
    """Return a mock in the shape of a HardwareControlAPI."""
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Return a mock in the shape of an ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


async def test_hardware_event_forwarder(
    decoy: Decoy,
    hardware_control_api: HardwareControlAPI,
    action_dispatcher: ActionDispatcher,
) -> None:
    handler_captor = matchers.Captor()
    unsubscribe_callback = decoy.mock()
    decoy.when(hardware_control_api.register_callback(handler_captor)).then_return(
        unsubscribe_callback
    )

    subject = HardwareEventForwarder.start_forwarding(
        event_source=hardware_control_api,
        action_destination=action_dispatcher,
        destination_loop=get_running_loop(),
    )

    captured_handler = cast(HardwareEventHandler, handler_captor.value)

    input_event = DoorStateNotification(new_state=DoorState.OPEN, blocking=True)
    expected_action_to_forward = HardwareEventAction(input_event)

    # It can forward events that come from a different thread.
    await to_thread.run_sync(captured_handler, input_event)
    decoy.verify(action_dispatcher.dispatch(expected_action_to_forward))

    # It supports unsubscribing, and unsubscribing is safe to do multiple times.
    subject.stop_forwarding_soon()
    subject.stop_forwarding_soon()
    decoy.verify(unsubscribe_callback(), times=1)

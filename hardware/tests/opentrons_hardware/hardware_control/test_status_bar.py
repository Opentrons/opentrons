"""Test status bar integration."""
from __future__ import annotations
import pytest
from mock import AsyncMock
from typing import List, Type, Optional

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.utils import UInt8Field, UInt16Field
from opentrons_hardware.firmware_bindings.messages.fields import (
    LightAnimationTypeField,
    LightTransitionTypeField,
)
from opentrons_hardware.firmware_bindings.binary_constants import (
    LightAnimationType,
    LightTransitionType,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    Ack,
    StartLightAction,
    ClearLightActionStagingQueue,
    AddLightActionRequest,
)
from opentrons_hardware.hardware_control.status_bar import (
    StatusBar,
    Color,
    ColorStep,
    RED,
    BLUE,
    GREEN,
)


@pytest.fixture
async def mock_binary_messenger() -> AsyncMock:
    """For these tests, we only need to mock send_and_receive."""
    mock = AsyncMock(BinaryMessenger)
    mock.send_and_receive.return_value = Ack
    return mock


@pytest.fixture
async def subject(mock_binary_messenger: AsyncMock) -> StatusBar:
    """Testing subject."""
    return StatusBar(mock_binary_messenger)


@pytest.fixture
def color_steps() -> List[ColorStep]:
    """Provides a list of steps."""
    return [
        ColorStep(
            transition_type=LightTransitionType.linear,
            transition_time_ms=1234,
            color=RED,
        ),
        ColorStep(
            transition_type=LightTransitionType.sinusoid,
            transition_time_ms=555,
            color=BLUE,
        ),
        ColorStep(
            transition_type=LightTransitionType.instant,
            transition_time_ms=100,
            color=GREEN,
        ),
    ]


def light_action_from_step(step: ColorStep) -> AddLightActionRequest:
    """Helper to translate steps into their corresponding messages."""
    return AddLightActionRequest(
        transition_time=UInt16Field(step.transition_time_ms),
        transition_type=LightTransitionTypeField(step.transition_type),
        red=UInt8Field(step.color.r),
        green=UInt8Field(step.color.g),
        blue=UInt8Field(step.color.b),
        white=UInt8Field(step.color.w),
    )


@pytest.mark.parametrize(
    "animation_type", [LightAnimationType.looping, LightAnimationType.single_shot]
)
async def test_start_animation_happy_path(
    subject: StatusBar,
    mock_binary_messenger: AsyncMock,
    color_steps: List[ColorStep],
    animation_type: LightAnimationType,
) -> None:
    """For this test, let every send succeed."""
    sent: List[BinaryMessageDefinition] = []

    async def mock_send_and_receive(
        message: BinaryMessageDefinition, response_type: Type[BinaryMessageDefinition]
    ) -> BinaryMessageDefinition:
        sent.append(message)
        return response_type()

    mock_binary_messenger.send_and_receive.side_effect = mock_send_and_receive

    assert await subject.start_animation(color_steps, animation_type)

    assert mock_binary_messenger.send_and_receive.call_count == len(color_steps) + 2

    assert len(sent) == len(color_steps) + 2

    assert sent.pop(0) == ClearLightActionStagingQueue()
    for step in color_steps:
        assert sent.pop(0) == light_action_from_step(step)
    assert sent.pop(0) == StartLightAction(type=LightAnimationTypeField(animation_type))


async def test_start_animation_failures(
    subject: StatusBar, mock_binary_messenger: AsyncMock, color_steps: List[ColorStep]
) -> None:
    """Test getting no response back at various points."""
    # Without a messenger, always fail out
    bad_subject = StatusBar(None)
    assert not await bad_subject.start_animation(
        color_steps, LightAnimationType.single_shot
    )

    for i in range(len(color_steps) + 2):
        mock_binary_messenger.send_and_receive.reset_mock()
        ret_list: List[Optional[BinaryMessageDefinition]] = []
        for _ in range(i):
            ret_list.append(Ack())
        ret_list.append(None)
        mock_binary_messenger.send_and_receive.side_effect = ret_list
        assert not await subject.start_animation(
            color_steps, LightAnimationType.looping
        )
        assert mock_binary_messenger.send_and_receive.call_count == i + 1


def color_matches(msg: AddLightActionRequest, color: Color) -> bool:
    """Helper to check if a light message matches a color"""
    return (
        msg.red.value == color.r
        and msg.green.value == color.g
        and msg.blue.value == color.b
        and msg.white.value == color.w
    )


async def test_animation_interface(
    subject: StatusBar, mock_binary_messenger: AsyncMock, color_steps: List[ColorStep]
) -> None:
    """Test the higher level interfaces."""
    colors = [step.color for step in color_steps]
    actions: List[AddLightActionRequest] = []
    animation_type: Optional[LightAnimationType] = None

    async def mock_send_and_receive(
        message: BinaryMessageDefinition, response_type: Type[BinaryMessageDefinition]
    ) -> BinaryMessageDefinition:
        nonlocal animation_type
        if isinstance(message, AddLightActionRequest):
            actions.append(message)
        elif isinstance(message, StartLightAction):
            animation_type = LightAnimationType(message.type.value)
        return response_type()

    mock_binary_messenger.send_and_receive.side_effect = mock_send_and_receive

    # Static
    assert await subject.static_color(color=RED)
    assert len(actions) == 1
    assert color_matches(actions[0], RED)
    assert animation_type == LightAnimationType.single_shot

    actions.clear()
    animation_type = None

    # Pulse
    assert await subject.pulse_color(color=GREEN)
    assert len(actions) == 2
    assert actions[0].transition_time.value == actions[1].transition_time.value
    assert actions[0].transition_type.value == LightTransitionType.sinusoid
    assert actions[1].transition_type.value == LightTransitionType.sinusoid
    assert animation_type == LightAnimationType.looping

    actions.clear()
    animation_type = None

    # Flash
    assert await subject.flash_color(color=BLUE)
    assert len(actions) > 1
    for action in actions:
        assert action.transition_type.value == LightTransitionType.instant
    assert animation_type == LightAnimationType.looping

    actions.clear()
    animation_type = None

    # Blink once
    assert await subject.blink_once(blink_color=RED, end_color=BLUE)
    assert len(actions) > 1
    assert color_matches(actions.pop(), BLUE)
    assert color_matches(actions[0], RED)
    assert animation_type == LightAnimationType.single_shot

    actions.clear()
    animation_type = None

    # Color Cycle
    assert await subject.cycle_colors(colors=colors, transition_time_ms=123)
    assert len(actions) == len(colors)
    for color in colors:
        action = actions.pop(0)
        assert color_matches(action, color)
        assert action.transition_time.value == 123
    assert animation_type == LightAnimationType.single_shot

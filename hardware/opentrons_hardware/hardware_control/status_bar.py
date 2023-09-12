"""Interface to the status led bar."""
from dataclasses import dataclass
from typing import Optional, List
import asyncio

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.binary_constants import (
    LightTransitionType,
    LightAnimationType,
)
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    AddLightActionRequest,
    ClearLightActionStagingQueue,
    StartLightAction,
    Ack,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt16Field,
    UInt8Field,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    LightAnimationTypeField,
    LightTransitionTypeField,
)


@dataclass
class Color:
    """Represents an RGBW color. Range for values is [0,255]"""

    r: int
    g: int
    b: int
    w: int


@dataclass
class ColorStep:
    """Represents a single step in an animation."""

    transition_type: LightTransitionType
    transition_time_ms: int
    color: Color


RED = Color(r=255, g=0, b=0, w=0)
GREEN = Color(r=0, g=255, b=0, w=0)
BLUE = Color(r=0, g=189, b=255, w=0)
WHITE = Color(r=0, g=0, b=0, w=255)
ORANGE = Color(r=255, g=165, b=0, w=0)
PURPLE = Color(r=192, g=0, b=255, w=0)
YELLOW = Color(r=255, g=255, b=0, w=0)
OFF = Color(r=0, g=0, b=0, w=0)


class StatusBar:
    """Interface to the status bar."""

    def __init__(self, messenger: Optional[BinaryMessenger]) -> None:
        """Create a status bar controller."""
        self._messenger = messenger
        self._lock = asyncio.Lock()

    # Low level

    async def start_animation(
        self, steps: List[ColorStep], type: LightAnimationType
    ) -> bool:
        """Execute a new animation."""
        if self._messenger is None:
            return False
        async with self._lock:
            if not await self._messenger.send_and_receive(
                message=ClearLightActionStagingQueue(),
                response_type=Ack,
            ):
                return False
            for step in steps:
                msg = AddLightActionRequest(
                    transition_time=UInt16Field(step.transition_time_ms),
                    transition_type=LightTransitionTypeField(step.transition_type),
                    red=UInt8Field(step.color.r),
                    green=UInt8Field(step.color.g),
                    blue=UInt8Field(step.color.b),
                    white=UInt8Field(step.color.w),
                )
                if not await self._messenger.send_and_receive(
                    message=msg, response_type=Ack
                ):
                    return False
            if not await self._messenger.send_and_receive(
                message=StartLightAction(type=LightAnimationTypeField(type)),
                response_type=Ack,
            ):
                return False
        return True

    # High level interface

    async def static_color(self, color: Color) -> bool:
        """Set the status bar to a static color."""
        return await self.start_animation(
            [
                ColorStep(
                    transition_type=LightTransitionType.linear,
                    transition_time_ms=500,
                    color=color,
                )
            ],
            LightAnimationType.single_shot,
        )

    async def pulse_color(self, color: Color) -> bool:
        """Set the status bar to pulse a color."""
        steps = [
            ColorStep(
                transition_type=LightTransitionType.sinusoid,
                transition_time_ms=1000,
                color=color,
            ),
            ColorStep(
                transition_type=LightTransitionType.sinusoid,
                transition_time_ms=1000,
                color=OFF,
            ),
        ]
        return await self.start_animation(steps=steps, type=LightAnimationType.looping)

    async def flash_color(self, color: Color) -> bool:
        """Set the status bar to flash a color."""
        steps = [
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=color,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=OFF,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=color,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=OFF,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=750,
                color=color,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=OFF,
            ),
        ]
        return await self.start_animation(steps=steps, type=LightAnimationType.looping)

    async def blink_once(self, blink_color: Color, end_color: Color) -> bool:
        """Blink the status bar once, and then return to end_color."""
        steps = [
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=blink_color,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=OFF,
            ),
            ColorStep(
                transition_type=LightTransitionType.instant,
                transition_time_ms=150,
                color=blink_color,
            ),
            ColorStep(
                transition_type=LightTransitionType.linear,
                transition_time_ms=1000,
                color=end_color,
            ),
        ]
        return await self.start_animation(
            steps=steps, type=LightAnimationType.single_shot
        )

    async def cycle_colors(
        self, colors: List[Color], transition_time_ms: int = 250
    ) -> bool:
        """Cycle through a list of colors, leaving the status bar on the last color."""
        steps = [
            ColorStep(
                transition_type=LightTransitionType.linear,
                transition_time_ms=transition_time_ms,
                color=c,
            )
            for c in colors
        ]
        return await self.start_animation(
            steps=steps, type=LightAnimationType.single_shot
        )

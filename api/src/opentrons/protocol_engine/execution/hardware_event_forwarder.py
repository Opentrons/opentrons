"""Forward events from a `HardwareControlAPI` into a `ProtocolEngine`."""

from __future__ import annotations

from asyncio import AbstractEventLoop

from opentrons.hardware_control import HardwareControlAPI
from .actions import ActionDispatcher


class HardwareEventForwarder:
    """Forward events from a `HardwareControlAPI` into a `ProtocolEngine`."""

    def __init__(self) -> None:
        raise NotImplementedError

    @classmethod
    def start_listening(
        cls,
        event_source: HardwareControlAPI,
        action_destination: ActionDispatcher,
        destination_loop: AbstractEventLoop
    ) -> HardwareEventForwarder:
        return HardwareEventForwarder()

    def stop_listening() -> None:
        raise NotImplementedError

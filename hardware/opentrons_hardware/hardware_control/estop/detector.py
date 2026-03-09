"""Detector for estop status messages."""
from opentrons_hardware.drivers.binary_usb import BinaryMessenger

from typing import List, Callable

from dataclasses import dataclass

from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    EstopButtonDetectionChange,
    EstopStateChange,
    EstopButtonPresentRequest,
    EstopStateRequest,
)
from opentrons_shared_data.errors.exceptions import (
    InternalUSBCommunicationError,
)
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId


@dataclass
class EstopSummary:
    """Summary of the detected estop state."""

    left_detected: bool  # Whether the left estop is connected
    right_detected: bool  # Whether the right estop is connected
    engaged: bool  # Whether either estop is engaged


EstopDetectorListener = Callable[[EstopSummary], None]


class EstopDetector:
    """Class to listen for notification messages regarding estop state changes.

    This class simply listens for the rear panel's broadcasts when the estop
    connectivity state changes. Higher-level classes may subscribe to
    notifications for when the estop state changes, but no logic is applied
    in this class.
    """

    def __init__(
        self, usb_messenger: BinaryMessenger, initial_state: EstopSummary
    ) -> None:
        """Create a new EstopDetector."""
        self._usb_messenger = usb_messenger
        self._state = initial_state
        self._listeners: List[EstopDetectorListener] = []

        usb_messenger.add_listener(
            self._estop_connected_listener,
            lambda message_id: bool(
                message_id
                in [
                    BinaryMessageId.estop_state_change,
                    BinaryMessageId.estop_button_detection_change,
                ]
            ),
        )

    def __del__(self) -> None:
        self._usb_messenger.remove_listener(self._estop_connected_listener)

    @staticmethod
    async def build(usb_messenger: BinaryMessenger) -> "EstopDetector":
        """Builder function to create a new estop detector."""
        estop_state = await usb_messenger.send_and_receive(
            EstopStateRequest(), EstopStateChange
        )
        detected = await usb_messenger.send_and_receive(
            EstopButtonPresentRequest(), EstopButtonDetectionChange
        )
        if not isinstance(estop_state, EstopStateChange) or not isinstance(
            detected, EstopButtonDetectionChange
        ):
            raise InternalUSBCommunicationError(
                "Could not get estop status from rear panel"
            )
        initial_state = EstopSummary(
            left_detected=detected.aux1_detected.value > 0,
            right_detected=detected.aux2_detected.value > 0,
            engaged=estop_state.engaged.value > 0,
        )
        return EstopDetector(usb_messenger=usb_messenger, initial_state=initial_state)

    def add_listener(self, listener: EstopDetectorListener) -> None:
        """Add a new listener for estop detector changes."""
        if listener not in self._listeners:
            self._listeners.append(listener)

    def remove_listener(self, listener: EstopDetectorListener) -> None:
        """Remove an existing listener for estop detector changes."""
        if listener in self._listeners:
            self._listeners.remove(listener)

    @property
    def status(self) -> EstopSummary:
        """Gets the current estop status summary"""
        return self._state

    def _estop_connected_listener(self, msg: BinaryMessageDefinition) -> None:
        """The callback to parse messages with estop data."""
        if isinstance(msg, EstopButtonDetectionChange):
            self._state.left_detected = msg.aux1_detected.value > 0
            self._state.right_detected = msg.aux2_detected.value > 0
        elif isinstance(msg, EstopStateChange):
            self._state.engaged = msg.engaged.value > 0
        else:
            # Don't call listeners if this was an unrelated message
            return
        for listener in self._listeners:
            listener(self._state)

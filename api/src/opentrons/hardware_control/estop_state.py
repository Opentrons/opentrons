"""opentrons.hardware_control.estop_state: module to manage estop state machine on OT-3."""

from typing import List
from opentrons_hardware.hardware_control.estop.detector import (
    EstopSummary,
    EstopDetector,
)

from opentrons.hardware_control.types import (
    EstopState,
    EstopPhysicalStatus,
    EstopAttachLocation,
    EstopStateNotification,
    HardwareEventHandler,
)


class EstopStateMachine:
    """Class to manage global Estop state."""

    def __init__(self, detector: EstopDetector) -> None:
        """Create a new EstopStateMachine."""
        self._detector = detector
        self._state: EstopState = EstopState.DISENGAGED
        self._summary = detector.status
        self._transition_from_disengaged()
        detector.add_listener(self._detector_listener)
        self._listeners: List[HardwareEventHandler] = []

    def __del__(self):
        self._detector.remove_listener(self._detector_listener)

    def add_listener(self, listener: HardwareEventHandler) -> None:
        """Add a hardware event listener for estop event changes."""
        if not listener in self._listeners:
            self._listeners.append(listener)

    def remove_listener(self, listener: HardwareEventHandler) -> None:
        """Remove an existing hardware event listener for estop detector changes."""
        if listener in self._listeners:
            self._listeners.remove(listener)

    def _detector_listener(self, summary: EstopSummary) -> None:
        """Callback from the detector."""
        self._handle_state_transition(new_summary=summary)

    def _transition_from_physically_engaged(self) -> None:
        if not self._summary.engaged:
            # Estop disengaged, move to Logically Engaged
            self._state = EstopState.LOGICALLY_ENGAGED

    def _transition_from_disengaged(self) -> None:
        if self._summary.engaged:
            # Estop engaged, move to physically engaged
            self._state = EstopState.PHYSICALLY_ENGAGED
            return
        if self._summary.left_detected or self._summary.right_detected:
            # An estop is still plugged in, stay disengaged
            return
        # Everything unplugged, block all action
        self._state = EstopState.NOT_PRESENT

    def _transition_from_not_present(self) -> None:
        if self._summary.engaged:
            # Estop plugged in and is ON, go to physically engaged
            self._state = EstopState.PHYSICALLY_ENGAGED
            return
        if self._summary.left_detected or self._summary.right_detected:
            # Plugged in and NOT on, go to Disengaged
            self._state = EstopState.DISENGAGED

    def _emit_event(self, prev_state: EstopState) -> None:
        """Broadcast a state change to all listeners."""
        event = EstopStateNotification(old_state=prev_state, new_state=self._state)
        for l in self._listeners:
            l(event)

    def _handle_state_transition(self, new_summary: EstopSummary) -> None:
        """Caches the new state summary and changes the _state variable."""
        self._summary = new_summary

        prev_state = self._state
        if self._state == EstopState.PHYSICALLY_ENGAGED:
            self._transition_from_physically_engaged()
        elif self._state == EstopState.DISENGAGED:
            self._transition_from_disengaged()
        elif self._state == EstopState.NOT_PRESENT:
            self._transition_from_not_present()

        if self._state != prev_state:
            self._emit_event(prev_state=prev_state)

    def get_physical_status(self, location: EstopAttachLocation) -> EstopPhysicalStatus:
        """Get the physical status of an attach location"""
        detected = (
            self._summary.left_detected
            if location == EstopAttachLocation.LEFT
            else self._summary.right_detected
        )

        if not detected:
            return EstopPhysicalStatus.NOT_PRESENT
        # Note that we actually *don't* have a way to check if an individual
        # estop is activated or not. But we can return Engaged or Disengaged
        # based on the global state.
        return (
            EstopPhysicalStatus.ENGAGED
            if self._summary.engaged
            else EstopPhysicalStatus.DISENGAGED
        )

"""opentrons.hardware_control.estop_state: module to manage estop state machine on OT-3."""

from typing import List, Optional

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
    HardwareEventUnsubscriber,
)


class EstopStateMachine:
    """Class to manage global Estop state."""

    def __init__(self, detector: Optional[EstopDetector]) -> None:
        """Create a new EstopStateMachine.

        If detector is None, the state machine will be initialized in
        a happy state (Disengaged, both estops detected) until it is
        hooked up to a valid detector.
        """
        self._detector: Optional[EstopDetector] = None
        self._state: EstopState = EstopState.DISENGAGED
        # Start off in a happy state until a detector is added
        self._summary = EstopSummary(
            left_detected=True, right_detected=True, engaged=False
        )
        if detector is not None:
            self.subscribe_to_detector(detector=detector)
        self._listeners: List[HardwareEventHandler] = []

    def subscribe_to_detector(self, detector: EstopDetector) -> None:
        """Configure the estop state machine to listen to a detector.

        This function will also transition the state based on the current
        status of the detector."""
        if self._detector is not None:
            self._detector.remove_listener(self.detector_listener)
        self._detector = detector
        detector.add_listener(listener=self.detector_listener)
        self._handle_state_transition(new_summary=detector.status)

    def __del__(self) -> None:
        if self._detector is not None:
            self._detector.remove_listener(self.detector_listener)

    def add_listener(self, listener: HardwareEventHandler) -> HardwareEventUnsubscriber:
        """Add a hardware event listener for estop event changes."""
        if listener not in self._listeners:
            self._listeners.append(listener)
            return lambda: self.remove_listener(listener)
        return lambda: None

    def remove_listener(self, listener: HardwareEventHandler) -> None:
        """Remove an existing hardware event listener for estop detector changes."""
        if listener in self._listeners:
            self._listeners.remove(listener)

    def detector_listener(self, summary: EstopSummary) -> None:
        """Callback from the detector."""
        self._handle_state_transition(new_summary=summary)

    @staticmethod
    def _transition_from_physically_engaged(summary: EstopSummary) -> EstopState:
        if not summary.engaged:
            # Estop disengaged, move to Logically Engaged
            return EstopState.LOGICALLY_ENGAGED
        return EstopState.PHYSICALLY_ENGAGED

    @staticmethod
    def _transition_from_disengaged(summary: EstopSummary) -> EstopState:
        if summary.engaged:
            # Estop engaged, move to physically engaged
            return EstopState.PHYSICALLY_ENGAGED
        if summary.left_detected or summary.right_detected:
            # An estop is still plugged in, stay disengaged
            return EstopState.DISENGAGED
        # Everything unplugged, block all action
        return EstopState.NOT_PRESENT

    @staticmethod
    def _transition_from_not_present(summary: EstopSummary) -> EstopState:
        if summary.engaged:
            # Estop plugged in and is ON, go to physically engaged
            return EstopState.PHYSICALLY_ENGAGED
        if summary.left_detected or summary.right_detected:
            # Plugged in and NOT on, go to Disengaged
            return EstopState.DISENGAGED
        return EstopState.NOT_PRESENT

    @staticmethod
    def _transition_from_logically_engaged(summary: EstopSummary) -> EstopState:
        if summary.engaged:
            # Estop was turned on, go back to physically engaged
            return EstopState.PHYSICALLY_ENGAGED
        return EstopState.LOGICALLY_ENGAGED

    def _emit_event(self, prev_state: EstopState) -> None:
        """Broadcast a state change to all listeners."""
        event = EstopStateNotification(old_state=prev_state, new_state=self._state)
        for listener in self._listeners:
            listener(event)

    def _handle_state_transition(self, new_summary: EstopSummary) -> None:
        """Caches the new state summary and changes the _state variable."""
        self._summary = new_summary

        prev_state = self._state

        self._state = {
            EstopState.PHYSICALLY_ENGAGED: self._transition_from_physically_engaged,
            EstopState.DISENGAGED: self._transition_from_disengaged,
            EstopState.NOT_PRESENT: self._transition_from_not_present,
            EstopState.LOGICALLY_ENGAGED: self._transition_from_logically_engaged,
        }[prev_state](new_summary)

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

    @property
    def state(self) -> EstopState:
        return self._state

    def acknowledge_and_clear(self) -> EstopState:
        """Acknowledge a `logically_engaged` status if relevant.

        If the current state is not LOGICALLY_ENGAGED, this does nothing.

        If the current state *is* LOGICALLY_ENGAGED, this will move to the
        correct return state (NOT_PRESENT or ENGAGED)"""
        if self._state == EstopState.LOGICALLY_ENGAGED:
            if self._summary.left_detected or self._summary.right_detected:
                self._state = EstopState.DISENGAGED
            else:
                self._state = EstopState.NOT_PRESENT
            self._emit_event(EstopState.LOGICALLY_ENGAGED)
        return self._state

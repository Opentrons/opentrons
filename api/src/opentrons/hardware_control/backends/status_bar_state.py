from opentrons.hardware_control.types import (
    StatusBarState,
    StatusBarUpdateEvent,
    StatusBarUpdateListener,
    StatusBarUpdateUnsubscriber,
)
from opentrons_hardware.hardware_control import status_bar
from opentrons_hardware.firmware_bindings.binary_constants import (
    LightAnimationType,
    LightTransitionType,
)

from typing import List


class StatusBarStateController:
    """Stateful control of the status bar.

    Note that the controller can be enabled/disabled at any time. If the controller
    is ever disabled, the lights are set to OFF and future state changes will not
    write to the rear panel board. However, the proper `StatusBarState` will still
    be cached, so if the controller becomes enabled/disabled in the future it will
    be able to resume the correct animation based on the current system state."""

    def __init__(self, controller: status_bar.StatusBar) -> None:
        """Create a StatusBarStateController."""
        self._status_bar_state = StatusBarState.IDLE
        self._controller = controller
        self._enabled = True
        self._listeners: List[StatusBarUpdateListener] = []

    def add_listener(
        self, listener: StatusBarUpdateListener
    ) -> StatusBarUpdateUnsubscriber:
        """Add a listener to the status bar state."""
        if listener not in self._listeners:
            self._listeners.append(listener)

        def _remove_listener() -> None:
            self._listeners.remove(listener)

        return _remove_listener

    def emit_event(self) -> None:
        """Emit an event to all listeners."""
        for listener in self._listeners:
            listener(StatusBarUpdateEvent(self._status_bar_state, self._enabled))

    async def _status_bar_idle(self) -> None:
        self._status_bar_state = StatusBarState.IDLE
        if self._enabled:
            await self._controller.static_color(status_bar.WHITE)

    async def _status_bar_running(self) -> None:
        self._status_bar_state = StatusBarState.RUNNING
        if self._enabled:
            await self._controller.static_color(status_bar.GREEN)

    async def _status_bar_paused(self) -> None:
        self._status_bar_state = StatusBarState.PAUSED
        if self._enabled:
            await self._controller.pulse_color(status_bar.BLUE)

    async def _status_bar_hardware_error(self) -> None:
        self._status_bar_state = StatusBarState.HARDWARE_ERROR
        if self._enabled:
            await self._controller.flash_color(status_bar.RED)

    async def _status_bar_software_error(self) -> None:
        self._status_bar_state = StatusBarState.SOFTWARE_ERROR
        if self._enabled:
            await self._controller.static_color(status_bar.YELLOW)

    async def _status_bar_error_recovery(self) -> None:
        self._status_bar_state = StatusBarState.ERROR_RECOVERY
        if self._enabled:
            await self._controller.pulse_color(status_bar.YELLOW)

    async def _status_bar_confirm(self) -> None:
        # Confirm should revert to IDLE
        self._status_bar_state = StatusBarState.IDLE
        if self._enabled:
            await self._controller.blink_once(status_bar.GREEN, status_bar.WHITE)

    async def _status_bar_run_complete(self) -> None:
        self._status_bar_state = StatusBarState.RUN_COMPLETED
        if self._enabled:
            await self._controller.pulse_color(status_bar.GREEN)

    async def _status_bar_updating(self) -> None:
        self._status_bar_state = StatusBarState.UPDATING
        if self._enabled:
            await self._controller.pulse_color(status_bar.WHITE)

    async def _status_bar_activation(self) -> None:
        # Activation should revert to IDLE
        self._status_bar_state = StatusBarState.IDLE

        # This animation uses an intermediate color between the blue and the white.
        # This results in a sort of light-blue effect.
        steps: List[status_bar.ColorStep] = [
            status_bar.ColorStep(LightTransitionType.linear, 250, status_bar.OFF),
            status_bar.ColorStep(LightTransitionType.linear, 750, status_bar.OFF),
            status_bar.ColorStep(LightTransitionType.linear, 1000, status_bar.BLUE),
            status_bar.ColorStep(
                LightTransitionType.linear,
                250,
                status_bar.Color(
                    r=0,
                    g=int(status_bar.BLUE.g * 0.75),
                    b=int(status_bar.BLUE.b * 0.75),
                    w=50,
                ),
            ),
            status_bar.ColorStep(LightTransitionType.linear, 250, status_bar.WHITE),
        ]

        if self._enabled:
            await self._controller.start_animation(
                steps=steps, type=LightAnimationType.single_shot
            )

    async def _status_bar_disco(self) -> None:
        # TODO - update implementation
        colors = [
            status_bar.GREEN,
            status_bar.YELLOW,
            status_bar.PURPLE,
            status_bar.ORANGE,
            status_bar.GREEN,
            status_bar.YELLOW,
            status_bar.PURPLE,
            status_bar.ORANGE,
            status_bar.WHITE,
        ]
        steps: List[status_bar.ColorStep] = [
            status_bar.ColorStep(LightTransitionType.linear, 300, color)
            for color in colors
        ]
        steps.append(
            status_bar.ColorStep(LightTransitionType.linear, 500, status_bar.OFF)
        )
        steps.append(
            status_bar.ColorStep(LightTransitionType.linear, 75, status_bar.BLUE)
        )
        steps.append(
            status_bar.ColorStep(
                LightTransitionType.instant,
                transition_time_ms=150,
                color=status_bar.GREEN,
            )
        )
        steps.append(
            status_bar.ColorStep(
                LightTransitionType.instant,
                transition_time_ms=150,
                color=status_bar.OFF,
            )
        )
        steps.append(
            status_bar.ColorStep(
                LightTransitionType.instant,
                transition_time_ms=150,
                color=status_bar.GREEN,
            )
        )
        steps.append(
            status_bar.ColorStep(
                LightTransitionType.linear,
                transition_time_ms=1000,
                color=status_bar.WHITE,
            )
        )

        self._status_bar_state = StatusBarState.IDLE
        if self._enabled:
            await self._controller.start_animation(
                steps=steps, type=LightAnimationType.single_shot
            )

    async def _status_bar_off(self) -> None:
        self._status_bar_state = StatusBarState.OFF
        if self._enabled:
            await self._controller.static_color(status_bar.OFF)

    async def set_status_bar_state(self, state: StatusBarState) -> None:
        """Main interface to set a new state."""
        callbacks = {
            StatusBarState.IDLE: self._status_bar_idle,
            StatusBarState.RUNNING: self._status_bar_running,
            StatusBarState.PAUSED: self._status_bar_paused,
            StatusBarState.HARDWARE_ERROR: self._status_bar_hardware_error,
            StatusBarState.SOFTWARE_ERROR: self._status_bar_software_error,
            StatusBarState.ERROR_RECOVERY: self._status_bar_error_recovery,
            StatusBarState.CONFIRMATION: self._status_bar_confirm,
            StatusBarState.RUN_COMPLETED: self._status_bar_run_complete,
            StatusBarState.UPDATING: self._status_bar_updating,
            StatusBarState.ACTIVATION: self._status_bar_activation,
            StatusBarState.DISCO: self._status_bar_disco,
            StatusBarState.OFF: self._status_bar_off,
        }
        await callbacks[state]()
        self.emit_event()

    def get_current_state(self) -> StatusBarState:
        """Get the current state."""
        return self._status_bar_state

    async def set_enabled(self, enabled: bool) -> None:
        """Enable or disable the status bar.

        If the status bar is newly disabled, the lights are set OFF
        and the old status is cached so it can later be restored.

        If the status bar is newly enabled, the last-set animation
        will be sent to the rear panel.

        NOTE When the status bar is disabled, `set_status_bar_state` will
        still update the internal status bar setting as if the bar is on!
        This means that, when the status bar is reenabled, it will look
        correct for the current robot status."""
        if enabled == self._enabled:
            return

        if enabled:
            # Need to turn Enabled true *first* so that we can actually write
            # the setting to the rear panel
            self._enabled = True
            await self.set_status_bar_state(self._status_bar_state)
        else:
            cached_state = self.get_current_state()
            await self.set_status_bar_state(StatusBarState.OFF)
            self._enabled = False
            # This ensures that the status bar will be set to the correct state
            # if it's reactivated before the state gets set again.
            self._status_bar_state = cached_state

    def get_enabled(self) -> bool:
        """Check whether the status bar is enabled."""
        return self._enabled

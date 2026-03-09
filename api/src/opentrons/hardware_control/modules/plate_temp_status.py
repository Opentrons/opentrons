from collections import deque
from typing import Deque

from opentrons.drivers.types import PlateTemperature
from opentrons.hardware_control.modules.types import TemperatureStatus


class PlateTemperatureStatus:

    TEMP_THRESHOLD = 0.3
    """The threshold under which the difference between target and temperature
    is considered `holding`."""

    MIN_SAMPLES_UNDER_THRESHOLD = 10
    """The number of temperature samples needed before determining that the
    temperature is `holding`"""

    def __init__(self) -> None:
        """Construct."""
        self._temp_history: Deque[float] = deque(
            maxlen=self.MIN_SAMPLES_UNDER_THRESHOLD
        )
        self._status = TemperatureStatus.ERROR

    @property
    def status(self) -> TemperatureStatus:
        """Return the current status."""
        return self._status

    def update(self, temperature: PlateTemperature) -> TemperatureStatus:
        """Update the status based on the temperature."""
        # Add to history
        self._temp_history.append(temperature.current)

        if temperature.target is None:
            _status = TemperatureStatus.IDLE
        else:
            diff = temperature.target - temperature.current
            if self._is_holding_at_target(temperature.target, self._temp_history):
                _status = TemperatureStatus.HOLDING
            elif diff < 0:
                _status = TemperatureStatus.COOLING
            else:
                _status = TemperatureStatus.HEATING
        self._status = _status
        return self._status

    @staticmethod
    def _is_holding_at_target(target: float, history: Deque[float]) -> bool:
        """
        Checks block temp history to determine if block temp has stabilized at
        the target temperature. Returns true only if all values in history are
        within threshold range of target temperature.
        """
        if len(history) < PlateTemperatureStatus.MIN_SAMPLES_UNDER_THRESHOLD:
            # Not enough temp history
            return False
        else:
            return all(
                abs(target - t) < PlateTemperatureStatus.TEMP_THRESHOLD for t in history
            )

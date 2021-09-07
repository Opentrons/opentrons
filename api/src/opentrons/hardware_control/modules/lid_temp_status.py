from opentrons.drivers.types import Temperature
from opentrons.hardware_control.modules.types import TemperatureStatus


class LidTemperatureStatus:
    """A wrapper for the lid temperature status."""

    TEMP_THRESHOLD = 0.3
    """The threshold under which the difference between target and temperature
    is considered `holding`."""

    def __init__(self) -> None:
        """Construct."""
        self._status = TemperatureStatus.ERROR

    @property
    def status(self) -> TemperatureStatus:
        """Return the current status."""
        return self._status

    def update(self, temperature: Temperature) -> TemperatureStatus:
        """Update the status based on the temperature."""
        if temperature.target is None:
            status = TemperatureStatus.IDLE
        else:
            diff = temperature.target - temperature.current
            if abs(diff) < self.TEMP_THRESHOLD:
                status = TemperatureStatus.HOLDING
            elif diff < 0:
                # TC lid can't actively cool
                status = TemperatureStatus.IDLE
            else:
                status = TemperatureStatus.HEATING
        self._status = status
        return self._status

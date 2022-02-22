"""Protocol API interface for Heater-Shaker Modules."""

from ..errors import (
    InvalidTargetTemperatureError,
    InvalidTargetSpeedError,
)

TEMPERATURE_LOWER_LIMIT = 37
TEMPERATURE_UPPER_LIMIT = 95
SPEED_LOWER_LIMIT = 200
# TODO (spp, 2022-2-22): User requirements doc states 2000rpm as limit but
#  the module is capable of going up to 3000rpm. Do we limit the API to 2000rpm?
SPEED_UPPER_LIMIT = 3000


class HeaterShakerModuleContext:
    # TODO(spp, 2022-02-15): Revise this when writing other module contexts' docstrings.
    """Object representing a connected Heater-Shaker Module.

    It should not be instantiated directly; instead, it should be created through
    :py:meth:`.ProtocolContext.load_module`.
    """

    def __init__(self, module_id: str) -> None:
        self._module_id = module_id

    @property
    def max_shake_speed(self) -> int:
        """Maximum allowed shake speed of the module."""
        return SPEED_UPPER_LIMIT

    @property
    def min_shake_speed(self) -> int:
        """Minimum allowed shake speed of the module."""
        return SPEED_LOWER_LIMIT

    @property
    def max_temperature(self) -> float:
        """Maximum allowed temperature of the module."""
        return TEMPERATURE_UPPER_LIMIT

    @property
    def min_temperature(self) -> float:
        """Minimum allowed temperature of the module."""
        return TEMPERATURE_LOWER_LIMIT

    def start_set_temperature(self, celsius: float) -> None:
        """Set the target temperature of heater-shaker and return immediately.

        This method takes a target temperature between 37C & 95C and tells
        the heater-shaker to start heating to the target temperature without waiting
        for the heater-shaker to reach the target.
        Use :py:meth:`await_temperature` to wait for the temperature set here.

        Raises:
            InvalidTargetTemperatureError: target temperature out of limits.
        """
        if not TEMPERATURE_LOWER_LIMIT <= celsius <= TEMPERATURE_UPPER_LIMIT:
            raise InvalidTargetTemperatureError(
                f"Temperature should be in range {TEMPERATURE_LOWER_LIMIT} to "
                f"{TEMPERATURE_UPPER_LIMIT} degree celsius."
            )
        raise NotImplementedError()

    def await_temperature(self) -> None:
        """Wait for the heater-shaker to reach its target temperature.

        Use :py:meth:`start_set_temperature` to set the target temperature first.
        Note that since the heater-shaker does not have active cooling, waiting for
        a temperature that is lower than the current temperature will take some time
        and the protocol will be blocked during all that time.

        Raises:
            NoTargetTemperatureError: If heater-shaker has no target temperature.
        """
        raise NotImplementedError()

    def stop_heating(self) -> None:
        """Stop heating."""
        raise NotImplementedError()

    def set_shake_speed(self, rpm: int) -> None:
        f"""Set shake speed in RPM and start shaking.

        Latches the labware, starts shaking the plate and returns once the target
        shake speed has reached.
        Acceptable shake speed: {SPEED_LOWER_LIMIT} - {SPEED_UPPER_LIMIT} RPM

        Raises:
            InvalidTargetSpeedError: if target speed out of limits.
        """
        if not SPEED_LOWER_LIMIT <= rpm <= SPEED_UPPER_LIMIT:
            raise InvalidTargetSpeedError(
                f"Speed should be in range {SPEED_LOWER_LIMIT} - {SPEED_UPPER_LIMIT}"
                f"RPM."
            )
        raise NotImplementedError()

    def stop_shake(self) -> None:
        """Stop shaking."""
        raise NotImplementedError()

    def __eq__(self, other: object) -> bool:
        """Compare for object equality using identifier string."""
        return (
            isinstance(other, HeaterShakerModuleContext)
            and self._module_id == other._module_id
        )

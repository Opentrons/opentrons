"""Python Protocol API v3 errors."""
# TODO(mc, 2021-04-22): assign unique codes to all these errors
# TODO(mc, 2021-04-22): explore how ProtocolEngine and ProtocolAPI errors
# interact and combine
from typing import Optional
from opentrons.protocol_engine.errors import LabwareIsNotTipRackError


class InvalidPipetteNameError(ValueError):
    """Error raised if an invalid pipette name is used."""

    def __init__(self, invalid_value: str) -> None:
        """Initialize the error and message with the invalid value."""
        super().__init__(f"{invalid_value} is not a valid pipette name.")
        self.invalid_value = invalid_value


class InvalidMountError(ValueError):
    """Error raised if an invalid mount is used."""

    def __init__(self, invalid_value: str) -> None:
        """Initialize the error and message with the invalid value."""
        super().__init__(f"{invalid_value} is not a valid mount.")
        self.invalid_value = invalid_value


class InvalidModuleLocationError(ValueError):
    """Error raised if a load location for a module is invalid."""

    def __init__(self, invalid_value: Optional[str], module_name: str) -> None:
        """Initialize the error and message with the invalid value."""
        super().__init__(
            f"{invalid_value} is not a valid load location for {module_name}."
        )
        self.invalid_value = invalid_value
        self.module_name = module_name


class InvalidMagnetEngageHeightError(ValueError):
    """Error raised if a Magnetic Module engage height is invalid."""


class InvalidTargetTemperatureError(ValueError):
    """Error raised if a module with heating abilities gets an invalid target temperature."""


class NoTargetTemperatureError(ValueError):
    """Error raised if awaiting temperature without setting a target temperature."""


class InvalidTargetSpeedError(ValueError):
    """Error raised if a Heater-Shaker target speed is invalid."""


__all__ = [
    # re-exports from opentrons.protocol_engine
    "LabwareIsNotTipRackError",
    # exports specific to the Protocol API layer
    "InvalidPipetteNameError",
    "InvalidMountError",
    "InvalidModuleLocationError",
    "InvalidMagnetEngageHeightError",
    "InvalidTargetTemperatureError",
    "InvalidTargetSpeedError",
]

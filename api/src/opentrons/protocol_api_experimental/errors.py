"""Python Protocol API v3 errors."""
# TODO(mc, 2021-04-22): assign unique codes to all these errors
# TODO(mc, 2021-04-22): explore how ProtocolEngine and ProtocolAPI errors
# interact and combine
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


__all__ = [
    # re-exports from opentrons.protocol_engine
    "LabwareIsNotTipRackError",
    # exports specific to the Protocol API layer
    "InvalidPipetteNameError",
    "InvalidMountError",
]

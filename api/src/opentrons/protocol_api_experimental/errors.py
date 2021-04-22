"""Python Protocol API v3 errors."""
# TODO(mc, 2021-04-22): assign unique codes to all these errors


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

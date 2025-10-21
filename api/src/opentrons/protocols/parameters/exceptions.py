from typing import Optional, Dict, Sequence

from opentrons_shared_data.errors import GeneralError, EnumeratedError, ErrorCodes


class RuntimeParameterRequired(GeneralError):
    """An error raised when a parameter is required to be set for full analysis."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, str]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build an RuntimeParameterRequired."""
        super().__init__(
            ErrorCodes.RUNTIME_PARAMETER_VALUE_REQUIRED, message, detail, wrapping
        )


class ParameterValueError(ValueError):
    """An error raised when a parameter value is not valid."""


class ParameterDefinitionError(ValueError):
    """An error raised when a parameter definition value is not valid."""


class ParameterNameError(ValueError):
    """An error raised when a parameter name or description is not valid."""


class IncompatibleParameterError(ValueError):
    """An error raised when a parameter conflicts with another parameter."""

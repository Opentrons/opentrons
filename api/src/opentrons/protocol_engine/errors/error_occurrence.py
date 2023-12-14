"""Models for concrete occurrences of specific errors."""
from logging import getLogger

from datetime import datetime
from typing import Any, Dict, List, Type, Union, Optional, Sequence
from pydantic import BaseModel, Field
from opentrons_shared_data.errors.codes import ErrorCodes
from .exceptions import ProtocolEngineError
from opentrons_shared_data.errors.exceptions import EnumeratedError

log = getLogger(__name__)


# TODO(mc, 2021-11-12): flesh this model out with structured error data
# for each error type so client may produce better error messages
class ErrorOccurrence(BaseModel):
    """An occurrence of a specific error during protocol execution."""

    @classmethod
    def from_failed(
        cls: Type["ErrorOccurrence"],
        id: str,
        createdAt: datetime,
        error: Union[ProtocolEngineError, EnumeratedError],
    ) -> "ErrorOccurrence":
        """Build an ErrorOccurrence from the details available from a FailedAction or FinishAction."""
        if isinstance(error, ProtocolCommandFailedError) and error.original_error:
            wrappedErrors = [error.original_error]
        else:
            wrappedErrors = [
                cls.from_failed(id, createdAt, err) for err in error.wrapping
            ]
        return cls.construct(
            id=id,
            createdAt=createdAt,
            errorType=type(error).__name__,
            detail=error.message or str(error),
            errorInfo=error.detail,
            errorCode=error.code.value.code,
            wrappedErrors=wrappedErrors,
        )

    id: str = Field(..., description="Unique identifier of this error occurrence.")
    createdAt: datetime = Field(..., description="When the error occurred.")

    errorCode: str = Field(
        default=ErrorCodes.GENERAL_ERROR.value.code,
        description=(
            "An enumerated error code for the error type."
            " This is intended to be shown to the robot operator to direct them to the"
            " correct rough area for troubleshooting."
        ),
    )

    # TODO(mm, 2023-09-07):
    # The Opentrons App and Flex ODD use `errorType` in the title of error modals, but it's unclear
    # if they should. Is this field redundant now that we have `errorCode` and `detail`?
    #
    # In practice, this is often the source code name of our Python exception type.
    # Should we derive this from `errorCode` instead? Like how HTTP code 404 is always "not found."
    errorType: str = Field(
        ...,
        description=(
            "A short name for the error type that occurred, like `PipetteOverpressure`."
            " This can be a bit more specific than `errorCode`."
        ),
    )

    detail: str = Field(
        ...,
        description=(
            "A short human-readable message about the error."
            "\n\n"
            "This is intended to provide the robot operator with more specific details than"
            " `errorCode` alone. It should be no longer than a couple of sentences,"
            " and it should not contain internal newlines or indentation."
            "\n\n"
            " It should not internally repeat `errorCode`, but it may internally repeat `errorType`"
            " if it helps the message make sense when it's displayed in its own separate block."
        ),
    )

    errorInfo: Dict[str, str] = Field(
        default={},
        description=(
            "Specific details about the error that may be useful for determining cause."
            " This might contain the same information as `detail`, but in a more structured form."
            " It might also contain additional information that was too verbose or technical"
            " to put in `detail`."
        ),
    )

    wrappedErrors: List["ErrorOccurrence"] = Field(
        default=[], description="Errors that may have caused this one."
    )

    class Config:
        """Customize configuration for this model."""

        @staticmethod
        def schema_extra(schema: Dict[str, Any], model: object) -> None:
            """Append the schema to make the errorCode appear required.

            `errorCode`, `wrappedErrors`, and `errorInfo` have defaults because they are not included in earlier
            versions of this model, _and_ this model is loaded directly from
            the on-robot store. That means that, without a default, it will
            fail to parse. Once a default is defined, the automated schema will
            mark this as a non-required field, which is misleading as this is
            a response from the server to the client and it will always have an
            errorCode defined. This hack is required because it informs the client
            that it does not, in fact, have to account for a missing errorCode, wrappedError, or errorInfo.
            """
            schema["required"].extend(["errorCode", "wrappedErrors", "errorInfo"])


# TODO (tz, 7-12-23): move this to exceptions.py when we stop relaying on ErrorOccurrence.
class ProtocolCommandFailedError(ProtocolEngineError):
    """Raised if a fatal command execution error has occurred."""

    def __init__(
        self,
        original_error: Optional[ErrorOccurrence] = None,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a ProtocolCommandFailedError."""
        super().__init__(ErrorCodes.GENERAL_ERROR, message, details, wrapping)
        self.original_error = original_error


ErrorOccurrence.update_forward_refs()

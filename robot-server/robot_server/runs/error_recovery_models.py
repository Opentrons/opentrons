"""Request and response models for dealing with error recovery policies."""
from enum import Enum
from pydantic import BaseModel, Field


class valueMatchType(str, Enum):
    """The type of the error recovery setting.

    * `"ignore-and-continue"`: Ignore this error and future errors of the same type.
    * `"fail-run"`: Errors of this type should fail the run.
    * `"wait-for-recovery"`: Instances of this error should initiate a recover operation.

    """

    IGNORE_AND_CONTINUE = "ignore-and-continue"
    FAIL_RUN = "fail-run"
    WAIT_FOR_RECOVERY = "wait-for-recovery"


class ErrorRecoveryRule(BaseModel):
    """Request model for new error recovery rule creation."""

    commandType: str = Field(
        ..., description="The command type that this rule applies to."
    )
    errorType: str = Field(..., description="The error type that this rule applies to.")
    ifMatch: valueMatchType = Field(
        ...,
        description="The specific recovery setting that will be in use if the type parameters match.",
    )

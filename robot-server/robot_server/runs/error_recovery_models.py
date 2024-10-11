"""Request and response models for dealing with error recovery policies."""
from enum import Enum
from typing import List

from pydantic import BaseModel, Field

# There's a lot of nested classes here.
# Here's an example of a JSON document that this code models:
# {
#   "policyRules": [
#     {
#       "matchCriteria": {
#         "command": {
#           "commandType": "foo",
#           "error": {
#             "errorType": "bar"
#           }
#         }
#       },
#       "ifMatch": "ignoreAndContinue"
#     }
#   ]
# }


class ReactionIfMatch(Enum):
    """How to handle a given error.

    * `"ignoreAndContinue"`: Ignore this error and continue with the next command.
    * `"failRun"`: Fail the run.
    * `"waitForRecovery"`: Enter interactive error recovery mode.

    """

    IGNORE_AND_CONTINUE = "ignoreAndContinue"
    FAIL_RUN = "failRun"
    WAIT_FOR_RECOVERY = "waitForRecovery"


class ErrorMatcher(BaseModel):
    """The error type that this rule applies to."""

    errorType: str = Field(..., description="The error type that this rule applies to.")


class CommandMatcher(BaseModel):
    """Command/error data used for matching rules."""

    commandType: str = Field(
        ..., description="The command type that this rule applies to."
    )
    error: ErrorMatcher = Field(
        ..., description="The error details that this rule applies to."
    )


class MatchCriteria(BaseModel):
    """The criteria that this rule will attempt to match."""

    command: CommandMatcher = Field(
        ..., description="The command and error types that this rule applies to."
    )


class ErrorRecoveryRule(BaseModel):
    """Model for new error recovery rule."""

    matchCriteria: MatchCriteria = Field(
        ...,
        description="The criteria that must be met for this rule to be applied.",
    )
    ifMatch: ReactionIfMatch = Field(
        ...,
        description="How to handle errors matched by this rule.",
    )


class ErrorRecoveryPolicy(BaseModel):
    """Request/Response model for new error recovery policy rules creation."""

    policyRules: List[ErrorRecoveryRule] = Field(
        ...,
        description=(
            "A list of error recovery rules to apply for a run's recovery management."
            " The rules are evaluated first-to-last."
            " The first exact match will dictate recovery management."
        ),
    )

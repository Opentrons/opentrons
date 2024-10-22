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
    """How to handle a matching error.

    * `"failRun"`: Fail the run.

    * `"waitForRecovery"`: Enter interactive error recovery mode. You can then
      perform error recovery with `POST /runs/{id}/commands` and exit error
      recovery mode with `POST /runs/{id}/actions`.

    * `"assumeFalsePositiveAndContinue"`: Continue the run without interruption, acting
      as if the error was a false positive.

      This is equivalent to doing `"waitForRecovery"`
      and then sending `actionType: "resume-from-recovery-assuming-false-positive"`
      to `POST /runs/{id}/actions`, except this requires no ongoing intervention from
      the client.

    * `"ignoreAndContinue"`: Continue the run without interruption, accepting whatever
      state the error left the robot in.

      This is equivalent to doing `"waitForRecovery"`
      and then sending `actionType: "resume-from-recovery"` to `POST /runs/{id}/actions`,
      except this requires no ongoing intervention from the client.

      This is probably not useful very often because it's likely to cause downstream
      errors—imagine trying an `aspirate` command after a failed `pickUpTip` command.
      This is provided for symmetry.
    """

    FAIL_RUN = "failRun"
    WAIT_FOR_RECOVERY = "waitForRecovery"
    ASSUME_FALSE_POSITIVE_AND_CONTINUE = "assumeFalsePositiveAndContinue"
    # todo(mm, 2024-10-22): "ignoreAndContinue" may be a misnomer now: is
    # "assumeFalsePositiveAndContinue" not also a way to "ignore"? Consider renaming.
    IGNORE_AND_CONTINUE = "ignoreAndContinue"


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
    ifMatch: ReactionIfMatch


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

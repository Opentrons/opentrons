"""Request and response models for controlling runs with actions."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResourceModel


class RunActionType(str, Enum):
    """The type of the run control action, which determines behavior.

    * `"play"`: Start the run, or resume it after it's been paused.

    * `"pause"`: Pause the run.

    * `"stop"`: Stop (cancel) the run.

    * `"resume-from-recovery"`: Resume normal protocol execution after the run was in
      error recovery mode. Continue from however the last command left the robot.

    * `"resume-from-recovery-assuming-false-positive"`: Resume normal protocol execution
      after the run was in error recovery mode. Act as if the underlying error was a
      false positive.

    To see the difference between `"resume-from-recovery"` and
    `"resume-from-recovery-assuming-false-positive"`, suppose we've just entered error
    recovery mode after a `commandType: "pickUpTip"` command failed with an
    `errorType: "tipPhysicallyMissing"` error. That normally leaves the robot thinking
    it has no tip attached. If you use `"resume-from-recovery"`, the robot will run
    the next protocol command from that state, acting as if there's no tip attached.
    (This may cause another error, if the next command needs a tip.)
    Whereas if you use `"resume-from-recovery-assuming-false-positive"`,
    the robot will try to nullify the error, thereby acting as if it *does* have a tip
    attached.

    Generally:

    * If you've tried to recover from the error by sending your own `intent: "fixit"`
      commands to `POST /runs/{id}/commands`, use `"resume-from-recovery"`. It's your
      responsibility to ensure your `POST`ed commands leave the robot in a good-enough
      state to continue with the protocol.

    * Otherwise, use `"resume-from-recovery-assuming-false-positive"`.

    Do not combine `intent: "fixit"` commands with
    `"resume-from-recovery-assuming-false-positive"`—the robot's built-in
    false-positive recovery may compete with your own.
    """

    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"
    RESUME_FROM_RECOVERY = "resume-from-recovery"
    RESUME_FROM_RECOVERY_ASSUMING_FALSE_POSITIVE = (
        "resume-from-recovery-assuming-false-positive"
    )


class RunActionCreate(BaseModel):
    """Request model for new control action creation."""

    actionType: RunActionType


class RunAction(ResourceModel):
    """Run control action model.

    A RunAction resource represents a client-provided command to
    the run in order to control the execution of the run itself.

    This is different than a protocol command, which represents an individual
    robotic procedure to execute as part of a protocol.
    """

    id: str = Field(..., description="A unique identifier to reference the command.")
    createdAt: datetime = Field(..., description="When the command was created.")
    actionType: RunActionType

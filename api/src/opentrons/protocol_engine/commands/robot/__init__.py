"""Robot movement commands."""

from .close_gripper_jaw import (
    CloseGripperJaw,
    CloseGripperJawCommandType,
    CloseGripperJawCreate,
    CloseGripperJawParams,
    CloseGripperJawResult,
)
from .move_axes_relative import (
    MoveAxesRelative,
    MoveAxesRelativeCommandType,
    MoveAxesRelativeCreate,
    MoveAxesRelativeParams,
    MoveAxesRelativeResult,
)
from .move_axes_to import (
    MoveAxesTo,
    MoveAxesToCommandType,
    MoveAxesToCreate,
    MoveAxesToParams,
    MoveAxesToResult,
)
from .move_to import (
    MoveTo,
    MoveToCommandType,
    MoveToCreate,
    MoveToParams,
    MoveToResult,
)
from .open_gripper_jaw import (
    OpenGripperJaw,
    OpenGripperJawCommandType,
    OpenGripperJawCreate,
    OpenGripperJawParams,
    OpenGripperJawResult,
)

__all__ = [
    # robot/moveTo
    "MoveTo",
    "MoveToCreate",
    "MoveToParams",
    "MoveToResult",
    "MoveToCommandType",
    # robot/moveAxesTo
    "MoveAxesTo",
    "MoveAxesToCreate",
    "MoveAxesToParams",
    "MoveAxesToResult",
    "MoveAxesToCommandType",
    # robot/moveAxesRelative
    "MoveAxesRelative",
    "MoveAxesRelativeCreate",
    "MoveAxesRelativeParams",
    "MoveAxesRelativeResult",
    "MoveAxesRelativeCommandType",
    # robot/openGripperJaw
    "OpenGripperJaw",
    "OpenGripperJawCreate",
    "OpenGripperJawParams",
    "OpenGripperJawResult",
    "OpenGripperJawCommandType",
    # robot/closeGripperJaw
    "CloseGripperJaw",
    "CloseGripperJawCreate",
    "CloseGripperJawParams",
    "CloseGripperJawResult",
    "CloseGripperJawCommandType",
]

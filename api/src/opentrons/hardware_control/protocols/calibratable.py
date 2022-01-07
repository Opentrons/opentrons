from typing_extensions import Protocol

from ..robot_calibration import RobotCalibration
from ..util import DeckTransformState


class Calibratable(Protocol):
    """Protocol specifying calibration information"""

    @property
    def robot_calibration(self) -> RobotCalibration:
        """The currently-active robot calibration of the machine."""
        ...

    def reset_robot_calibration(self) -> None:
        """Reset the active robot calibration to the machine default.

        This may be an identity on some machines but not on others; this
        method is therefore preferred to using set_robot_calibration() with a
        caller-constructed identity.
        """
        ...

    def set_robot_calibration(self, robot_calibration: RobotCalibration) -> None:
        """Set the current robot calibration from stored data."""
        ...

    def validate_calibration(self) -> DeckTransformState:
        """Check whether the current calibration is valid."""
        ...

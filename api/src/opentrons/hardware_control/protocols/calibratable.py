from typing_extensions import Protocol
from .types import CalibrationType

from ..util import DeckTransformState


class Calibratable(Protocol[CalibrationType]):
    """Protocol specifying calibration information"""

    @property
    def robot_calibration(self) -> CalibrationType:
        """The currently-active robot calibration of the machine."""
        ...

    def reset_robot_calibration(self) -> None:
        """Reset the active robot calibration to the machine default.

        This may be an identity on some machines but not on others; this
        method is therefore preferred to using set_robot_calibration() with a
        caller-constructed identity.
        """
        ...

    def reset_deck_calibration(self) -> None:
        """Resets only deck calibration data."""
        ...

    def load_deck_calibration(self) -> None:
        """Loads only any deck calibration data that is stored."""
        ...

    def set_robot_calibration(self, robot_calibration: CalibrationType) -> None:
        """Set the current robot calibration from stored data."""
        ...

    def validate_calibration(self) -> DeckTransformState:
        """Check whether the current calibration is valid."""
        ...

    def build_temporary_identity_calibration(self) -> CalibrationType:
        """
        Get temporary default calibration data suitable for use during
        calibration
        """
        ...

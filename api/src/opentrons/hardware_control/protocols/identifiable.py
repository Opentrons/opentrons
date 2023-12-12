from typing_extensions import Protocol

from .types import ProtocolRobotType


class Identifiable(Protocol[ProtocolRobotType]):
    """Protocol specifying support for hardware identification."""

    def get_robot_type(self) -> ProtocolRobotType:
        """Return the enumerated robot type that this API controls.

        When a caller needs to determine whether an API function is expected
        to be present on a hardware_control instance, it is preferable to check
        with this function rather than check the exact type via `isinstance`.
        """
        ...

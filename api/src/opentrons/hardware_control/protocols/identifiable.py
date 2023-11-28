from typing_extensions import Protocol
from opentrons_shared_data.robot.dev_types import RobotTypeEnum


class Identifiable(Protocol):
    """Protocol specifying support for hardware identification."""

    def get_robot_type(self) -> RobotTypeEnum:
        """Return the enumerated robot type that this API controls.

        When a caller needs to determine whether an API function is expected
        to be present on a hardware_control instance, it is preferable to check
        with this function rather than check the exact type via `isinstance`.
        """
        ...

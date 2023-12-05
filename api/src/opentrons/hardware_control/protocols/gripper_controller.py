"""Protocol specifying API gripper control."""
from typing import Optional
from typing_extensions import Protocol

from opentrons.hardware_control.dev_types import GripperDict


class GripperController(Protocol):
    """A protocol specifying gripper API functions."""

    async def grip(
        self, force_newtons: Optional[float] = None, stay_engaged: bool = True
    ) -> None:
        ...

    async def ungrip(self, force_newtons: Optional[float] = None) -> None:
        """Release gripped object.

        To simply open the jaw, use `home_gripper_jaw` instead.
        """
        ...

    async def idle_gripper(self) -> None:
        """Move gripper to its idle, gripped position."""
        ...

    def gripper_jaw_can_home(self) -> bool:
        """Check if it is valid to home the gripper jaw.

        This should return False if the API believes that the gripper is
        currently holding something.
        """
        ...

    @property
    def attached_gripper(self) -> Optional[GripperDict]:
        """Get a dict of all attached grippers."""
        ...

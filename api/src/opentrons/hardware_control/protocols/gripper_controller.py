"""Protocol specifying API gripper control."""
from typing import Optional
from typing_extensions import Protocol


class GripperController(Protocol):
    """A protocol specifying gripper API functions.

    All functions other than `has_gripper` may be unimplemented on some systems
    due to a lack of gripper support.
    """

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

from typing import Dict, Optional

from typing_extensions import Protocol

from ..types import Axis, HardwareSystemInfo, SubSystem, SubSystemState


class HardwareManager(Protocol):
    """Protocol specifying access to configuration plane elements of hardware."""

    async def get_hw_details(self) -> HardwareSystemInfo:
        """Get the hardware information of the system.

        Present system-level version and revision information.
        """
        ...

    def get_fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.
        """
        ...

    @property
    def fw_version(self) -> str:
        """
        Return the firmware version of the connected hardware.

        The version is a string retrieved directly from the attached hardware
        (or possibly simulator).

        Do not use this in a remote call; prefer get_hw_details.
        """
        ...

    @property
    def board_revision(self) -> str:
        """
        Return the revision of the central hardware.

        Do not use this in a remote call; prefer get_hw_details.
        """
        ...

    @property
    def attached_subsystems(self) -> Dict[SubSystem, SubSystemState]:
        """
        Get a view of the hardware subsystems currently attached to the machine.

        These subsystems are the programmable parts that underly and provide things like motion
        control and instruments. Depending on the machine, different subsystems may be available.
        In general, callers should not use the presence or absence of a specific subsystem to decide
        whether or not the hardware is operating properly.
        """
        ...

    async def get_serial_number(self) -> Optional[str]:
        """Get the robot serial number, if provisioned. If not provisioned, will be None.

        Do not use this in a remote call; prefer get_hw_details.
        """
        ...

    def axis_is_present(self, axis: Axis) -> bool:
        """Get whether a motor axis is present on the machine."""
        ...

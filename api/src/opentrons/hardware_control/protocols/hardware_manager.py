from typing_extensions import Protocol


class HardwareManager(Protocol):
    """Protocol specifying access to configuration plane elements of hardware."""

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
        """
        ...

    @property
    def board_revision(self) -> str:
        """
        Return the revision of the central hardware.
        """
        ...

"""Models for disk monitors."""

from pydantic import BaseModel, Field


class DiskDetails(BaseModel):
    """System disk usage details."""

    systemAvailableMb: float = Field(
        ..., description="The system's available disk space in MB."
    )
    systemTotalMb: float = Field(
        ..., description="The total disk space of the /data partition in MB."
    )
    imagesDirectorySizeMb: float = Field(
        ..., description="The system's images directory disk size in MB."
    )
    runStartLimitFreeSpaceMb: float = Field(
        ...,
        description="The amount of free disk space below which runs will not start.",
    )
    isDiskSpaceBelowRunStartLimit: bool = Field(
        ...,
        description="True if a run cannot currently be started because the robot is low on disk space.",
    )

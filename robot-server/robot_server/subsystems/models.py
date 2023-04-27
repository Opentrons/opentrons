"""Request and response models for /subsystems endpoints."""

import enum
from typing_extensions import Literal
from typing import Optional, TypeVar, Union, Generic, cast
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control.types import SubSystem

class PresentSubsystem(BaseModel):
    """Model for the status of a subsystem."""
    name: str = Field(..., description='The name of a connected subsystem.')
    ok: bool = Field(..., description='Whether the subsystem is running, up to date, and in a normal state.')
    current_fw_version: str = Field(..., description='The current version of firmware the subsystem is running.')
    next_fw_version: str = Field(..., description='What firmware version a prospective update would leave the subsystem running.')
    fw_update_needed: bool = Field(..., description='True if a client should begin an update for this subsystem.')
    revision: str = Field(..., description='A descriptor of the hardware revision of the subsystem.')


class UpdateProgressData(BaseModel):
    """Model for status of firmware update progress."""

    id: str = Field(..., description="Unique ID for the update process.")
    createdAt: datetime = Field(..., description="When the update was posted.")
    subsystem: str = Field(..., description="The subsystem that is being updated.")
    updateStatus: UpdateState = Field(
        ..., description="Whether an update is queued, in progress or completed. "
    )
    updateProgress: int = Field(
        ..., description="Progress of the update depicted as an integer from 0 to 100."
    )

class UpdateProgressSummary(BaseModel):
    """Model for a quick summary of an update's progress."""
    id: str = Field(..., description="Unique ID for the update process.")
    createdAt: str = Field(..., description="When the update was posted.")
    subsystem: str = Field(..., descripiton="The subsystem that is being updated.")
    updateStatus: UpdateState = Field(
        ..., description="Whether an update is queued, in progress or completed"
    )

class UpdateCreate(BaseModel):
    """Request data for updating instruments."""

    mount: MountTypesStr = Field(..., description="Mount of the instrument to update.")

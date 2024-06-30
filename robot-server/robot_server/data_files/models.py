"""Data files models."""
from datetime import datetime

from pydantic import Field

from robot_server.service.json_api import ResourceModel


class DataFile(ResourceModel):
    """A model representing an uploaded data file."""

    id: str = Field(..., description="A unique identifier for this file.")
    name: str = Field(..., description="Name of the uploaded file.")
    createdAt: datetime = Field(..., description="When this data file was *uploaded*.")

"""Models for /system/oem_mode."""

from pydantic import BaseModel, Field


class EnableOEMMode(BaseModel):
    """Enable OEM Mode model."""

    enable: bool = Field(..., description="Enable or Disable OEM Mode.")

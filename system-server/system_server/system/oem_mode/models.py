"""Models for /system/oem_mode."""

from typing import Annotated

from pydantic import BaseModel, Field


class EnableOEMMode(BaseModel):
    """Enable OEM Mode model."""

    enable: Annotated[bool, Field(description="Enable or Disable OEM Mode.")]

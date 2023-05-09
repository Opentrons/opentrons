"""Models for /system/register."""

from pydantic import BaseModel, Field


class PostRegisterResponse(BaseModel):
    """Model for the response to POST /system/register."""

    token: str = Field(..., description="the registration token")

"""Models for /system/register."""

from typing import Annotated

from pydantic import BaseModel, Field


class PostRegisterResponse(BaseModel):
    """Model for the response to POST /system/register."""

    token: Annotated[str, Field(description="the registration token")]

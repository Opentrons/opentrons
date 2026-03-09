"""Models for /system/register."""

from pydantic import BaseModel, Field


class PostAuthorizeResponse(BaseModel):
    """Model for the response to POST /system/register."""

    token: str = Field(..., description="the authorization token")

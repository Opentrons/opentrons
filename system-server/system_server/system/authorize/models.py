"""Models for /system/register."""

from typing import Annotated

from pydantic import BaseModel, Field


class PostAuthorizeResponse(BaseModel):
    """Model for the response to POST /system/register."""

    token: Annotated[str, Field(description="the authorization token")]

from pydantic import BaseModel, Field


class V1ErrorMessage(BaseModel):
    """An error response with a human readable message"""
    message: str = Field(..., description="A human-readable error message")

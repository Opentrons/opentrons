from pydantic import BaseModel, Field


class V1BasicResponse(BaseModel):
    """A response with a human readable message"""
    message: str = Field(..., description="A human-readable message")


class EmptyModel(BaseModel):
    pass

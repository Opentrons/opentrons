from typing import Annotated

from pydantic import BaseModel, Field


class InternalServerErrorOutput(BaseModel):
    error: Annotated[str, Field(description="Error description")] = "internal server error"
